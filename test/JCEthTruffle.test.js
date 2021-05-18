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

const myERC20 = artifacts.require("myERC20");
const CEther = artifacts.require("CEther");
const CErc20 = artifacts.require("CErc20");
const JAdminTools = artifacts.require('JAdminTools');
const JFeesCollector = artifacts.require('JFeesCollector');

const JCompound = artifacts.require('JCompound');
const JTranchesDeployer = artifacts.require('JTranchesDeployer');

const JTrancheAToken = artifacts.require('JTrancheAToken');
const JTrancheBToken = artifacts.require('JTrancheBToken');

const EthGateway = artifacts.require('./ETHGateway');

const MYERC20_TOKEN_SUPPLY = 5000000;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

let daiContract, cEtherContract, cERC20Contract, jFCContract, jATContract, jTrDeplContract, jCompContract;
let ethTrAContract, ethTrBContract, daiTrAContract, daiTrBContract;
let tokenOwner, user1;

contract("JCompound", function (accounts) {

  it("ETH balances", async function () {
    //accounts = await web3.eth.getAccounts();
    tokenOwner = accounts[0];
    user1 = accounts[1];
    console.log(tokenOwner);
    console.log(await web3.eth.getBalance(tokenOwner));
    console.log(await web3.eth.getBalance(user1));
  });

  it("DAI total Supply", async function () {
    daiContract = await myERC20.deployed();
    result = await daiContract.totalSupply();
    expect(web3.utils.fromWei(result.toString(), "ether")).to.be.equal(MYERC20_TOKEN_SUPPLY.toString());
  });

  it("Mockups ok", async function () {
    cEtherContract = await CEther.deployed();
    expect(cEtherContract.address).to.be.not.equal(ZERO_ADDRESS);
    expect(cEtherContract.address).to.match(/0x[0-9a-fA-F]{40}/);
    console.log(cEtherContract.address);
    cERC20Contract = await CErc20.deployed();
    expect(cERC20Contract.address).to.be.not.equal(ZERO_ADDRESS);
    expect(cERC20Contract.address).to.match(/0x[0-9a-fA-F]{40}/);
    console.log(cERC20Contract.address);
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
    await jCompContract.setRedemptionTimeout(0, {
      from: accounts[0]
    });

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
  });

  it("ETH Gateway", async function () {
    ethGatewayContract = await EthGateway.deployed();
    expect(cEtherContract.address).to.be.not.equal(ZERO_ADDRESS);
    expect(cEtherContract.address).to.match(/0x[0-9a-fA-F]{40}/);
    console.log(ethGatewayContract.address);
  });

  it('send some ETH to CEther', async function () {
    tx = await web3.eth.sendTransaction({
      to: cEtherContract.address,
      from: tokenOwner,
      value: web3.utils.toWei('10', 'ether')
    });
    protBal = await web3.eth.getBalance(cEtherContract.address);
    console.log(`CEther ETH Balance: ${web3.utils.fromWei(protBal, "ether")} ETH`)
    console.log(`tokenOwner Balance: ${await cEtherContract.balanceOf(tokenOwner)} cETH`)
    console.log(`CEther supply Balance: ${await cEtherContract.totalSupply()} cETH`)
    expect(web3.utils.fromWei(protBal, "ether")).to.be.equal(new BN(10).toString());
  });

  it("user1 buys some token EthTrA", async function () {
    console.log(user1);
    console.log("User1 Eth balance: " + web3.utils.fromWei(await web3.eth.getBalance(user1), "ether") + " ETH");
    console.log((await jCompContract.getCompoundPrice(0)).toString());
    trPar = await jCompContract.trancheParameters(0);
    console.log("param tranche A: " + JSON.stringify(trPar));
    console.log("rpb tranche A: " + await jCompContract.getTrancheACurrentRPB(0));
    tx = await jCompContract.calcRPBFromPercentage(0, {
      from: user1
    });
    console.log("rpb tranche A: " + await jCompContract.getTrancheACurrentRPB(0));
    trAPrice = await jCompContract.getTrancheAExchangeRate(0, {
      from: user1
    });
    console.log("price tranche A: " + trAPrice);
    trPar = await jCompContract.trancheParameters(0);
    console.log("param tranche A: " + JSON.stringify(trPar));
    tx = await jCompContract.buyTrancheAToken(0, web3.utils.toWei("1", "ether"), {
      from: user1,
      value: web3.utils.toWei("1", "ether")
    });
    console.log("User1 New Eth balance: " + web3.utils.fromWei(await web3.eth.getBalance(user1), "ether") + " ETH");
    console.log("User1 trA tokens: " + web3.utils.fromWei(await ethTrAContract.balanceOf(user1), "ether") + " ETA");
    console.log("JCompound cEth balance: " + web3.utils.fromWei(await jCompContract.getTokenBalance(cEtherContract.address), "ether") + " cEth");
    console.log("TrA price: " + web3.utils.fromWei(await jCompContract.getTrancheAExchangeRate(0), "ether"));
    console.log("Compound Price: " + await jCompContract.getCompoundPrice(0));
    console.log("TrA price: " + web3.utils.fromWei(await jCompContract.getTrancheAExchangeRate(0), "ether"));
  });

  it("user1 buys some token EthTrB", async function () {
    //console.log("User1 Eth balance: "+ web3.utils.fromWei(await web3.eth.getBalance(user1), "ether") + " ETH");
    tx = await jCompContract.buyTrancheBToken(0, web3.utils.toWei("1", "ether"), {
      from: user1,
      value: web3.utils.toWei("1", "ether")
    });
    console.log("User1 New Eth balance: " + web3.utils.fromWei(await web3.eth.getBalance(user1), "ether") + " ETH");
    console.log("User1 trB tokens: " + web3.utils.fromWei(await ethTrBContract.balanceOf(user1), "ether") + " ETB");
    console.log("JCompound cEth balance: " + web3.utils.fromWei(await jCompContract.getTokenBalance(cEtherContract.address), "ether") + " cEth");
    console.log("TrB price: " + web3.utils.fromWei(await jCompContract.getTrancheBExchangeRate(0, 0), "ether"));
  });

  it('time passes...', async function () {
    let block = await web3.eth.getBlock("latest");
    console.log("Actual Block: " + block.number);
    newBlock = block.number + 100;
    await time.advanceBlockTo(newBlock);
    block = await web3.eth.getBlock("latest");
    console.log("New Actual Block: " + block.number);

    await cEtherContract.setExchangeRateStored(new BN("23230929272867851")); //23230829272867851
    console.log("Compound New price: " + await cEtherContract.exchangeRateStored());
  });

  it("user1 redeems token EthTrA", async function () {
    oldBal = web3.utils.fromWei(await web3.eth.getBalance(user1), "ether");
    console.log("User1 Eth balance: " + oldBal + " ETH");
    bal = await ethTrAContract.balanceOf(user1);
    console.log("User1 trA tokens: " + web3.utils.fromWei(bal, "ether") + " ETA");
    console.log("JCompound cEth balance: " + web3.utils.fromWei(await jCompContract.getTokenBalance(cEtherContract.address), "ether") + " cEth");
    console.log("CEther eth bal:" + web3.utils.fromWei(await web3.eth.getBalance(cEtherContract.address)), "ether");
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
    newBal = web3.utils.fromWei(await web3.eth.getBalance(user1), "ether");
    console.log("User1 New Eth balance: " + newBal + " ETH");
    console.log("User1 trA interest: " + (newBal - oldBal) + " ETH");
    console.log("User1 trA tokens: " + web3.utils.fromWei(await ethTrAContract.balanceOf(user1), "ether") + " ETA");
    console.log("JCompound new cEth balance: " + web3.utils.fromWei(await jCompContract.getTokenBalance(cEtherContract.address), "ether") + " cEth");
    console.log("TrA price: " + web3.utils.fromWei(await jCompContract.getTrancheAExchangeRate(0), "ether"));
  });

  it('time passes...', async function () {
    let block = await web3.eth.getBlock("latest");
    console.log("Actual Block: " + block.number);
    newBlock = block.number + 100;
    await time.advanceBlockTo(newBlock);
    block = await web3.eth.getBlock("latest");
    console.log("New Actual Block: " + block.number);
    await cEtherContract.setExchangeRateStored(new BN("23231029272867851")); //23230929272867851
    console.log("Compound New price: " + await cEtherContract.exchangeRateStored());
  });

  it("user1 redeems token EthTrB", async function () {
    oldBal = web3.utils.fromWei(await web3.eth.getBalance(user1), "ether");
    console.log("User1 Eth balance: " + oldBal + " ETH");
    bal = await ethTrBContract.balanceOf(user1);
    console.log("User1 trB tokens: " + web3.utils.fromWei(bal, "ether") + " ETB");
    console.log("JCompound cEth balance: " + web3.utils.fromWei(await jCompContract.getTokenBalance(cEtherContract.address), "ether") + " cEth");
    trbPrice = web3.utils.fromWei(await jCompContract.getTrancheBExchangeRate(0, 0), "ether")
    console.log("TrB price: " + trbPrice);
    console.log("CEther eth bal:" + web3.utils.fromWei(await web3.eth.getBalance(cEtherContract.address)), "ether");
    //console.log(stPrice.toString());
    tempAmnt = bal * Math.pow(10, -18);
    //console.log(tempAmnt.toString())
    taAmount = tempAmnt * trbPrice;
    console.log(taAmount);
    tx = await ethTrBContract.approve(jCompContract.address, bal, {
      from: user1
    });
    // await expectRevert.unspecified(jCompContract.redeemTrancheBToken(0, bal, {
    //   from: user1
    // }));
    tx = await jCompContract.redeemTrancheBToken(0, bal, {
      from: user1
    });
    newBal = web3.utils.fromWei(await web3.eth.getBalance(user1), "ether");
    console.log("User1 New Eth balance: " + newBal + " ETH");
    console.log("User1 trB interest: " + (newBal - oldBal) + " ETH");
    console.log("User1 trB tokens: " + web3.utils.fromWei(await ethTrBContract.balanceOf(user1), "ether") + " ETB");
    console.log("JCompound new cEth balance: " + web3.utils.fromWei(await jCompContract.getTokenBalance(cEtherContract.address), "ether") + " cEth");
    console.log("TrB price: " + web3.utils.fromWei(await jCompContract.getTrancheBExchangeRate(0, 0), "ether"));
  });
});