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
// const CEther = artifacts.require("CEther");
// const CErc20 = artifacts.require("CErc20");
const JAdminTools = artifacts.require('JAdminTools');
const JFeesCollector = artifacts.require('JFeesCollector');

const JCompound = artifacts.require('JCompound');
const JCompoundHelper = artifacts.require('JCompoundHelper');
const JTranchesDeployer = artifacts.require('JTranchesDeployer');

const JTrancheAToken = artifacts.require('JTrancheAToken');
const JTrancheBToken = artifacts.require('JTrancheBToken');

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
    daiContract = await myERC20.at(DAI_ADDRESS);
    result = await daiContract.totalSupply();
    console.log(fromWei(result))
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

    jCompHelperContract = await JCompoundHelper.deployed();
    expect(jCompHelperContract.address).to.be.not.equal(ZERO_ADDRESS);
    expect(jCompHelperContract.address).to.match(/0x[0-9a-fA-F]{40}/);
    console.log(jCompHelperContract.address);

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

  it('send some DAI to user1', async function () {
    userBal = await daiContract.balanceOf(unblockedAccount);
    console.log(`user1 DAI Balance: ${fromWei(userBal)} DAI`)
    tx = await daiContract.transfer(user1, toWei(20000), {from: unblockedAccount});
    userBal = await daiContract.balanceOf(user1);
    console.log(`user1 DAI Balance: ${fromWei(userBal)} DAI`)
    // expect(fromWei(userBal)).to.be.equal(new BN(20000).toString());
  });

  it("user1 buys some token EthTrA", async function () {
    console.log(user1);
    console.log("User1 Eth balance: " + fromWei(await web3.eth.getBalance(user1)) + " ETH");
    trAddresses = await jCompContract.trancheAddresses(0); //.cTokenAddress;
    trPars = await jCompContract.trancheParameters(0);
    console.log("Compound Price: " + await jCompHelperContract.getCompoundPriceHelper(trAddresses[1], trPars[6], trPars[5]));
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
    tx = await jCompContract.buyTrancheAToken(0,  toWei("1"), {
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
    console.log("Compound Price: " + await jCompHelperContract.getCompoundPriceHelper(trAddresses[1], trPars[6], trPars[5]));
    trPar = await jCompContract.trancheParameters(0);
    console.log("TrA price: " + fromWei(trPar[2].toString()));
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

  it("user1 buys some token daiTrA", async function () {
    console.log("is Dai allowed in JCompound: " + await jCompContract.isCTokenAllowed(daiContract.address));
    
    trAddresses = await jCompContract.trancheAddresses(1); //.cTokenAddress;
    trPars = await jCompContract.trancheParameters(1);
    console.log("Compound Price: " + await jCompHelperContract.getCompoundPriceHelper(trAddresses[1], trPars[6], trPars[5]));
    console.log("param tranche A: " + JSON.stringify(trPars));
    console.log("rpb tranche A: " + trPar[3].toString());
    tx = await jCompContract.calcRPBFromPercentage(1, {
      from: user1
    });
    trPar = await jCompContract.trancheParameters(1);
    console.log("rpb tranche A: " + trPar[3].toString());
    console.log("TrA price: " + fromWei(trPar[2].toString()));
    trPars = await jCompContract.trancheParameters(1);
    console.log("param tranche A: " + JSON.stringify(trPars));
    trParams = await jCompContract.trancheAddresses(1);
    expect(trParams.buyerCoinAddress).to.be.equal(daiContract.address);
    expect(trParams.cTokenAddress).to.be.equal(CDAI_ADDRESS);
    console.log("User1 DAI balance: " + fromWei(await daiContract.balanceOf(user1)) + " DAI");
    tx = await daiContract.approve(jCompContract.address, toWei("10000"), {
      from: user1
    });
    tx = await jCompContract.buyTrancheAToken(1, toWei("10000"), {
      from: user1
    });
    console.log("User1 New DAI balance: " + fromWei(await daiContract.balanceOf(user1)) + " DAI");
    console.log("User1 trA tokens: " + fromWei(await daiTrAContract.balanceOf(user1)) + " DTA");
    console.log("CErc20 DAI balance: " + fromWei(await daiContract.balanceOf(CDAI_ADDRESS)) + " DAI");
    console.log("JCompound DAI balance: " + fromWei(await daiContract.balanceOf(jCompContract.address)) + " DAI");
    console.log("JCompound cDAI balance: " + fromWei8Dec(await jCompContract.getTokenBalance(CDAI_ADDRESS)) + " cDai");
    trPar = await jCompContract.trancheParameters(1);
    console.log("TrA price: " + fromWei(trPar[2].toString()));
    trAddresses = await jCompContract.trancheAddresses(1); //.cTokenAddress;
    trPars = await jCompContract.trancheParameters(1);
    console.log("Compound Price: " + await jCompHelperContract.getCompoundPriceHelper(trAddresses[1], trPars[6], trPars[5]));
    console.log("Compound TrA Value: " + fromWei(await jCompContract.getTrAValue(1)));
    console.log("Compound total Value: " + fromWei(await jCompContract.getTotalValue(1)));
  });

  it("user1 buys some token daiTrB", async function () {
    console.log("User1 DAI balance: " + fromWei(await daiContract.balanceOf(user1)) + " DAI");
    trAddr = await jCompContract.trancheAddresses(1);
    buyAddr = trAddr.buyerCoinAddress;
    console.log("Tranche Buyer Coin address: " + buyAddr);
    console.log("TrB value: " + fromWei(await jCompContract.getTrBValue(1)));
    console.log("Compound total Value: " + fromWei(await jCompContract.getTotalValue(1)));
    console.log("TrB total supply: " + fromWei(await daiTrBContract.totalSupply()));
    console.log("Compound TrA Value: " + fromWei(await jCompContract.getTrAValue(1)));
    console.log("TrB price: " + fromWei(await jCompContract.getTrancheBExchangeRate(1, toWei("10000"))));
    tx = await daiContract.approve(jCompContract.address, toWei("10000"), {
      from: user1
    });
    tx = await jCompContract.buyTrancheBToken(1, toWei("10000"), {
      from: user1
    });
    console.log("User1 New DAI balance: " + fromWei(await daiContract.balanceOf(user1)) + " DAI");
    console.log("User1 trB tokens: " + fromWei(await daiTrBContract.balanceOf(user1)) + " DTB");
    console.log("CErc20 DAI balance: " + fromWei(await daiContract.balanceOf(CDAI_ADDRESS)) + " DAI");
    console.log("JCompound DAI balance: " + fromWei8Dec(await jCompContract.getTokenBalance(CDAI_ADDRESS)) + " cDai");
    console.log("TrB price: " + fromWei(await jCompContract.getTrancheBExchangeRate(1, 0)));
    trAddresses = await jCompContract.trancheAddresses(1); //.cTokenAddress;
    trPars = await jCompContract.trancheParameters(1);
    console.log("Compound Price: " + await jCompHelperContract.getCompoundPriceHelper(trAddresses[1], trPars[6], trPars[5]));
    trPar = await jCompContract.trancheParameters(1);
    console.log("TrA price: " + fromWei(trPar[2].toString()));
    console.log("Compound TrA Value: " + fromWei(await jCompContract.getTrAValue(1)));
    console.log("TrB value: " + fromWei(await jCompContract.getTrBValue(1)));
    console.log("Compound total Value: " + fromWei(await jCompContract.getTotalValue(1)));
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
    await jCompContract.redeemTrancheAToken(0, bal, {
      from: user1
    });
    newBal = fromWei(await web3.eth.getBalance(user1));
    console.log("User1 New Eth balance: " + newBal + " ETH");
    console.log("User1 trA interest: " + (newBal - oldBal) + " ETH");
    console.log("User1 trA tokens: " + fromWei(await ethTrAContract.balanceOf(user1)) + " ETA");
    console.log("JCompound new cEth balance: " + fromWei8Dec(await jCompContract.getTokenBalance(CETH_ADDRESS)) + " cEth");
    trPar = await jCompContract.trancheParameters(0);
    console.log("TrA price: " + fromWei(trPar[2].toString()));
  });

  it('let timeout elapsed', async function () {
    let block = await web3.eth.getBlock("latest");
    console.log("Actual Block: " + block.number);
    newBlock = block.number + 5;
    await time.advanceBlockTo(newBlock);
    block = await web3.eth.getBlock("latest");
    console.log("New Actual Block: " + block.number);
  });

  it("user1 redeems token daiTrA", async function () {
    oldBal = fromWei(await daiContract.balanceOf(user1));
    console.log("User1 Dai balance: "+ oldBal + " DAI");
    bal = await daiTrAContract.balanceOf(user1);
    console.log("User1 trA tokens: "+ fromWei(bal) + " DTA");
    console.log("JCompound cDai balance: "+ fromWei8Dec(await jCompContract.getTokenBalance(CDAI_ADDRESS)) + " cDai");
    tx = await daiTrAContract.approve(jCompContract.address, bal, {from: user1});
    trPar = await jCompContract.trancheParameters(1);
    console.log("TrA price: " + fromWei(trPar[2].toString()));
    tx = await jCompContract.redeemTrancheAToken(1, bal, {from: user1});
    newBal = fromWei(await daiContract.balanceOf(user1));
    console.log("User1 New Dai balance: "+ newBal + " DAI");
    bal = await daiTrAContract.balanceOf(user1);
    console.log("User1 trA tokens: "+ fromWei(bal) + " DTA");
    console.log("User1 trA interest: "+ (newBal - oldBal) + " DAI");
    console.log("CErc20 DAI balance: "+ fromWei(await daiContract.balanceOf(CDAI_ADDRESS)) + " DAI");
    console.log("JCompound new DAI balance: "+ fromWei8Dec(await jCompContract.getTokenBalance(CDAI_ADDRESS)) + " cDai");
    console.log("Compound TrA Value: " + fromWei(await jCompContract.getTrAValue(1)));
    console.log("Compound total Value: " + fromWei(await jCompContract.getTotalValue(1)));
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
    console.log("TrB price: " + fromWei(await jCompContract.getTrancheBExchangeRate(0, 0)));
    tx = await ethTrBContract.approve(jCompContract.address, bal, {
      from: user1
    });
    await jCompContract.redeemTrancheBToken(0, bal, {
      from: user1
    });
    newBal = fromWei(await web3.eth.getBalance(user1));
    console.log("User1 New Eth balance: " + newBal + " ETH");
    console.log("User1 trB interest: " + (newBal - oldBal) + " ETH");
    console.log("User1 trB tokens: " + fromWei(await ethTrAContract.balanceOf(user1)) + " ETB");
    console.log("JCompound new cEth balance: " + fromWei8Dec(await jCompContract.getTokenBalance(CETH_ADDRESS)) + " cEth");
    console.log("TrB price: " + fromWei(await jCompContract.getTrancheBExchangeRate(0, 0)));
  });

  it('let timeout elapsed', async function () {
    let block = await web3.eth.getBlock("latest");
    console.log("Actual Block: " + block.number);
    newBlock = block.number + 5;
    await time.advanceBlockTo(newBlock);
    block = await web3.eth.getBlock("latest");
    console.log("New Actual Block: " + block.number);
  });
  
  it("user1 redeems token daiTrB", async function () {
    oldBal = fromWei(await daiContract.balanceOf(user1));
    console.log("User1 Dai balance: "+ oldBal + " DAI");
    bal = await daiTrBContract.balanceOf(user1);
    console.log("User1 trB tokens: "+ fromWei(bal) + " DTB");
    console.log("JCompound cDai balance: "+ fromWei8Dec(await jCompContract.getTokenBalance(CDAI_ADDRESS)) + " cDai");
    tx = await daiTrBContract.approve(jCompContract.address, bal, {from: user1});
    console.log("TrB price: " + fromWei(await jCompContract.getTrancheBExchangeRate(1, 0)));
    console.log("TrB value: " +  fromWei(await jCompContract.getTrBValue(1)));
    tx = await jCompContract.redeemTrancheBToken(1, bal, {from: user1});
    newBal = fromWei(await daiContract.balanceOf(user1));
    console.log("User1 New Dai balance: "+ newBal + " DAI");
    bal = await daiTrBContract.balanceOf(user1);
    console.log("User1 trB tokens: "+ fromWei(bal) + " DTB");
    console.log("User1 trB interest: "+ (newBal - oldBal) + " DAI");
    console.log("CErc20 DAI balance: "+ fromWei(await daiContract.balanceOf(CDAI_ADDRESS)) + " DAI");
    console.log("JCompound new DAI balance: "+ fromWei8Dec(await jCompContract.getTokenBalance(CDAI_ADDRESS)) + " cDai");
    console.log("TrA Value: " + fromWei(await jCompContract.getTrAValue(1)));
    console.log("TrB value: " +  fromWei(await jCompContract.getTrBValue(1)));
    console.log("Compound total Value: " + fromWei(await jCompContract.getTotalValue(1)));
  }); 

});