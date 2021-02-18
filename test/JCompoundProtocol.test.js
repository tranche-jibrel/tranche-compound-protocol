const {
    BN,
    constants,
    ether,
    balance,
    expectEvent,
    expectRevert,
    time
} = require('@openzeppelin/test-helpers');
const {
    accounts,
    contract,
    web3
} = require('@openzeppelin/test-environment');
const {
    expect
} = require('chai');
const {
    ZERO_ADDRESS
} = constants;

//const BigNumber = web3.utils.BN;
require("chai")
    .use(require("chai-bn")(BN))
    .should();

const JTrancheAToken = contract.fromArtifact('JTrancheAToken');
const JTrancheBToken = contract.fromArtifact('JTrancheBToken');

const {
    deployMinimumFactory,
    sendDAItoProtocol,
    sendDAItoUsers
} = require('./JCompoundProtocolFunctions');

describe('JProtocol', function () {
  const GAS_PRICE = 27000000000; //Gwei = 10 ** 9 wei

  const [tokenOwner, factoryOwner, factoryAdmin, user1, user2, user3, user4, user5, user6] = accounts;

  //beforeEach(async function () {

  //});

  deployMinimumFactory(tokenOwner, factoryOwner, factoryAdmin);

  sendDAItoProtocol(tokenOwner);

  sendDAItoUsers(tokenOwner, user1, user2, user3, user4, user5, user6);

  it("user1 buys some token EthTrA", async function () {
    console.log("User1 Eth balance: "+ web3.utils.fromWei(await web3.eth.getBalance(user1), "ether") + " ETH");
    tx = await this.JCompound.buyTrancheAToken(0, 10, {from: user1, value: web3.utils.toWei("1", "ether")});
    console.log("User1 New Eth balance: "+ web3.utils.fromWei(await web3.eth.getBalance(user1), "ether") + " ETH");
    console.log("User1 trA tokens: "+ web3.utils.fromWei(await this.EthTrA.balanceOf(user1), "ether") + " ETA");
    console.log("JCompound cEth balance: "+ web3.utils.fromWei(await this.CEther.balanceOf(this.JCompound.address), "ether") + " cEth");
  }); 

  it("user1 buys some token EthTrB", async function () {
    //console.log("User1 Eth balance: "+ web3.utils.fromWei(await web3.eth.getBalance(user1), "ether") + " ETH");
    tx = await this.JCompound.buyTrancheBToken(0, 10, {from: user1, value: web3.utils.toWei("1", "ether")});
    console.log("User1 New Eth balance: "+ web3.utils.fromWei(await web3.eth.getBalance(user1), "ether") + " ETH");
    console.log("User1 trA tokens: "+ web3.utils.fromWei(await this.EthTrB.balanceOf(user1), "ether") + " ETB");
    console.log("JCompound cEth balance: "+ web3.utils.fromWei(await this.CEther.balanceOf(this.JCompound.address), "ether") + " cEth");
  }); 

  it("user2 buys some token EthTrA", async function () {
    console.log("User2 Eth balance: "+ web3.utils.fromWei(await web3.eth.getBalance(user2), "ether") + " ETH");
    tx = await this.JCompound.buyTrancheAToken(0, 10, {from: user2, value: web3.utils.toWei("1", "ether")});
    console.log("User2 New Eth balance: "+ web3.utils.fromWei(await web3.eth.getBalance(user2), "ether") + " ETH");
    console.log("User2 trA tokens: "+ web3.utils.fromWei(await this.EthTrA.balanceOf(user2), "ether") + " ETA");
    console.log("JCompound cEth balance: "+ web3.utils.fromWei(await this.CEther.balanceOf(this.JCompound.address), "ether") + " cEth");
  }); 

  it("user2 buys some token EthTrB", async function () {
    //console.log("User1 Eth balance: "+ web3.utils.fromWei(await web3.eth.getBalance(user2), "ether") + " ETH");
    tx = await this.JCompound.buyTrancheBToken(0, 10, {from: user2, value: web3.utils.toWei("1", "ether")});
    console.log("User2 New Eth balance: "+ web3.utils.fromWei(await web3.eth.getBalance(user2), "ether") + " ETH");
    console.log("User2 trA tokens: "+ web3.utils.fromWei(await this.EthTrB.balanceOf(user2), "ether") + " ETB");
    console.log("JCompound cEth balance: "+ web3.utils.fromWei(await this.CEther.balanceOf(this.JCompound.address), "ether") + " cEth");
  }); 

  it("user3 buys some token EthTrA", async function () {
    console.log("User3 Eth balance: "+ web3.utils.fromWei(await web3.eth.getBalance(user3), "ether") + " ETH");
    tx = await this.JCompound.buyTrancheAToken(0, 10, {from: user3, value: web3.utils.toWei("1", "ether")});
    console.log("User3 New Eth balance: "+ web3.utils.fromWei(await web3.eth.getBalance(user3), "ether") + " ETH");
    console.log("User3 trA tokens: "+ web3.utils.fromWei(await this.EthTrA.balanceOf(user3), "ether") + " ETA");
    console.log("JCompound cEth balance: "+ web3.utils.fromWei(await this.CEther.balanceOf(this.JCompound.address), "ether") + " cEth");
  }); 

  it("user3 buys some token EthTrB", async function () {
    //console.log("User1 Eth balance: "+ web3.utils.fromWei(await web3.eth.getBalance(user3), "ether") + " ETH");
    tx = await this.JCompound.buyTrancheBToken(0, 10, {from: user3, value: web3.utils.toWei("1", "ether")});
    console.log("User3 New Eth balance: "+ web3.utils.fromWei(await web3.eth.getBalance(user3), "ether") + " ETH");
    console.log("User3 trA tokens: "+ web3.utils.fromWei(await this.EthTrB.balanceOf(user3), "ether") + " ETB");
    console.log("JCompound cEth balance: "+ web3.utils.fromWei(await this.CEther.balanceOf(this.JCompound.address), "ether") + " cEth");
  }); 

  it('time passes...', async function () {
    let block = await web3.eth.getBlock("latest");
    console.log("Actual Block: " + block.number);
    newBlock = block.number + 100;
    await time.advanceBlockTo(newBlock);
  });

  it("user1 redeems token EthTrA", async function () {
    console.log("User1 Eth balance: "+ web3.utils.fromWei(await web3.eth.getBalance(user1), "ether") + " ETH");
    bal = await this.EthTrA.balanceOf(user1);
    console.log("User1 trA tokens: "+ web3.utils.fromWei(bal, "ether") + " ETA");
    console.log("JCompound cEth balance: "+ web3.utils.fromWei(await this.CEther.balanceOf(this.JCompound.address), "ether") + " cEth");
    tx = await this.EthTrA.approve(this.JCompound.address, bal, {from: user1});
    tx = await this.JCompound.redeemTrancheAToken(0, bal, {from: user1});
    console.log("User1 New Eth balance: "+ web3.utils.fromWei(await web3.eth.getBalance(user1), "ether") + " ETH");
    console.log("User1 trA tokens: "+ web3.utils.fromWei(await this.EthTrA.balanceOf(user1), "ether") + " ETA");
    console.log("JCompound new cEth balance: "+ web3.utils.fromWei(await this.CEther.balanceOf(this.JCompound.address), "ether") + " cEth");
  }); 
/*
  it("user1 buys some token EthTrB", async function () {
    //console.log("User1 Eth balance: "+ web3.utils.fromWei(await web3.eth.getBalance(user1), "ether") + " ETH");
    tx = await this.JCompound.buyTrancheBToken(0, 10, {from: user1, value: web3.utils.toWei("1", "ether")});
    console.log("User1 New Eth balance: "+ web3.utils.fromWei(await web3.eth.getBalance(user1), "ether") + " ETH");
    console.log("User1 trA tokens: "+ web3.utils.fromWei(await this.EthTrB.balanceOf(user1), "ether") + " ETB")
  }); 

*/
});