const {
  deployProxy,
  upgradeProxy
} = require('@openzeppelin/truffle-upgrades');
const {
  accounts,
  contract,
  web3
} = require('@openzeppelin/test-environment');
const {
  BN,
  constants,
  expectEvent,
  expectRevert
} = require('@openzeppelin/test-helpers');
const {
  expect
} = require('chai');
const {
  ZERO_ADDRESS
} = constants;

const myERC20 = contract.fromArtifact("myERC20");
const CEther = contract.fromArtifact("CEther");
const CErc20 = contract.fromArtifact("CErc20");
const JAdminTools = contract.fromArtifact('JAdminTools');
const JFeesCollector = contract.fromArtifact('JFeesCollector');

const JCompound = contract.fromArtifact('JCompound');
const JTranchesDeployer = contract.fromArtifact('JTranchesDeployer');

const JTrancheAToken = contract.fromArtifact('JTrancheAToken');
const JTrancheBToken = contract.fromArtifact('JTrancheBToken');

const MYERC20_TOKEN_SUPPLY = 5000000;
const GAS_PRICE = 27000000000;


function deployMinimumFactory(tokenOwner, factoryOwner, factoryAdmin) {

  it('deploys DAI mockup', async function () {
    //gasPrice = await web3.eth.getGasPrice();
    //console.log("Gas price: " + gasPrice);
    console.log("TokenOwner address: " + tokenOwner);
    this.DAI = await myERC20.new({
      from: tokenOwner
    });
    expect(this.DAI.address).to.be.not.equal(ZERO_ADDRESS);
    expect(this.DAI.address).to.match(/0x[0-9a-fA-F]{40}/);
    console.log(`DAI Address: ${this.DAI.address}`);
    result = await this.DAI.totalSupply();
    expect(result.toString()).to.be.equal(new BN(0).toString());
    console.log("DAI total supply: " + result);
    tx = await web3.eth.getTransactionReceipt(this.DAI.transactionHash);
    console.log("DAI contract deploy Gas: " + tx.gasUsed);
    //totcost = tx.gasUsed * GAS_PRICE;
    //console.log("ERC20 Coll1 deploy costs: " + web3.utils.fromWei(totcost.toString(), 'ether') + " ETH");
    result = await this.DAI.owner();
    expect(result).to.be.equal(ZERO_ADDRESS);
    tx = await this.DAI.initialize(MYERC20_TOKEN_SUPPLY, {
      from: tokenOwner
    });
    console.log("DAI contract Initialize Gas: " + tx.receipt.gasUsed);
    // totcost = tx.receipt.gasUsed * GAS_PRICE;
    // console.log("ERC20 Coll1 Initialize costs: " + web3.utils.fromWei(totcost.toString(), 'ether') + " ETH");
    result = await this.DAI.owner();
    expect(result).to.be.equal(tokenOwner);
    console.log("DAI owner address: " + result);
    borrBal = await this.DAI.balanceOf(tokenOwner);
    console.log(`tokenOwner Balance: ${web3.utils.fromWei(borrBal, "ether")} DAI`);
  });

  it('deploys SLICE mockup', async function () {
    //gasPrice = await web3.eth.getGasPrice();
    //console.log("Gas price: " + gasPrice);
    console.log("TokenOwner address: " + tokenOwner);
    this.SLICE = await myERC20.new({
      from: tokenOwner
    });
    expect(this.SLICE.address).to.be.not.equal(ZERO_ADDRESS);
    expect(this.SLICE.address).to.match(/0x[0-9a-fA-F]{40}/);
    console.log(`SLICE Address: ${this.SLICE.address}`);
    result = await this.SLICE.totalSupply();
    expect(result.toString()).to.be.equal(new BN(0).toString());
    console.log("SLICE total supply: " + result);
    tx = await web3.eth.getTransactionReceipt(this.SLICE.transactionHash);
    console.log("SLICE contract deploy Gas: " + tx.gasUsed);
    //totcost = tx.gasUsed * GAS_PRICE;
    //console.log("ERC20 Coll1 deploy costs: " + web3.utils.fromWei(totcost.toString(), 'ether') + " ETH");
    result = await this.SLICE.owner();
    expect(result).to.be.equal(ZERO_ADDRESS);
    tx = await this.SLICE.initialize(MYERC20_TOKEN_SUPPLY, {
      from: tokenOwner
    });
    console.log("SLICE contract Initialize Gas: " + tx.receipt.gasUsed);
    // totcost = tx.receipt.gasUsed * GAS_PRICE;
    // console.log("ERC20 Coll1 Initialize costs: " + web3.utils.fromWei(totcost.toString(), 'ether') + " ETH");
    result = await this.SLICE.owner();
    expect(result).to.be.equal(tokenOwner);
    console.log("SLICE owner address: " + result);
    borrBal = await this.SLICE.balanceOf(tokenOwner);
    console.log(`tokenOwner Balance: ${web3.utils.fromWei(borrBal, "ether")} SLICE`);
  });

  it('deploys cEth mockup', async function () {
    //gasPrice = await web3.eth.getGasPrice();
    //console.log("Gas price: " + gasPrice);
    console.log("TokenOwner address: " + tokenOwner);
    this.CEther = await CEther.new({
      from: tokenOwner
    });
    expect(this.CEther.address).to.be.not.equal(ZERO_ADDRESS);
    expect(this.CEther.address).to.match(/0x[0-9a-fA-F]{40}/);
    console.log(`Coll Token Address: ${this.CEther.address}`);

    tx = await web3.eth.getTransactionReceipt(this.CEther.transactionHash);
    console.log("CEther contract deploy Gas: " + tx.gasUsed);
    //totcost = tx.gasUsed * GAS_PRICE;
    //console.log("ERC20 Coll1 deploy costs: " + web3.utils.fromWei(totcost.toString(), 'ether') + " ETH");
    result = await this.CEther.owner();
    expect(result).to.be.equal(ZERO_ADDRESS);
    tx = await this.CEther.initialize({
      from: tokenOwner
    });
    console.log("CEther contract Initialize Gas: " + tx.receipt.gasUsed);
    // totcost = tx.receipt.gasUsed * GAS_PRICE;
    // console.log("ERC20 Coll1 Initialize costs: " + web3.utils.fromWei(totcost.toString(), 'ether') + " ETH");
    result = await this.CEther.owner();
    expect(result).to.be.equal(tokenOwner);
    console.log("CEther owner address: " + result);

    result = await this.CEther.totalSupply();
    //expect(result.toString()).to.be.equal(new BN(0).toString());
    console.log("CEther total supply: " + result);

    console.log("CEther exch rate: " + (await this.CEther.exchangeRateStored()).toString());
  });

  it('deploys cErc20 mockup', async function () {
    //gasPrice = await web3.eth.getGasPrice();
    //console.log("Gas price: " + gasPrice);
    console.log("TokenOwner address: " + tokenOwner);
    this.CErc20 = await CErc20.new({
      from: tokenOwner
    });
    expect(this.CErc20.address).to.be.not.equal(ZERO_ADDRESS);
    expect(this.CErc20.address).to.match(/0x[0-9a-fA-F]{40}/);
    console.log(`Coll Token Address: ${this.CErc20.address}`);

    tx = await web3.eth.getTransactionReceipt(this.CErc20.transactionHash);
    console.log("CErc20 contract deploy Gas: " + tx.gasUsed);
    //totcost = tx.gasUsed * GAS_PRICE;
    //console.log("ERC20 Coll1 deploy costs: " + web3.utils.fromWei(totcost.toString(), 'ether') + " ETH");
    result = await this.CErc20.owner();
    expect(result).to.be.equal(ZERO_ADDRESS);
    tx = await this.CErc20.initialize({
      from: tokenOwner
    });
    console.log("CErc20 contract Initialize Gas: " + tx.receipt.gasUsed);
    // totcost = tx.receipt.gasUsed * GAS_PRICE;
    // console.log("ERC20 Coll1 Initialize costs: " + web3.utils.fromWei(totcost.toString(), 'ether') + " ETH");
    result = await this.CErc20.owner();
    expect(result).to.be.equal(tokenOwner);
    console.log("CErc20 owner address: " + result);

    result = await this.CErc20.totalSupply();
    //expect(result.toString()).to.be.equal(new BN(0).toString());
    console.log("CErc20 total supply: " + result);

    console.log("CErc20 exch rate: " + (await this.CErc20.exchangeRateStored()).toString());

    tx = await this.CErc20.setToken(this.DAI.address); // just for mockup!!!
    tok = await this.CErc20.getAllowedToken();
    console.log(tok);
    expect(tok).to.be.equal(this.DAI.address);
  });

  it('deploys JAdminTools', async function () {
    this.JAdminTools = await JAdminTools.new({
      from: factoryOwner
    });
    tx = await web3.eth.getTransactionReceipt(this.JAdminTools.transactionHash);
    console.log("JAdminTools deploy Gas: " + tx.gasUsed);
    // totcost = tx.gasUsed * GAS_PRICE;
    // console.log("JAdminTools deploy costs: " + web3.utils.fromWei(totcost.toString(), 'ether') + " ETH");
    expect(this.JAdminTools.address).to.be.not.equal(ZERO_ADDRESS);
    expect(this.JAdminTools.address).to.match(/0x[0-9a-fA-F]{40}/);
    console.log("JAdminTools address: " + this.JAdminTools.address);
    tx = await this.JAdminTools.initialize({
      from: factoryOwner
    });
    console.log("JAdminTools Initialize Gas: " + tx.receipt.gasUsed);
    // totcost = tx.receipt.gasUsed * GAS_PRICE;
    // console.log("JAdminTools Initialize costs: " + web3.utils.fromWei(totcost.toString(), 'ether') + " ETH");
    result = await this.JAdminTools.owner();
    expect(result).to.be.equal(factoryOwner);
    console.log("JAdminTools owner address: " + result);
  });

  it('deploys JFeeCollector', async function () {
    console.log("factoryOwner address: " + factoryOwner);
    this.JFeesCollector = await JFeesCollector.new({
      from: factoryOwner
    })
    tx = await web3.eth.getTransactionReceipt(this.JFeesCollector.transactionHash);
    console.log("JFeesCollector deploy Gas: " + tx.gasUsed);
    // totcost = tx.gasUsed * GAS_PRICE;
    // console.log("JFeesCollector deploy costs: " + web3.utils.fromWei(totcost.toString(), 'ether') + " ETH");
    expect(this.JFeesCollector.address).to.be.not.equal(ZERO_ADDRESS);
    expect(this.JFeesCollector.address).to.match(/0x[0-9a-fA-F]{40}/);
    console.log("JFeesCollector address: " + this.JFeesCollector.address);
    tx = await this.JFeesCollector.initialize(this.JAdminTools.address, {
      from: factoryOwner
    });
    console.log("JFeesCollector Initialize Gas: " + tx.receipt.gasUsed);
    // totcost = tx.receipt.gasUsed * GAS_PRICE;
    // console.log("JFeesCollector Initialize costs: " + web3.utils.fromWei(totcost.toString(), 'ether') + " ETH");
    result = await this.JFeesCollector.owner();
    expect(result).to.be.equal(factoryOwner);
    console.log("JFeesCollector owner address: " + result);
  });

  it('set new admin in AdminTools contract', async function () {
    tx = await this.JAdminTools.addAdmin(factoryAdmin, {
      from: factoryOwner
    });
    // console.log(tx.receipt.gasUsed);
    // totcost = tx.gasUsed * GAS_PRICE;
    // console.log("New admin costs: " + web3.utils.fromWei(totcost.toString(), 'ether') + " ETH");
    expect(await this.JAdminTools.isAdmin(factoryAdmin)).to.be.true;
  });

  it('deploys Tranches Deployer', async function () {
    console.log("TokenOwner address: " + factoryOwner);
    this.JTranchesDeployer = await JTranchesDeployer.new({
      from: factoryOwner
    });
    tx = await web3.eth.getTransactionReceipt(this.JTranchesDeployer.transactionHash);
    console.log("Tranches Deployer deploy Gas: " + tx.gasUsed);
    expect(this.JTranchesDeployer.address).to.be.not.equal(ZERO_ADDRESS);
    expect(this.JTranchesDeployer.address).to.match(/0x[0-9a-fA-F]{40}/);
    console.log(`Tranches Deployer Address: ${this.JTranchesDeployer.address}`);
    result = await this.JTranchesDeployer.owner();
    expect(result).to.be.equal(ZERO_ADDRESS);
    console.log("Tranches deployer owner: " + result);
    tx = await this.JTranchesDeployer.initialize({
      from: factoryOwner
    });
    console.log("Tranches Deployer Initialize Gas: " + tx.receipt.gasUsed);
    //totcost = tx.gasUsed * GAS_PRICE;
    //console.log("ETH Tranche A deploy costs: " + web3.utils.fromWei(totcost.toString(), 'ether') + " ETH");
    result = await this.JTranchesDeployer.owner();
    expect(result).to.be.equal(factoryOwner);
    console.log("Tranches Deployer address: " + result);
  });

  it('deploys JCompound contract', async function () {
    this.JCompound = await JCompound.new({
      from: factoryOwner
    });
    expect(this.JCompound.address).to.be.not.equal(ZERO_ADDRESS);
    expect(this.JCompound.address).to.match(/0x[0-9a-fA-F]{40}/);
    console.log(`JCompound Address: ${this.JCompound.address}`);
    tx = await web3.eth.getTransactionReceipt(this.JCompound.transactionHash);
    console.log("JCompound deploy Gas: " + tx.gasUsed);
    //totcost = tx.gasUsed * GAS_PRICE;
    //console.log("ETH Tranche B deploy costs: " + web3.utils.fromWei(totcost.toString(), 'ether') + " ETH");
    result = await this.JCompound.owner();
    expect(result).to.be.equal(ZERO_ADDRESS);
    tx = await this.JCompound.initialize(this.JAdminTools.address, this.JFeesCollector.address, this.JTranchesDeployer.address, 
      ZERO_ADDRESS, ZERO_ADDRESS, this.SLICE.address, {
      from: factoryOwner
    });
    console.log("JCompound Initialize Gas: " + tx.receipt.gasUsed);
    result = await this.JCompound.owner();
    expect(result).to.be.equal(factoryOwner);
    console.log("JCompound owner address: " + result);
  });

  it('set protocol address in tranches deployer', async function () {
    tx = await this.JTranchesDeployer.setJCompoundAddress(this.JCompound.address, {
      from: factoryOwner
    });
    console.log("JTranchesDeployer set protocol address Gas: " + tx.receipt.gasUsed);
    jcomp = await this.JTranchesDeployer.jCompoundAddress();
    expect(jcomp).to.be.equal(this.JCompound.address);
  });

  it('deploys JCompound configuration', async function () {
    tx = await this.JCompound.setCEtherContract(this.CEther.address, {
      from: factoryOwner
    });
    tx = await this.JCompound.setCTokenContract(this.DAI.address, this.CErc20.address, {
      from: factoryOwner
    });

    tx = await this.JCompound.addTrancheToProtocol(ZERO_ADDRESS, "jEthTrancheAToken", "JEA", "jEthTrancheBToken", "JEB", web3.utils.toWei("0.04", "ether"), 18, 18, {
      from: factoryOwner
    });
    trParams = await this.JCompound.trancheAddresses(0);
    this.EthTrA = await JTrancheAToken.at(trParams.ATrancheAddress);
    console.log("Eth Tranche A Token Address: " + this.EthTrA.address);
    this.EthTrB = await JTrancheBToken.at(trParams.BTrancheAddress);
    console.log("Eth Tranche B Token Address: " + this.EthTrB.address);

    tx = await this.JCompound.addTrancheToProtocol(this.DAI.address, "jDaiTrancheAToken", "JDA", "jDaiTrancheBToken", "JDB", web3.utils.toWei("0.03", "ether"), 18, 18, {
      from: factoryOwner
    });
    trParams = await this.JCompound.trancheAddresses(1);
    this.DaiTrA = await JTrancheAToken.at(trParams.ATrancheAddress);
    console.log("Dai Tranche A Token Address: " + this.DaiTrA.address);
    this.DaiTrB = await JTrancheBToken.at(trParams.BTrancheAddress);
    console.log("Dai Tranche B Token Address: " + this.DaiTrB.address);
  });
}


