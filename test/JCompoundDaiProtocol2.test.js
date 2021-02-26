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
    sendcDAItoProtocol,
    sendDAItoUsers
} = require('./JCompoundProtocolFunctions');

describe('JProtocol', function () {
  const GAS_PRICE = 27000000000; //Gwei = 10 ** 9 wei

  const [tokenOwner, factoryOwner, factoryAdmin, user1, user2, user3, user4, user5, user6] = accounts;

  //beforeEach(async function () {

  //});

  deployMinimumFactory(tokenOwner, factoryOwner, factoryAdmin);

  //sendcDAItoProtocol(tokenOwner);

  sendDAItoUsers(tokenOwner, user1, user2, user3, user4, user5, user6);

  it('send some DAI to CErc20', async function () {
    tx = await this.DAI.transfer(this.CErc20.address, web3.utils.toWei('10', 'ether'), {
      from: tokenOwner
    });
    console.log("Gas to transfer DAI to JCompound: " + tx.receipt.gasUsed);
    // totcost = tx.receipt.gasUsed * GAS_PRICE;
    // console.log("transfer token costs: " + web3.utils.fromWei(totcost.toString(), 'ether') + " ETH");
    protBal = await this.DAI.balanceOf(this.CErc20.address);
    console.log(`protocol DAI Balance: ${web3.utils.fromWei(protBal, "ether")} DAI`)
    expect(web3.utils.fromWei(protBal, "ether")).to.be.equal(new BN(10).toString());
  });

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
    console.log("JCompound cDAI balance: "+ web3.utils.fromWei(await this.JCompound.getTokenBalance(this.CEther.address), "ether") + " cDai");
    console.log("TrA price: " +  web3.utils.fromWei(await this.JCompound.getTrancheAExchangeRate(1), "ether"));
    console.log("Compound Price: " + await this.JCompound.getCompoundPrice(1));
    console.log("Compound TrA Value: " + web3.utils.fromWei(await this.JCompound.getTrAValue(1), "ether"));
    console.log("Compound total Value: " + web3.utils.fromWei(await this.JCompound.getTotalValue(1), "ether"));
  }); 

  it("user1 buys some token EthTrB", async function () {
    console.log("User1 DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(user1), "ether") + " DAI");
    trAddr = await this.JCompound.trancheAddresses(1);
    buyAddr = trAddr.buyerCoinAddress;
    console.log("Tranche Buyer Coin address: " + buyAddr);
    console.log("TrB value: " +  web3.utils.fromWei(await this.JCompound.getTrBValue(1), "ether"));
    tx = await this.DAI.approve(this.JCompound.address, web3.utils.toWei("10000", "ether"), {from: user1});
    tx = await this.JCompound.buyTrancheBToken(1, web3.utils.toWei("10000", "ether"), {from: user1});
    console.log("User1 New DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(user1), "ether") + " DAI");
    console.log("User1 trB tokens: "+ web3.utils.fromWei(await this.DaiTrB.balanceOf(user1), "ether") + " DTB");
    console.log("CErc20 DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(this.CErc20.address), "ether") + " DAI");
    console.log("JCompound DAI balance: "+ web3.utils.fromWei(await this.JCompound.getTokenBalance(this.CEther.address), "ether") + " cDai");
    console.log("TrB price: " + web3.utils.fromWei(await this.JCompound.getTrancheBExchangeRate(1, 0, true), "ether"));
    console.log("Compound price: " + web3.utils.fromWei(await this.JCompound.getCompoundPrice(1), "ether"));
    console.log("TrA price: " +  web3.utils.fromWei(await this.JCompound.getTrancheAExchangeRate(1), "ether"));
    console.log("Compound TrA Value: " + web3.utils.fromWei(await this.JCompound.getTrAValue(1), "ether"));
    console.log("TrB value: " +  web3.utils.fromWei(await this.JCompound.getTrBValue(1), "ether"));
    console.log("Compound total Value: " + web3.utils.fromWei(await this.JCompound.getTotalValue(1), "ether"));
  }); 

  it("user2 buys some token EthTrB", async function () {
    console.log("User2 DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(user2), "ether") + " DAI");
    console.log("trB totalSupply: " + await this.DaiTrB.totalSupply());
    console.log("TrB price: " + web3.utils.fromWei(await this.JCompound.getTrancheBExchangeRate(1, web3.utils.toWei("10000", "ether"), true), "ether"));
    console.log("TrB value: " +  web3.utils.fromWei(await this.JCompound.getTrBValue(1), "ether"));
    tx = await this.DAI.approve(this.JCompound.address, web3.utils.toWei("10000", "ether"), {from: user2});
    tx = await this.JCompound.buyTrancheBToken(1, web3.utils.toWei("10000", "ether"), {from: user2});
    console.log("User2 New DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(user2), "ether") + " DAI");
    console.log("User2 trB tokens: "+ web3.utils.fromWei(await this.DaiTrB.balanceOf(user2), "ether") + " DTB");
    console.log("CErc20 DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(this.CErc20.address), "ether") + " DAI");
    console.log("JCompound DAI balance: "+ web3.utils.fromWei(await this.JCompound.getTokenBalance(this.CEther.address), "ether") + " cDai");
    console.log("TrB price: " + web3.utils.fromWei(await this.JCompound.getTrancheBExchangeRate(1, 0, true), "ether"));
    console.log("Compound price: " + web3.utils.fromWei(await this.JCompound.getCompoundPrice(1), "ether"));
    console.log("Compound TrA Value: " + web3.utils.fromWei(await this.JCompound.getTrAValue(1), "ether"));
    console.log("TrB value: " +  web3.utils.fromWei(await this.JCompound.getTrBValue(1), "ether"));
    console.log("Compound total Value: " + web3.utils.fromWei(await this.JCompound.getTotalValue(1), "ether"));
  }); 

  it('time passes...', async function () {
    let block = await web3.eth.getBlock("latest");
    console.log("Actual Block: " + block.number);
    newBlock = block.number + 100;
    await time.advanceBlockTo(newBlock);
    await this.CErc20.setExchangeRateStored(new BN("21116902931684312"));
    console.log("Compound New price: " + await this.CErc20.exchangeRateStored());
  });

  it("user1 redeems token EthTrA", async function () {
    oldBal = web3.utils.fromWei(await this.DAI.balanceOf(user1), "ether");
    console.log("User1 Dai balance: "+ oldBal + " DAI");
    bal = await this.DaiTrA.balanceOf(user1);
    console.log("User1 trA tokens: "+ web3.utils.fromWei(bal, "ether") + " DTA");
    console.log("JCompound cDai balance: "+ web3.utils.fromWei(await this.JCompound.getTokenBalance(this.CEther.address), "ether") + " cDai");
    tx = await this.DaiTrA.approve(this.JCompound.address, bal, {from: user1});
    console.log("TrA price: " +  web3.utils.fromWei(await this.JCompound.getTrancheAExchangeRate(1), "ether"));
    tx = await this.JCompound.redeemTrancheAToken(1, bal, {from: user1});
    newBal = web3.utils.fromWei(await this.DAI.balanceOf(user1), "ether");
    console.log("User1 New Dai balance: "+ newBal + " DAI");
    bal = await this.DaiTrA.balanceOf(user1);
    console.log("User1 trA tokens: "+ web3.utils.fromWei(bal, "ether") + " DTA");
    console.log("User1 trA interest: "+ (newBal - oldBal) + " DAI");
    console.log("CErc20 DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(this.CErc20.address), "ether") + " DAI");
    console.log("JCompound new DAI balance: "+ web3.utils.fromWei(await this.JCompound.getTokenBalance(this.CEther.address), "ether") + " cDai");
    console.log("Compound TrA Value: " + web3.utils.fromWei(await this.JCompound.getTrAValue(1), "ether"));
    console.log("Compound total Value: " + web3.utils.fromWei(await this.JCompound.getTotalValue(1), "ether"));
  }); 

  it('time passes to let the redeem timeout to expire', async function () {
    let block = await web3.eth.getBlock("latest");
    console.log("Actual Block: " + block.number);
    newBlock = block.number + 10;
    await time.advanceBlockTo(newBlock);
  });

  it("user1 redeems token EthTrB", async function () {
    oldBal = web3.utils.fromWei(await this.DAI.balanceOf(user1), "ether");
    console.log("User1 Dai balance: "+ oldBal + " DAI");
    bal = await this.DaiTrB.balanceOf(user1);
    console.log("User1 trB tokens: "+ web3.utils.fromWei(bal, "ether") + " DTB");
    console.log("JCompound cDai balance: "+ web3.utils.fromWei(await this.JCompound.getTokenBalance(this.CEther.address), "ether") + " cDai");
    tx = await this.DaiTrB.approve(this.JCompound.address, bal, {from: user1});
    console.log("TrB price: " + web3.utils.fromWei(await this.JCompound.getTrancheBExchangeRate(1, bal, false), "ether"));
    console.log("TrB value: " +  web3.utils.fromWei(await this.JCompound.getTrBValue(1), "ether"));
    tx = await this.JCompound.redeemTrancheBToken(1, bal, {from: user1});
    newBal = web3.utils.fromWei(await this.DAI.balanceOf(user1), "ether");
    console.log("User1 New Dai balance: "+ newBal + " DAI");
    bal = await this.DaiTrB.balanceOf(user1);
    console.log("User1 trB tokens: "+ web3.utils.fromWei(bal, "ether") + " DTB");
    console.log("User1 trB interest: "+ (newBal - oldBal) + " DAI");
    console.log("CErc20 DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(this.CErc20.address), "ether") + " DAI");
    console.log("JCompound new DAI balance: "+ web3.utils.fromWei(await this.JCompound.getTokenBalance(this.CEther.address), "ether") + " cDai");
    console.log("TrA Value: " + web3.utils.fromWei(await this.JCompound.getTrAValue(1), "ether"));
    console.log("TrB value: " +  web3.utils.fromWei(await this.JCompound.getTrBValue(1), "ether"));
    console.log("Compound total Value: " + web3.utils.fromWei(await this.JCompound.getTotalValue(1), "ether"));
  }); 

  it("user2 redeems token EthTrB", async function () {
    oldBal = web3.utils.fromWei(await this.DAI.balanceOf(user2), "ether");
    console.log("User2 Dai balance: "+ oldBal + " DAI");
    console.log("User2 Dai balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(user2), "ether") + " DAI");
    bal = await this.DaiTrB.balanceOf(user2);
    console.log("User2 trB tokens: "+ web3.utils.fromWei(bal, "ether") + " DTB");
    console.log("JCompound cDai balance: "+ web3.utils.fromWei(await this.JCompound.getTokenBalance(this.CEther.address), "ether") + " cDai");
    tx = await this.DaiTrB.approve(this.JCompound.address, bal, {from: user2});
    console.log("TrB price: " + web3.utils.fromWei(await this.JCompound.getTrancheBExchangeRate(1, bal, false), "ether"));
    console.log("TrB value: " +  web3.utils.fromWei(await this.JCompound.getTrBValue(1), "ether"));
    tx = await this.JCompound.redeemTrancheBToken(1, bal, {from: user2});
    newBal = web3.utils.fromWei(await this.DAI.balanceOf(user2), "ether");
    console.log("User2 New Dai balance: "+ newBal + " DAI");
    bal = await this.DaiTrB.balanceOf(user2);
    console.log("User2 trB tokens: "+ web3.utils.fromWei(bal, "ether") + " DTB");
    console.log("User2 trB interest: "+ (newBal - oldBal) + " DAI");
    console.log("CErc20 DAI balance: "+ web3.utils.fromWei(await this.DAI.balanceOf(this.CErc20.address), "ether") + " DAI");
    console.log("JCompound new DAI balance: "+ web3.utils.fromWei(await this.JCompound.getTokenBalance(this.CEther.address), "ether") + " cDai");
    console.log("TrA Value: " + web3.utils.fromWei(await this.JCompound.getTrAValue(1), "ether"));
    console.log("TrB value: " +  web3.utils.fromWei(await this.JCompound.getTrBValue(1), "ether"));
    console.log("Compound total Value: " + web3.utils.fromWei(await this.JCompound.getTotalValue(1), "ether"));
  }); 

});