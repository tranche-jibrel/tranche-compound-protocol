
const { upgradeProxy, deployProxy } = require('@openzeppelin/truffle-upgrades');
var JCompound = artifacts.require('./JCompound');
var myERC20 = artifacts.require("./mocks/myERC20.sol");
var JAdminTools = artifacts.require("./JAdminTools.sol");
var JFeesCollector = artifacts.require("./JFeesCollector.sol");
var JTranchesDeployer = artifacts.require('./JTranchesDeployer');
var JTrancheAToken = artifacts.require('./JTrancheAToken');
var JTrancheBToken = artifacts.require('./JTrancheBToken');
var IncentivesController = artifacts.require('./mocks/IncentivesController');
var JCompoundHelper = artifacts.require('./JCompoundHelper');
const Web3 = require('web3');
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

const {
  time
} = require('@openzeppelin/test-helpers');

// TODO: move these address in .env file
const IS_UPGRADE = false;
const isProduction = false;
const IS_TEST = false;

let JCompoundAddress = "0x3Fb969838994cE71fA3c4ec393C823de2D5a3a68";
const owner = "0x5ad3330aebdd74d7dda641d37273ac1835ee9330";

contract('Jcompound ', (accounts) => {

  it("production jcompound", async () => {
    if (isProduction) {
      let factoryOwner = accounts[0];
      console.log('factory owner' + factoryOwner);
      //tranche 1 -> DAI / CDAI mainnet
      const COMP_ADDRESS = "0xc00e94cb662c3520282e6f5717214004a7f26888";
      const COMP_CONTROLLER = "0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B";
      const SLICE_ADDRESS = "0x0aee8703d34dd9ae107386d3eff22ae75dd616d1";
      const TRANCHE_ONE_TOKEN_ADDRESS = "0x6b175474e89094c44da98b954eedeac495271d0f"
      const TRANCHE_ONE_CTOKEN_ADDRESS = "0x5d3a536e4d6dbd6114cc1ead35777bab948e3643"

      //tranche 2 -> USDC / CUSDC mainnet
      const TRANCHE_TWO_TOKEN_ADDRESS = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
      const TRANCHE_TWO_CTOKEN_ADDRESS = "0x39aa39c021dfbae8fac545936693ac917d5e7563"
      const JATinstance = await deployProxy(JAdminTools, [], { from: factoryOwner });
      console.log('JAdminTools Deployed: ', JATinstance.address);

      const JFCinstance = await deployProxy(JFeesCollector, [JATinstance.address], { from: factoryOwner });
      console.log('JFeesCollector Deployed: ', JFCinstance.address);

      const compoundDeployer = await deployProxy(JTranchesDeployer, [], { from: factoryOwner, unsafeAllowCustomTypes: true });
      console.log(`COMPOUND_DEPLOYER=${compoundDeployer.address}`);

      const JCompoundInstance = await deployProxy(JCompound, [JATinstance.address, JFCinstance.address, compoundDeployer.address, COMP_ADDRESS, COMP_CONTROLLER, SLICE_ADDRESS],
        { from: factoryOwner });

      console.log(`COMPOUND_TRANCHE_ADDRESS=${JCompoundInstance.address}`);
      compoundDeployer.setJCompoundAddress(JCompoundInstance.address);
      console.log('compound deployer 1');

      await JCompoundInstance.setCTokenContract(TRANCHE_ONE_TOKEN_ADDRESS, TRANCHE_ONE_CTOKEN_ADDRESS, { from: factoryOwner });
      console.log('compound deployer 2');

      await JCompoundInstance.setCTokenContract(TRANCHE_TWO_TOKEN_ADDRESS, TRANCHE_TWO_CTOKEN_ADDRESS, { from: factoryOwner });

      console.log('compound deployer 3');
      await JCompoundInstance.addTrancheToProtocol(TRANCHE_ONE_TOKEN_ADDRESS, "Tranche A - Compound DAI", "ACDAI", "Tranche B - Compound DAI", "BCDAI", web3.utils.toWei("0.021632", "ether"), 8, 18, { from: factoryOwner });

      console.log('compound deployer 4');
      await JCompoundInstance.addTrancheToProtocol(TRANCHE_TWO_TOKEN_ADDRESS, "Tranche A - Compound USDC", "ACUSDC", "Tranche B - Compound USDC", "BCUSDC", web3.utils.toWei("0.01148", "ether"), 8, 6, { from: factoryOwner });

      trParams = await JCompoundInstance.trancheAddresses(0);
      let DaiTrA = await JTrancheAToken.at(trParams.ATrancheAddress);
      let DaiTrB = await JTrancheBToken.at(trParams.BTrancheAddress);
      trParams = await JCompoundInstance.trancheAddresses(1);
      let USDCTrA = await JTrancheAToken.at(trParams.ATrancheAddress);
      let USDCTrB = await JTrancheBToken.at(trParams.BTrancheAddress);
      JCompoundAddress = JCompoundInstance.address;
      console.log(`COMPOUND_TRANCHE_ADDRESS=${JCompoundInstance.address}`);
      console.log(`REACT_APP_COMP_TRANCHE_TOKENS=${DaiTrA.address},${DaiTrB.address},${USDCTrA.address},${USDCTrB.address}`)
    }
  })

  it("upgrade jcompound", async () => {
    if (IS_UPGRADE) {
      let factoryOwner = accounts[0];
      console.log(factoryOwner)
      const JcompoundInstance = await upgradeProxy(JCompoundAddress, JCompound, { from: factoryOwner });
      console.log('is contract upgraded', JcompoundInstance.address)
      const JCHelper = await deployProxy(JCompoundHelper, [], { from: factoryOwner });
      console.log("JC Helper: " + JCHelper.address);
      await JcompoundInstance.setJCompoundHelperAddress(JCHelper.address)
      const icInstance = await deployProxy(IncentivesController, [], { from: factoryOwner });
      console.log(`INCENTIVE_CONTROLLER=${icInstance.address}`);
      await JcompoundInstance.setincentivesControllerAddress(icInstance.address, { from: factoryOwner })
      await JcompoundInstance.setTrancheDeposit(0, true, { from: factoryOwner })
      console.log('enable second tranche')
      await JcompoundInstance.setTrancheDeposit(1, true, { from: factoryOwner })
    }
  });

  it("initial setup ", async () => {
    console.log('owner', owner);
    if (!IS_UPGRADE || isProduction) {
      this.JCompound = await JCompound.at(JCompoundAddress)
      let trParams = await this.JCompound.trancheAddresses(0);
      this.DAI = await myERC20.at(trParams.buyerCoinAddress);
      this.trancheADAI = await myERC20.at(trParams.ATrancheAddress);
      this.trancheBDAI = await myERC20.at(trParams.BTrancheAddress);
    }
  });


  it("tranche DAI deposit", async () => {
    if (IS_TEST || isProduction) {
      console.log("User1 New DAI balance: " + web3.utils.fromWei(await this.DAI.balanceOf(owner), "ether") + " DAI");
      console.log("User1 New Tranche A balance: " + web3.utils.fromWei(await this.trancheADAI.balanceOf(owner), "ether") + " DAI");
      tx = await this.DAI.approve(this.JCompound.address, web3.utils.toWei("10000", "ether"), { from: owner });
      tx = await this.JCompound.buyTrancheAToken(0, web3.utils.toWei("10", "ether"), { from: owner });
      console.log("User1 New DAI balance: " + web3.utils.fromWei(await this.DAI.balanceOf(owner), "ether") + " DAI");
      console.log("User1 New Tranche A balance: " + web3.utils.fromWei(await this.trancheADAI.balanceOf(owner), "ether") + " DAI");

      console.log("User1 New Tranche B balance: " + web3.utils.fromWei(await this.trancheBDAI.balanceOf(owner), "ether") + " DAI");
      tx = await this.JCompound.buyTrancheBToken(0, web3.utils.toWei("10", "ether"), { from: owner });
      console.log("User1 New DAI balance: " + web3.utils.fromWei(await this.DAI.balanceOf(owner), "ether") + " DAI");
      console.log("User1 New Tranche B balance: " + web3.utils.fromWei(await this.trancheBDAI.balanceOf(owner), "ether") + " DAI");
    }
  });

  it('time passes...', async function () {
    let block = await web3.eth.getBlock("latest");
    console.log("Actual Block: " + block.number);
    newBlock = block.number + 100;
    await time.advanceBlockTo(newBlock);
    block = await web3.eth.getBlock("latest");
    console.log("Actual Block: " + block.number);
  });

  it("tranche A DAI withdraw", async () => {
    if (IS_TEST || isProduction) {
      console.log("User1 New DAI balance: " + web3.utils.fromWei(await this.DAI.balanceOf(owner), "ether") + " DAI");
      console.log("User1 New Tranche A balance: " + web3.utils.fromWei(await this.trancheADAI.balanceOf(owner), "ether") + " DAI");
      tx = await this.trancheADAI.approve(this.JCompound.address, web3.utils.toWei("10000", "ether"), { from: owner });
      tx = await this.JCompound.redeemTrancheAToken(0, web3.utils.toWei("10", "ether"), { from: owner });
      console.log("User1 New DAI balance: " + web3.utils.fromWei(await this.DAI.balanceOf(owner), "ether") + " DAI");
      console.log("User1 New Tranche A balance: " + web3.utils.fromWei(await this.trancheADAI.balanceOf(owner), "ether") + " DAI");
    }
  });

  it('time passes...', async function () {
    let block = await web3.eth.getBlock("latest");
    console.log("Actual Block: " + block.number);
    newBlock = block.number + 100;
    await time.advanceBlockTo(newBlock);
    block = await web3.eth.getBlock("latest");
    console.log("Actual Block: " + block.number);
  });

  it("tranche B DAI  withdraw", async () => {
    if (IS_TEST || isProduction) {
      tx = await this.trancheBDAI.approve(this.JCompound.address, web3.utils.toWei("10000", "ether"), { from: owner });
      tx = await this.JCompound.redeemTrancheBToken(0, web3.utils.toWei("10", "ether"), { from: owner });
      console.log("User1 New DAI balance: " + web3.utils.fromWei(await this.DAI.balanceOf(owner), "ether") + " DAI");
      console.log("User1 New Tranche B balance: " + web3.utils.fromWei(await this.trancheBDAI.balanceOf(owner), "ether") + " DAI");
    }
  })

});