function sendcETHtoProtocol(tokenOwner) {

  it('send some DAI to JCompound', async function () {
    tx = await this.CEther.transfer(this.JCompound.address, web3.utils.toWei('1', 'ether'), {
      from: tokenOwner
    });
    console.log("Gas to transfer DAI to JCompound: " + tx.receipt.gasUsed);
    // totcost = tx.receipt.gasUsed * GAS_PRICE;
    // console.log("transfer token costs: " + web3.utils.fromWei(totcost.toString(), 'ether') + " ETH");
    protBal = await this.CEther.balanceOf(this.JCompound.address);
    console.log(`protocol ETH Balance: ${web3.utils.fromWei(protBal, "ether")} DAI`)
    expect(web3.utils.fromWei(protBal, "ether")).to.be.equal(new BN(1).toString());
  });
}


function sendcDAItoProtocol(tokenOwner) {

  it('send some DAI to JCompound', async function () {
    tx = await this.CErc20.transfer(this.JCompound.address, web3.utils.toWei('100', 'ether'), {
      from: tokenOwner
    });
    console.log("Gas to transfer DAI to JCompound: " + tx.receipt.gasUsed);
    // totcost = tx.receipt.gasUsed * GAS_PRICE;
    // console.log("transfer token costs: " + web3.utils.fromWei(totcost.toString(), 'ether') + " ETH");
    protBal = await this.CErc20.balanceOf(this.JCompound.address);
    console.log(`protocol DAI Balance: ${web3.utils.fromWei(protBal, "ether")} DAI`)
    expect(web3.utils.fromWei(protBal, "ether")).to.be.equal(new BN(100).toString());
  });
}



