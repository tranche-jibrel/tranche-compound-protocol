require('dotenv').config();
const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');

var JAdminTools = artifacts.require("./JAdminTools.sol");
var JFeesCollector = artifacts.require("./JFeesCollector.sol");
var JCompound = artifacts.require('./JCompound');
var JTranchesDeployer = artifacts.require('./JTranchesDeployer');

var JTrancheAToken = artifacts.require('./JTrancheAToken');
var JTrancheBToken = artifacts.require('./JTrancheBToken');

var EthGateway = artifacts.require('./ETHGateway');

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const COMP_ADDRESS = "0xc00e94cb662c3520282e6f5717214004a7f26888";  // COMP TOKEN
const COMP_CONTROLLER = "0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B";
const SLICE_ADDRESS = "0x0aee8703d34dd9ae107386d3eff22ae75dd616d1";
const DAI_ADDRESS = "0x6B175474E89094C44Da98b954EedeAC495271d0F";  // dai - cDai is tranche 1 in JCompound
const CDAI_ADDRESS = "0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643";
const CETH_ADDRESS = "0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5";

// const AdminTools = "0x8532477A282DA1f68BB49F0893714e10F03d6186";
// const FeesCollector = "0x16d7dFBa832722F240915e63198e411153AC602b"; 
// const TranchesDeployer = "0x8cae1786645184BBc9078e50CeD90ac9eE0b3ADE";
// const JCompoundAddress = "0x05060F5ab3e7A98E180B418A96fFc82A85b115e7";
// const JCHelper = "0x8a0c35A0241Cc04e075aaad3F501585d3b2a6dD5";

