const {
  deployProxy,
  upgradeProxy
} = require('@openzeppelin/truffle-upgrades');
const {
  expect
} = require('chai');

const Web3 = require('web3');
// Ganache UI on 8545
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

const {
  BN,
  constants,
  expectEvent,
  expectRevert,
  time
} = require('@openzeppelin/test-helpers');

const JAdminTools = artifacts.require('JAdminTools');
const JFeesCollector = artifacts.require('JFeesCollector');

const JCompound = artifacts.require('JCompound');
const JTranchesDeployer = artifacts.require('JTranchesDeployer');

const JTrancheAToken = artifacts.require('JTrancheAToken');
const JTrancheBToken = artifacts.require('JTrancheBToken');

const EthGateway = artifacts.require('./ETHGateway');

const MultiRewards = artifacts.require('MultiRewards');

const {ZERO_ADDRESS} = constants;

const COMP_ADDRESS = "0xc00e94cb662c3520282e6f5717214004a7f26888";  // COMP TOKEN
const COMP_CONTROLLER = "0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B";
const SLICE_ADDRESS = "0x0aee8703d34dd9ae107386d3eff22ae75dd616d1";
const DAI_ADDRESS = "0x6B175474E89094C44Da98b954EedeAC495271d0F";  // dai - cDai is tranche 1 in JCompound
const CDAI_ADDRESS = "0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643";
const CETH_ADDRESS = "0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5";  // eth - cEth is tranche 0 in JCompound

const unblockedAccount = "0x38720D56899d46cAD253d08f7cD6CC89d2c83190";

const fromWei = (x) => web3.utils.fromWei(x.toString());
const toWei = (x) => web3.utils.toWei(x.toString());
const fromWei8Dec = (x) => x / Math.pow(10, 8);
const toWei8Dec = (x) => x * Math.pow(10, 8);

let daiContract, jFCContract, jATContract, jTrDeplContract, jCompContract;
let ethTrAContract, ethTrBContract, daiTrAContract, daiTrBContract;
let tokenOwner, user1;