function sendDAItoUsers(tokenOwner, user1, user2, user3, user4, user5, user6) {

  it('send some DAI to users', async function () {
    tx = await this.DAI.transfer(user1, web3.utils.toWei('100000', 'ether'), {
      from: tokenOwner
    });
    console.log("Gas to transfer DAI to user1: " + tx.receipt.gasUsed);
    userBal = await this.DAI.balanceOf(user1);
    console.log(`user1 DAI Balance: ${web3.utils.fromWei(userBal, "ether")} DAI`)
    expect(web3.utils.fromWei(userBal, "ether")).to.be.equal(new BN(100000).toString());

    tx = await this.DAI.transfer(user2, web3.utils.toWei('200000', 'ether'), {
      from: tokenOwner
    });
    console.log("Gas to transfer DAI to user2: " + tx.receipt.gasUsed);
    userBal = await this.DAI.balanceOf(user2);
    console.log(`user2 DAI Balance: ${web3.utils.fromWei(userBal, "ether")} DAI`)
    expect(web3.utils.fromWei(userBal, "ether")).to.be.equal(new BN(200000).toString());

    tx = await this.DAI.transfer(user3, web3.utils.toWei('300000', 'ether'), {
      from: tokenOwner
    });
    console.log("Gas to transfer DAI to user3: " + tx.receipt.gasUsed);
    userBal = await this.DAI.balanceOf(user3);
    console.log(`user3 DAI Balance: ${web3.utils.fromWei(userBal, "ether")} DAI`)
    expect(web3.utils.fromWei(userBal, "ether")).to.be.equal(new BN(300000).toString());

    tx = await this.DAI.transfer(user4, web3.utils.toWei('400000', 'ether'), {
      from: tokenOwner
    });
    console.log("Gas to transfer DAI to user4: " + tx.receipt.gasUsed);
    userBal = await this.DAI.balanceOf(user4);
    console.log(`user4 DAI Balance: ${web3.utils.fromWei(userBal, "ether")} DAI`)
    expect(web3.utils.fromWei(userBal, "ether")).to.be.equal(new BN(400000).toString());

    tx = await this.DAI.transfer(user5, web3.utils.toWei('500000', 'ether'), {
      from: tokenOwner
    });
    console.log("Gas to transfer DAI to user5: " + tx.receipt.gasUsed);
    userBal = await this.DAI.balanceOf(user5);
    console.log(`user5 DAI Balance: ${web3.utils.fromWei(userBal, "ether")} DAI`)
    expect(web3.utils.fromWei(userBal, "ether")).to.be.equal(new BN(500000).toString());

    tx = await this.DAI.transfer(user6, web3.utils.toWei('600000', 'ether'), {
      from: tokenOwner
    });
    console.log("Gas to transfer DAI to user6: " + tx.receipt.gasUsed);
    userBal = await this.DAI.balanceOf(user6);
    console.log(`user6 DAI Balance: ${web3.utils.fromWei(userBal, "ether")} DAI`)
    expect(web3.utils.fromWei(userBal, "ether")).to.be.equal(new BN(600000).toString());
  });
}



module.exports = {
  deployMinimumFactory,
  sendcETHtoProtocol,
  sendcDAItoProtocol,
  sendDAItoUsers
};