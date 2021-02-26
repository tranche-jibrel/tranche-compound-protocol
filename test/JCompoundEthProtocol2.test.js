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
    sendcETHtoProtocol,
    sendDAItoUsers
} = require('./JCompoundProtocolFunctions');

describe('JProtocol', function () {
  const GAS_PRICE = 27000000000; //Gwei = 10 ** 9 wei

  const [tokenOwner, factoryOwner, factoryAdmin, user1, user2, user3, user4, user5, user6] = accounts;

  //beforeEach(async function () {

  //});

  deployMinimumFactory(tokenOwner, factoryOwner, factoryAdmin);

  //sendcETHtoProtocol(tokenOwner);

  //sendDAItoUsers(tokenOwner, user1, user2, user3, user4, user5, user6);

  it('send some ETH to CEther', async function () {
    tx = await web3.eth.sendTransaction({to: this.CEther.address, from: tokenOwner, value: web3.utils.toWei('10', 'ether')});
    //console.log("Gas to transfer ETH to JCompound: " + tx.receipt.gasUsed);
    // totcost = tx.receipt.gasUsed * GAS_PRICE;
    // console.log("transfer token costs: " + web3.utils.fromWei(totcost.toString(), 'ether') + " ETH");
    protBal = await  web3.eth.getBalance(this.CEther.address);
    console.log(`protocol ETH Balance: ${web3.utils.fromWei(protBal, "ether")} ETH`)
    expect(web3.utils.fromWei(protBal, "ether")).to.be.equal(new BN(10).toString());
  });

  it("user1 buys some token EthTrA", async function () {
    console.log("User1 Eth balance: "+ web3.utils.fromWei(await web3.eth.getBalance(user1), "ether") + " ETH");
    tx = await this.JCompound.buyTrancheAToken(0, 10, {from: user1, value: web3.utils.toWei("1", "ether")});
    console.log("User1 New Eth balance: "+ web3.utils.fromWei(await web3.eth.getBalance(user1), "ether") + " ETH");
    console.log("User1 trA tokens: "+ web3.utils.fromWei(await this.EthTrA.balanceOf(user1), "ether") + " ETA");
    console.log("JCompound cEth balance: "+ web3.utils.fromWei(await this.JCompound.getTokenBalance(this.CEther.address), "ether") + " cEth");
    console.log("TrA price: " +  web3.utils.fromWei(await this.JCompound.getTrancheAExchangeRate(0), "ether"));
    console.log("Compound Price: " + await this.JCompound.getCompoundPrice(0));
    console.log("TrA price: " +  web3.utils.fromWei(await this.JCompound.getTrancheAExchangeRate(0), "ether"));
  }); 

  it("user1 buys some token EthTrB", async function () {
    //console.log("User1 Eth balance: "+ web3.utils.fromWei(await web3.eth.getBalance(user1), "ether") + " ETH");
    tx = await this.JCompound.buyTrancheBToken(0, 10, {from: user1, value: web3.utils.toWei("1", "ether")});
    console.log("User1 New Eth balance: "+ web3.utils.fromWei(await web3.eth.getBalance(user1), "ether") + " ETH");
    console.log("User1 trA tokens: "+ web3.utils.fromWei(await this.EthTrB.balanceOf(user1), "ether") + " ETB");
    console.log("JCompound cEth balance: "+ web3.utils.fromWei(await this.JCompound.getTokenBalance(this.CEther.address), "ether") + " cEth");
    console.log("TrB price: " + web3.utils.fromWei(await this.JCompound.getTrancheBExchangeRate(0, 0, true), "ether"));
  }); 


  it('time passes...', async function () {
    let block = await web3.eth.getBlock("latest");
    console.log("Actual Block: " + block.number);
    newBlock = block.number + 100;
    await time.advanceBlockTo(newBlock);
  });

  it("user1 redeems token EthTrA", async function () {
    oldBal = web3.utils.fromWei(await web3.eth.getBalance(user1), "ether");
    console.log("User1 Eth balance: "+ oldBal + " ETH");
    bal = await this.EthTrA.balanceOf(user1);
    console.log("User1 trA tokens: "+ web3.utils.fromWei(bal, "ether") + " ETA");
    console.log("JCompound cEth balance: "+ web3.utils.fromWei(await this.JCompound.getTokenBalance(this.CEther.address), "ether") + " cEth");
    tx = await this.EthTrA.approve(this.JCompound.address, bal, {from: user1});
    tx = await this.JCompound.redeemTrancheAToken(0, bal, {from: user1});
    newBal = web3.utils.fromWei(await web3.eth.getBalance(user1), "ether");
    console.log("User1 New Eth balance: "+ newBal + " ETH");
    console.log("User1 trA interest: "+ (newBal - oldBal) + " ETH");
    console.log("User1 trA tokens: "+ web3.utils.fromWei(await this.EthTrA.balanceOf(user1), "ether") + " ETA");
    console.log("JCompound new cEth balance: "+ web3.utils.fromWei(await this.JCompound.getTokenBalance(this.CEther.address), "ether") + " cEth");
    console.log("TrA price: " + web3.utils.fromWei(await this.JCompound.getTrancheAExchangeRate(0), "ether"));
  }); 

  it('time passes...', async function () {
    let block = await web3.eth.getBlock("latest");
    console.log("Actual Block: " + block.number);
    newBlock = block.number + 100;
    await time.advanceBlockTo(newBlock);
    await this.CErc20.setExchangeRateStored(new BN("20034498998444131")); //20034497998444131
    console.log("Compound New price: " + await this.CErc20.exchangeRateStored());
  });

  it("user1 buys some token EthTrB", async function () {
    oldBal = web3.utils.fromWei(await web3.eth.getBalance(user1), "ether");
    console.log("User1 Eth balance: "+ oldBal + " ETH");
    bal = await this.EthTrB.balanceOf(user1);
    console.log("User1 trB tokens: "+ web3.utils.fromWei(bal, "ether") + " ETB");
    console.log("JCompound cEth balance: "+ web3.utils.fromWei(await this.JCompound.getTokenBalance(this.CEther.address), "ether") + " cEth");
    console.log("TrB price: " + web3.utils.fromWei(await this.JCompound.getTrancheBExchangeRate(0, 0, true), "ether"));
    tx = await this.EthTrB.approve(this.JCompound.address, bal, {from: user1});
    tx = await this.JCompound.redeemTrancheBToken(0, bal, {from: user1});
    newBal = web3.utils.fromWei(await web3.eth.getBalance(user1), "ether");
    console.log("User1 New Eth balance: "+ newBal + " ETH");
    console.log("User1 trA interest: "+ (newBal - oldBal) + " ETH");
    console.log("User1 trB tokens: "+ web3.utils.fromWei(await this.EthTrA.balanceOf(user1), "ether") + " ETB");
    console.log("JCompound new cEth balance: "+ web3.utils.fromWei(await this.JCompound.getTokenBalance(this.CEther.address), "ether") + " cEth");
    console.log("TrB price: " + web3.utils.fromWei(await this.JCompound.getTrancheBExchangeRate(0, 0, true), "ether"));
  }); 


});