module.exports = async (deployer, network, accounts) => {
  // const MYERC20_TOKEN_SUPPLY = 5000000;

  //const daiRequest = 100 * Math.pow(10, 18);
  //const DAI_REQUEST_HEX = "0x" + daiRequest.toString(16);
  //const ethRpb = 1 * Math.pow(10, 9);
  //const ETH_RPB_HEX = "0x" + ethRpb.toString(16);

  if (network == "development") {
    const factoryOwner = accounts[0];

    const JATinstance = await deployProxy(JAdminTools, [], { from: factoryOwner });
    console.log('JAdminTools Deployed: ', JATinstance.address);

    const JFCinstance = await deployProxy(JFeesCollector, [JATinstance.address], { from: factoryOwner });
    console.log('JFeesCollector Deployed: ', JFCinstance.address);

    const JTDeployer = await deployProxy(JTranchesDeployer, [], { from: factoryOwner });
    console.log("Tranches Deployer: " + JTDeployer.address);

    const JCinstance = await deployProxy(JCompound, [JATinstance.address, JFCinstance.address, JTDeployer.address,
      COMP_ADDRESS, COMP_CONTROLLER], { from: factoryOwner });
    console.log('JCompound Deployed: ', JCinstance.address);

    await deployer.deploy(EthGateway, CETH_ADDRESS, JCinstance.address);
    const JEGinstance = await EthGateway.deployed();
    console.log('ETHGateway Deployed: ', JEGinstance.address);

    await JTDeployer.setJCompoundAddresses(JCinstance.address, JATinstance.address, { from: factoryOwner });

    await JCinstance.setETHGateway(JEGinstance.address, { from: factoryOwner });

    await JATinstance.addAdmin(JTDeployer.address, { from: factoryOwner })

    await JCinstance.setCEtherContract(CETH_ADDRESS, { from: factoryOwner });
    
    await JCinstance.addTrancheToProtocol(ZERO_ADDRESS, "jEthTrancheAToken", "JEA", "jEthTrancheBToken", "JEB", web3.utils.toWei("0.04", "ether"), 8, 18, { from: factoryOwner });
    trParams = await JCinstance.trancheAddresses(0);
    let EthTrA = await JTrancheAToken.at(trParams.ATrancheAddress);
    console.log("Eth Tranche A Token Address: " + EthTrA.address);
    let EthTrB = await JTrancheBToken.at(trParams.BTrancheAddress);
    console.log("Eth Tranche B Token Address: " + EthTrB.address);

    await JCinstance.setTrancheDeposit(0, true); // enabling deposit

    await JCinstance.setCTokenContract(DAI_ADDRESS, CDAI_ADDRESS, { from: factoryOwner });
    await JCinstance.addTrancheToProtocol(DAI_ADDRESS, "jDaiTrancheAToken", "JDA", "jDaiTrancheBToken", "JDB", web3.utils.toWei("0.02", "ether"), 8, 18, { from: factoryOwner });
    trParams = await JCinstance.trancheAddresses(1);
    let DaiTrA = await JTrancheAToken.at(trParams.ATrancheAddress);
    console.log("DAI Tranche A Token Address: " + DaiTrA.address);
    let DaiTrB = await JTrancheBToken.at(trParams.BTrancheAddress);
    console.log("DAI Tranche B Token Address: " + DaiTrB.address);

    await JCinstance.setTrancheDeposit(1, true); // enabling deposit

  } else if (network == "kovan") {
    let { 
      IS_UPGRADE, TRANCHE_ONE_TOKEN_ADDRESS, TRANCHE_ONE_CTOKEN_ADDRESS, TRANCHE_TWO_TOKEN_ADDRESS, TRANCHE_TWO_CTOKEN_ADDRESS, COMP_ADDRESS, COMP_CONTROLLER, SLICE_ADDRESS, FEE_COLLECTOR_ADDRESS
    } = process.env;
    const accounts = await web3.eth.getAccounts();
    const factoryOwner = accounts[0];
    if (IS_UPGRADE == 'true') {
      console.log('contracts are being upgraded');
      const JFCinstance = await upgradeProxy("0xc5639ad2431BBf031f70501c70b47C321867367E", JCompound, { from: factoryOwner });
      console.log(`FEE_COLLECTOR_ADDRESS=${JFCinstance.address}`)
    } else {
      // deployed new contract
      try {
        const JATinstance = await JAdminTools.at("0xb1c8993C9C8Fb4bCBFA07a7688f0BDd3Ad6775C0");
        console.log('JAdminTools Deployed: ', JATinstance.address);

        const JFCinstance = await  JFeesCollector.at("0xC0c7EFB8d45dC65ed343FC6e6433812cB43315b1");
        console.log('JFeesCollector Deployed: ', JFCinstance.address);

        const compoundDeployer = await JTranchesDeployer.at("0x19f792fBA533D5fa9b30da496fA4Cb06CBCdD1cc")
        console.log(`COMPOUND_DEPLOYER=${compoundDeployer.address}`);

        // Source: https://github.com/compound-finance/compound-config/blob/master/networks/kovan.json
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
        //await JCompoundInstance.addTrancheToProtocol(ZERO_ADDRESS, "Tranche A - Compound ETH", "ACETH", "Tranche B - Compound ETH", "BCETH", web3.utils.toWei("0.04", "ether"), 8, 18, { from: factoryOwner });
        // await JCompoundInstance.addTrancheToProtocol("0xb7a4f3e9097c08da09517b5ab877f7a917224ede", "Tranche A - Compound USDC", "ACUSDC", "Tranche B - Compound USDC", "BCUSDC", web3.utils.toWei("0.02", "ether"), 8, 6, { from: factoryOwner });
        await JCompoundInstance.addTrancheToProtocol(TRANCHE_TWO_TOKEN_ADDRESS, "Tranche A - Compound USDT", "ACUSDT", "Tranche B - Compound USDT", "BCUSDT", web3.utils.toWei("0.01148", "ether"), 8, 6, { from: factoryOwner });

        trParams = await JCompoundInstance.trancheAddresses(0);
        let DaiTrA = await JTrancheAToken.at(trParams.ATrancheAddress);
        let DaiTrB = await JTrancheBToken.at(trParams.BTrancheAddress);
        trParams = await JCompoundInstance.trancheAddresses(1);
        let USDCTrA = await JTrancheAToken.at(trParams.ATrancheAddress);
        let USDCTrB = await JTrancheBToken.at(trParams.BTrancheAddress);

        console.log(`COMPOUND_TRANCHE_ADDRESS=${JCompoundInstance.address}`);
        console.log(`REACT_APP_COMP_TRANCHE_TOKENS=${DaiTrA.address},${DaiTrB.address},${USDTTrA.address},${USDTTrB.address}`)
      } catch (error) {
        console.log(error);
      }
    }
  } else if (network == "mainnet") {
    let { 
      IS_UPGRADE, TRANCHE_ONE_TOKEN_ADDRESS, TRANCHE_ONE_CTOKEN_ADDRESS, TRANCHE_TWO_TOKEN_ADDRESS, TRANCHE_TWO_CTOKEN_ADDRESS, COMP_ADDRESS, COMP_CONTROLLER, SLICE_ADDRESS, 
      FEE_COLLECTOR_ADDRESS, COMPOUND_TRANCHE_ADDRESS
    } = process.env;
    const accounts = await web3.eth.getAccounts();
    const factoryOwner = accounts[0];
    if (IS_UPGRADE == 'true') {
      console.log('contracts are being upgraded');
      const JCompoundInstance = await upgradeProxy(COMPOUND_TRANCHE_ADDRESS, JCompound, { from: factoryOwner });
      console.log(`COMPOUND_TRANCHE_ADDRESS=${JCompoundInstance.address}`)
    } else {
      try {
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

        console.log(`COMPOUND_TRANCHE_ADDRESS=${JCompoundInstance.address}`);
        console.log(`REACT_APP_COMP_TRANCHE_TOKENS=${DaiTrA.address},${DaiTrB.address},${USDCTrA.address},${USDCTrB.address}`)
      } catch (error) {
        console.log(error);
      }
    }
  }
}