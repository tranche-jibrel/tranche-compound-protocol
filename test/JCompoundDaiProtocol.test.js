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

  //sendDAItoProtocol(tokenOwner);

  sendDAItoUsers(tokenOwner, user1, user2, user3, user4, user5, user6);
  /*
  it("try to mint some token from mockup", async function () {
    tx = await this.DAI.approve(this.CErc20.address, web3.utils.toWei("1", "ether"), {from: user1});
    tx = await this.CErc20.mint(web3.utils.toWei("1", "ether"), {from: user1});
    console.log("user1 bal: " + web3.utils.fromWei(await this.CErc20.balanceOf(user1), "ether") + " cDai");
    console.log("cerc20 supply: " + web3.utils.fromWei(await this.CErc20.totalSupply(), "ether") + " cDai");
  });
  */
  it("user1 buys some token EthTrA", async function () {
    console.log("is Dai allowed in JCompound: "+ await this.JCompound.isCTokenAllowed(this.DAI.address));
    trParams = await this.JCompound.trancheAddresses(1);
    expect(trParams.buyerCoinAddress).to.be.equal(this.DAI.address);
    expect(trParams.dividendCoinAddress).to.be.equal(this.CErc20.address);
    console.log("User1 DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(user1), "ether") + " DAI");
    tx = await this.DAI.approve(this.JCompound.address, web3.utils.toWei("10000", "ether"), {from: user1});
    tx = await this.JCompound.buyTrancheAToken(1, web3.utils.toWei("10000", "ether"), {from: user1});
    console.log("User1 New DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(user1), "ether") + " DAI");
    console.log("User1 trA tokens: "+ web3.utils.fromWei(await this.DaiTrA.balanceOf(user1), "ether") + " DTA");
    console.log("CErc20 DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(this.CErc20.address), "ether") + " DAI");
    console.log("JCompound DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(this.JCompound.address), "ether") + " DAI");
    console.log("JCompound cDAI balance: "+ web3.utils.fromWei(await this.CErc20.balanceOf(this.JCompound.address), "ether") + " cDai");
  }); 

  it("user2 buys some token EthTrA", async function () {
    console.log("User2 DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(user2), "ether") + " DAI");
    tx = await this.DAI.approve(this.JCompound.address, web3.utils.toWei("10000", "ether"), {from: user2});
    tx = await this.JCompound.buyTrancheAToken(1, web3.utils.toWei("10000", "ether"), {from: user2});
    console.log("User2 New DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(user2), "ether") + " DAI");
    console.log("User2 trA tokens: "+ web3.utils.fromWei(await this.DaiTrA.balanceOf(user2), "ether") + " DTA");
    console.log("CErc20 DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(this.CErc20.address), "ether") + " DAI");
    console.log("JCompound DAI balance: "+ web3.utils.fromWei(await this.CErc20.balanceOf(this.JCompound.address), "ether") + " cDai");
  }); 

  it("user3 buys some token EthTrA", async function () {
    console.log("User3 DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(user3), "ether") + " DAI");
    tx = await this.DAI.approve(this.JCompound.address, web3.utils.toWei("10000", "ether"), {from: user3});
    tx = await this.JCompound.buyTrancheAToken(1, web3.utils.toWei("10000", "ether"), {from: user3});
    console.log("User3 New DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(user3), "ether") + " DAI");
    console.log("User3 trA tokens: "+ web3.utils.fromWei(await this.DaiTrA.balanceOf(user3), "ether") + " DTA");
    console.log("CErc20 DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(this.CErc20.address), "ether") + " DAI");
    console.log("JCompound DAI balance: "+ web3.utils.fromWei(await this.CErc20.balanceOf(this.JCompound.address), "ether") + " cDai");
  }); 

  it("user1 buys some token EthTrB", async function () {
    console.log("User1 DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(user1), "ether") + " DAI");
    tx = await this.DAI.approve(this.JCompound.address, web3.utils.toWei("10000", "ether"), {from: user1});
    tx = await this.JCompound.buyTrancheBToken(1, web3.utils.toWei("10000", "ether"), {from: user1});
    console.log("User1 New DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(user1), "ether") + " DAI");
    console.log("User1 trB tokens: "+ web3.utils.fromWei(await this.DaiTrB.balanceOf(user1), "ether") + " DTB");
    console.log("CErc20 DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(this.CErc20.address), "ether") + " DAI");
    console.log("JCompound DAI balance: "+ web3.utils.fromWei(await this.CErc20.balanceOf(this.JCompound.address), "ether") + " cDai");
  }); 

  it("user2 buys some token EthTrB", async function () {
    console.log("User2 DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(user2), "ether") + " DAI");
    tx = await this.DAI.approve(this.JCompound.address, web3.utils.toWei("10000", "ether"), {from: user2});
    tx = await this.JCompound.buyTrancheBToken(1, web3.utils.toWei("10000", "ether"), {from: user2});
    console.log("User2 New DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(user2), "ether") + " DAI");
    console.log("User2 trB tokens: "+ web3.utils.fromWei(await this.DaiTrB.balanceOf(user2), "ether") + " DTB");
    console.log("CErc20 DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(this.CErc20.address), "ether") + " DAI");
    console.log("JCompound DAI balance: "+ web3.utils.fromWei(await this.CErc20.balanceOf(this.JCompound.address), "ether") + " cDai");
  }); 

  it("user3 buys some token EthTrB", async function () {
    console.log("User3 DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(user3), "ether") + " DAI");
    tx = await this.DAI.approve(this.JCompound.address, web3.utils.toWei("10000", "ether"), {from: user3});
    tx = await this.JCompound.buyTrancheBToken(1, web3.utils.toWei("10000", "ether"), {from: user3});
    console.log("User3 New DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(user3), "ether") + " DAI");
    console.log("User3 trB tokens: "+ web3.utils.fromWei(await this.DaiTrB.balanceOf(user3), "ether") + " DTB");
    console.log("CErc20 DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(this.CErc20.address), "ether") + " DAI");
    console.log("JCompound DAI balance: "+ web3.utils.fromWei(await this.CErc20.balanceOf(this.JCompound.address), "ether") + " cDai");
  }); 

  it('time passes...', async function () {
    let block = await web3.eth.getBlock("latest");
    console.log("Actual Block: " + block.number);
    newBlock = block.number + 100;
    await time.advanceBlockTo(newBlock);
  });

  it("user1 redeems token EthTrA", async function () {
    console.log("User1 Dai balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(user1), "ether") + " DAI");
    bal = await this.DaiTrA.balanceOf(user1);
    console.log("User1 trA tokens: "+ web3.utils.fromWei(bal, "ether") + " DTA");
    console.log("JCompound cDai balance: "+ web3.utils.fromWei(await this.CErc20.balanceOf(this.JCompound.address), "ether") + " cDai");
    tx = await this.DaiTrA.approve(this.JCompound.address, bal, {from: user1});
    tx = await this.JCompound.redeemTrancheAToken(1, bal, {from: user1});
    console.log("User1 New Dai balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(user1), "ether") + " DAI");
    bal = await this.DaiTrA.balanceOf(user1);
    console.log("User1 trA tokens: "+ web3.utils.fromWei(bal, "ether") + " DTA");
    console.log("CErc20 DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(this.CErc20.address), "ether") + " DAI");
    console.log("JCompound new DAI balance: "+ web3.utils.fromWei(await this.CErc20.balanceOf(this.JCompound.address), "ether") + " cDai");
  }); 

  it("user1 redeems token EthTrB", async function () {
    console.log("User1 Dai balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(user1), "ether") + " DAI");
    bal = await this.DaiTrB.balanceOf(user1);
    console.log("User1 trB tokens: "+ web3.utils.fromWei(bal, "ether") + " DTB");
    console.log("JCompound cDai balance: "+ web3.utils.fromWei(await this.CErc20.balanceOf(this.JCompound.address), "ether") + " cDai");
    tx = await this.DaiTrB.approve(this.JCompound.address, bal, {from: user1});
    tx = await this.JCompound.redeemTrancheBToken(1, bal, {from: user1});
    console.log("User1 New Dai balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(user1), "ether") + " DAI");
    bal = await this.DaiTrB.balanceOf(user1);
    console.log("User1 trB tokens: "+ web3.utils.fromWei(bal, "ether") + " DTB");
    console.log("CErc20 DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(this.CErc20.address), "ether") + " DAI");
    console.log("JCompound new DAI balance: "+ web3.utils.fromWei(await this.CErc20.balanceOf(this.JCompound.address), "ether") + " cDai");
  }); 

  it("user2 redeems token EthTrA", async function () {
    console.log("User2 Dai balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(user2), "ether") + " DAI");
    bal = await this.DaiTrA.balanceOf(user2);
    console.log("User2 trA tokens: "+ web3.utils.fromWei(bal, "ether") + " DTA");
    console.log("JCompound cDai balance: "+ web3.utils.fromWei(await this.CErc20.balanceOf(this.JCompound.address), "ether") + " cDai");
    tx = await this.DaiTrA.approve(this.JCompound.address, bal, {from: user2});
    tx = await this.JCompound.redeemTrancheAToken(1, bal, {from: user2});
    console.log("User2 New Dai balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(user2), "ether") + " DAI");
    bal = await this.DaiTrA.balanceOf(user2);
    console.log("User2 trA tokens: "+ web3.utils.fromWei(bal, "ether") + " DTA");
    console.log("CErc20 DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(this.CErc20.address), "ether") + " DAI");
    console.log("JCompound new DAI balance: "+ web3.utils.fromWei(await this.CErc20.balanceOf(this.JCompound.address), "ether") + " cDai");
  }); 

  it("user2 redeems token EthTrB", async function () {
    console.log("User2 Dai balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(user2), "ether") + " DAI");
    bal = await this.DaiTrB.balanceOf(user2);
    console.log("User2 trB tokens: "+ web3.utils.fromWei(bal, "ether") + " DTB");
    console.log("JCompound cDai balance: "+ web3.utils.fromWei(await this.CErc20.balanceOf(this.JCompound.address), "ether") + " cDai");
    tx = await this.DaiTrB.approve(this.JCompound.address, bal, {from: user2});
    tx = await this.JCompound.redeemTrancheBToken(1, bal, {from: user2});
    console.log("User2 New Dai balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(user2), "ether") + " DAI");
    bal = await this.DaiTrB.balanceOf(user2);
    console.log("User2 trB tokens: "+ web3.utils.fromWei(bal, "ether") + " DTB");
    console.log("CErc20 DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(this.CErc20.address), "ether") + " DAI");
    console.log("JCompound new DAI balance: "+ web3.utils.fromWei(await this.CErc20.balanceOf(this.JCompound.address), "ether") + " cDai");
  }); 

  it("user3 redeems token EthTrA", async function () {
    console.log("User3 Dai balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(user3), "ether") + " DAI");
    bal = await this.DaiTrA.balanceOf(user3);
    console.log("User3 trA tokens: "+ web3.utils.fromWei(bal, "ether") + " DTA");
    console.log("JCompound cDai balance: "+ web3.utils.fromWei(await this.CErc20.balanceOf(this.JCompound.address), "ether") + " cDai");
    tx = await this.DaiTrA.approve(this.JCompound.address, bal, {from: user3});
    tx = await this.JCompound.redeemTrancheAToken(1, bal, {from: user3});
    console.log("User3 New Dai balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(user3), "ether") + " DAI");
    bal = await this.DaiTrA.balanceOf(user3);
    console.log("User3 trA tokens: "+ web3.utils.fromWei(bal, "ether") + " DTA");
    console.log("CErc20 DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(this.CErc20.address), "ether") + " DAI");
    console.log("JCompound new DAI balance: "+ web3.utils.fromWei(await this.CErc20.balanceOf(this.JCompound.address), "ether") + " cDai");
  }); 

  it("user3 redeems token EthTrB", async function () {
    console.log("User3 Dai balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(user3), "ether") + " DAI");
    bal = await this.DaiTrB.balanceOf(user3);
    console.log("User3 trB tokens: "+ web3.utils.fromWei(bal, "ether") + " DTB");
    console.log("JCompound cDai balance: "+ web3.utils.fromWei(await this.CErc20.balanceOf(this.JCompound.address), "ether") + " cDai");
    tx = await this.DaiTrB.approve(this.JCompound.address, bal, {from: user3});
    tx = await this.JCompound.redeemTrancheBToken(1, bal, {from: user3});
    console.log("User3 New Dai balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(user3), "ether") + " DAI");
    bal = await this.DaiTrB.balanceOf(user3);
    console.log("User3 trB tokens: "+ web3.utils.fromWei(bal, "ether") + " DTB");
    console.log("CErc20 DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(this.CErc20.address), "ether") + " DAI");
    console.log("JCompound new DAI balance: "+ web3.utils.fromWei(await this.CErc20.balanceOf(this.JCompound.address), "ether") + " cDai");
  }); 

});