contract("JCompound ETH", function (accounts) {

  it("ETH balances", async function () {
    //accounts = await web3.eth.getAccounts();
    tokenOwner = accounts[0];
    user1 = accounts[1];
    console.log(tokenOwner);
    console.log(await web3.eth.getBalance(tokenOwner));
    console.log(await web3.eth.getBalance(user1));
  });

  it("All other contracts ok", async function () {
    jFCContract = await JFeesCollector.deployed();
    expect(jFCContract.address).to.be.not.equal(ZERO_ADDRESS);
    expect(jFCContract.address).to.match(/0x[0-9a-fA-F]{40}/);
    console.log(jFCContract.address);

    jATContract = await JAdminTools.deployed();
    expect(jATContract.address).to.be.not.equal(ZERO_ADDRESS);
    expect(jATContract.address).to.match(/0x[0-9a-fA-F]{40}/);
    console.log(jATContract.address);

    jTrDeplContract = await JTranchesDeployer.deployed();
    expect(jTrDeplContract.address).to.be.not.equal(ZERO_ADDRESS);
    expect(jTrDeplContract.address).to.match(/0x[0-9a-fA-F]{40}/);
    console.log(jTrDeplContract.address);

    jCompContract = await JCompound.deployed();
    expect(jCompContract.address).to.be.not.equal(ZERO_ADDRESS);
    expect(jCompContract.address).to.match(/0x[0-9a-fA-F]{40}/);
    console.log(jCompContract.address);

    trParams0 = await jCompContract.trancheAddresses(0);
    ethTrAContract = await JTrancheAToken.at(trParams0.ATrancheAddress);
    expect(ethTrAContract.address).to.be.not.equal(ZERO_ADDRESS);
    expect(ethTrAContract.address).to.match(/0x[0-9a-fA-F]{40}/);
    console.log(ethTrAContract.address);

    ethTrBContract = await JTrancheBToken.at(trParams0.BTrancheAddress);
    expect(ethTrBContract.address).to.be.not.equal(ZERO_ADDRESS);
    expect(ethTrBContract.address).to.match(/0x[0-9a-fA-F]{40}/);
    console.log(ethTrBContract.address);

    trParams1 = await jCompContract.trancheAddresses(1);
    daiTrAContract = await JTrancheAToken.at(trParams1.ATrancheAddress);
    expect(daiTrAContract.address).to.be.not.equal(ZERO_ADDRESS);
    expect(daiTrAContract.address).to.match(/0x[0-9a-fA-F]{40}/);
    console.log(daiTrAContract.address);

    daiTrBContract = await JTrancheBToken.at(trParams1.BTrancheAddress);
    expect(daiTrBContract.address).to.be.not.equal(ZERO_ADDRESS);
    expect(daiTrBContract.address).to.match(/0x[0-9a-fA-F]{40}/);
    console.log(daiTrBContract.address);
    
    jMultiRewardsContract = await MultiRewards.at(trParams1.BTrancheAddress);
    expect(jMultiRewardsContract.address).to.be.not.equal(ZERO_ADDRESS);
    expect(jMultiRewardsContract.address).to.match(/0x[0-9a-fA-F]{40}/);
    console.log(jMultiRewardsContract.address);
  });

  it("ETH Gateway", async function () {
    ethGatewayContract = await EthGateway.deployed();
    expect(ethGatewayContract.address).to.be.not.equal(ZERO_ADDRESS);
    expect(ethGatewayContract.address).to.match(/0x[0-9a-fA-F]{40}/);
    console.log(ethGatewayContract.address);
  });

  it("user1 buys some token EthTrA", async function () {
    console.log(user1);
    console.log("User1 Eth balance: " + fromWei(await web3.eth.getBalance(user1)) + " ETH");
    trAddresses = await jCompContract.trancheAddresses(0); //.cTokenAddress;
    trPars = await jCompContract.trancheParameters(0);
    console.log("Compound Price: " + await jCompContract.getCompoundPrice(trAddresses[1], trPars[6], trPars[5]));
    trPar = await jCompContract.trancheParameters(0);
    console.log("param tranche A: " + JSON.stringify(trPar));
    console.log("rpb tranche A: " + trPar[3].toString());
    tx = await jCompContract.calcRPBFromPercentage(0, {
      from: user1
    });

    trPar = await jCompContract.trancheParameters(0);
    console.log("rpb tranche A: " + trPar[3].toString());
    console.log("TrA price: " + fromWei(trPar[2].toString()));
    trPar = await jCompContract.trancheParameters(0);
    console.log("param tranche A: " + JSON.stringify(trPar));
    tx = await jCompContract.buyTrancheAToken(0, toWei("1"), {
      from: user1,
      value: toWei("1")
    });
    console.log("User1 New Eth balance: " + fromWei(await web3.eth.getBalance(user1)) + " ETH");
    console.log("User1 trA tokens: " + fromWei(await ethTrAContract.balanceOf(user1)) + " ETA");
    console.log("JCompound cEth balance: " + fromWei8Dec(await jCompContract.getTokenBalance(CETH_ADDRESS)) + " cEth");
    trPar = await jCompContract.trancheParameters(0);
    console.log("TrA price: " + fromWei(trPar[2].toString()));
    trAddresses = await jCompContract.trancheAddresses(0); //.cTokenAddress;
    trPars = await jCompContract.trancheParameters(0);
    console.log("Compound Price: " + await jCompContract.getCompoundPrice(trAddresses[1], trPars[6], trPars[5]));
    trPar = await jCompContract.trancheParameters(0);
    console.log("TrA price: " + fromWei(trPar[2].toString()));
  
    console.log("staker counter trA: " + (await jCompContract.stakeCounterTrA(user1, 0)).toString())
    stkDetails = await jCompContract.stakingDetailsTrancheA(user1, 0, 1);
    console.log("startTime: " + stkDetails[0].toString() + ", amount: " + stkDetails[1].toString() )
  });

  it("user1 buys some token EthTrB", async function () {
    //console.log("User1 Eth balance: "+ fromWei(await web3.eth.getBalance(user1)) + " ETH");
    tx = await jCompContract.buyTrancheBToken(0, toWei("1"), {
      from: user1,
      value: toWei("1")
    });
    console.log("User1 New Eth balance: " + fromWei(await web3.eth.getBalance(user1)) + " ETH");
    console.log("User1 trB tokens: " + fromWei(await ethTrBContract.balanceOf(user1)) + " ETB");
    console.log("JCompound cEth balance: " + fromWei8Dec(await jCompContract.getTokenBalance(CETH_ADDRESS)) + " cEth");
    console.log("TrB price: " + fromWei(await jCompContract.getTrancheBExchangeRate(0, 0)));
  
    console.log("staker counter trB: " + (await jCompContract.stakeCounterTrB(user1, 0)).toString())
    stkDetails = await jCompContract.stakingDetailsTrancheB(user1, 0, 1);
    console.log("startTime: " + stkDetails[0].toString() + ", amount: " + stkDetails[1].toString() )
  });

  it('time passes...', async function () {
    let block = await web3.eth.getBlock("latest");
    console.log("Actual Block: " + block.number);
    newBlock = block.number + 100;
    await time.advanceBlockTo(newBlock);
    block = await web3.eth.getBlock("latest");
    console.log("New Actual Block: " + block.number);
  });

  it("user1 redeems token EthTrA", async function () {
    oldBal = fromWei(await web3.eth.getBalance(user1));
    console.log("User1 Eth balance: " + oldBal + " ETH");
    bal = await ethTrAContract.balanceOf(user1);
    console.log("User1 trA tokens: " + fromWei(bal) + " ETA");
    console.log("JCompound cEth balance: " + fromWei8Dec(await jCompContract.getTokenBalance(CETH_ADDRESS)) + " cEth");
    trPar = await jCompContract.trancheParameters(0);
    stPrice = trPar.storedTrancheAPrice * Math.pow(10, -18);
    //console.log(stPrice.toString());
    tempAmnt = bal * Math.pow(10, -18);
    //console.log(tempAmnt.toString())
    taAmount = tempAmnt * stPrice;
    console.log(taAmount);
    tx = await ethTrAContract.approve(jCompContract.address, bal, {
      from: user1
    });
    // await expectRevert.unspecified(jCompContract.redeemTrancheAToken(0, bal, {
    //   from: user1
    // }));
    tx = await jCompContract.redeemTrancheAToken(0, bal, {
      from: user1
    });
    newBal = fromWei(await web3.eth.getBalance(user1));
    console.log("User1 New Eth balance: " + newBal + " ETH");
    console.log("User1 trA interest: " + (newBal - oldBal) + " ETH");
    console.log("User1 trA tokens: " + fromWei(await ethTrAContract.balanceOf(user1)) + " ETA");
    console.log("JCompound new cEth balance: " + fromWei8Dec(await jCompContract.getTokenBalance(CETH_ADDRESS)) + " cEth");
    trPar = await jCompContract.trancheParameters(0);
    console.log("TrA price: " + fromWei(trPar[2].toString()));
  
    console.log("staker counter trA: " + (await jCompContract.stakeCounterTrA(user1, 0)).toString())
    stkDetails = await jCompContract.stakingDetailsTrancheA(user1, 0, 1);
    console.log("startTime: " + stkDetails[0].toString() + ", amount: " + stkDetails[1].toString() )
  });

  it('time passes...', async function () {
    let block = await web3.eth.getBlock("latest");
    console.log("Actual Block: " + block.number);
    newBlock = block.number + 100;
    await time.advanceBlockTo(newBlock);
    block = await web3.eth.getBlock("latest");
    console.log("New Actual Block: " + block.number);
  });

  it("user1 redeems token EthTrB", async function () {
    oldBal = fromWei(await web3.eth.getBalance(user1));
    console.log("User1 Eth balance: " + oldBal + " ETH");
    bal = await ethTrBContract.balanceOf(user1);
    console.log("User1 trB tokens: " + fromWei(bal) + " ETB");
    console.log("JCompound cEth balance: " + fromWei8Dec(await jCompContract.getTokenBalance(CETH_ADDRESS)) + " cEth");
    trbPrice = fromWei(await jCompContract.getTrancheBExchangeRate(0, 0))
    console.log("TrB price: " + trbPrice);
    //console.log(stPrice.toString());
    tempAmnt = bal * Math.pow(10, -18);
    //console.log(tempAmnt.toString())
    taAmount = tempAmnt * trbPrice;
    console.log(taAmount);
    tx = await ethTrBContract.approve(jCompContract.address, bal, {
      from: user1
    });

    tx = await jCompContract.redeemTrancheBToken(0, bal, {
      from: user1
    });
    newBal = fromWei(await web3.eth.getBalance(user1));
    console.log("User1 New Eth balance: " + newBal + " ETH");
    console.log("User1 trB interest: " + (newBal - oldBal) + " ETH");
    console.log("User1 trB tokens: " + fromWei(await ethTrBContract.balanceOf(user1)) + " ETB");
    console.log("JCompound new cEth balance: " + fromWei8Dec(await jCompContract.getTokenBalance(CETH_ADDRESS)) + " cEth");
    console.log("TrB price: " + fromWei(await jCompContract.getTrancheBExchangeRate(0, 0)));
  
    console.log("staker counter trB: " + (await jCompContract.stakeCounterTrB(user1, 0)).toString())
    stkDetails = await jCompContract.stakingDetailsTrancheB(user1, 0, 1);
    console.log("startTime: " + stkDetails[0].toString() + ", amount: " + stkDetails[1].toString() )
  });
});