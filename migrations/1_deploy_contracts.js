require('dotenv').config();
const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
var { abi } = require('../build/contracts/myERC20.json');

var JFeesCollector = artifacts.require("./mocks/JFeesCollector.sol");
var JPriceOracle = artifacts.require("./mocks/JPriceOracle.sol");
var myERC20 = artifacts.require("./mocks/myERC20.sol");
var CErc20 = artifacts.require('./mocks/CErc20.sol');
var CEther = artifacts.require('./mocks/CEther.sol');

var JCompound = artifacts.require('./JCompound');
var JTranchesDeployer = artifacts.require('./JTranchesDeployer');

var JTrancheAToken = artifacts.require('./JTrancheAToken');
var JTrancheBToken = artifacts.require('./JTrancheBToken');


module.exports = async (deployer, network, accounts) => {
  const MYERC20_TOKEN_SUPPLY = 5000000;
  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
  //const daiRequest = 100 * Math.pow(10, 18);
  //const DAI_REQUEST_HEX = "0x" + daiRequest.toString(16);
  //const ethRpb = 1 * Math.pow(10, 9);
  //const ETH_RPB_HEX = "0x" + ethRpb.toString(16);

  if (network == "development") {
    const tokenOwner = accounts[0];
    const myDAIinstance = await deployProxy(myERC20, [MYERC20_TOKEN_SUPPLY], { from: tokenOwner });
    console.log('myDAI Deployed: ', myDAIinstance.address);

    const mycEthinstance = await deployProxy(CEther, [], { from: tokenOwner });
    console.log('myCEth Deployed: ', mycEthinstance.address);

    const mycDaiinstance = await deployProxy(CErc20, [], { from: tokenOwner });
    console.log('myCErc20 Deployed: ', mycDaiinstance.address);

    const factoryOwner = accounts[0];
    const JFCinstance = await deployProxy(JFeesCollector, [], { from: factoryOwner });
    console.log('JFeesCollector Deployed: ', JFCinstance.address);

    const JPOinstance = await deployProxy(JPriceOracle, [], { from: factoryOwner });
    console.log('JPriceOracle Deployed: ', JPOinstance.address);

    const JTDeployer = await deployProxy(JTranchesDeployer, [], { from: factoryOwner });
    console.log("Tranches Deployer: " + JTDeployer.address);

    const JCinstance = await deployProxy(JCompound, [JPOinstance.address, JFCinstance.address, JTDeployer.address], { from: factoryOwner });
    console.log('JCompound Deployed: ', JCinstance.address);

    await JTDeployer.setJCompoundAddress(JCinstance.address, { from: factoryOwner });

    await JCinstance.setCEtherContract(mycEthinstance.address, { from: factoryOwner });
    await JCinstance.setCTokenContract(myDAIinstance.address, mycDaiinstance.address, { from: factoryOwner });

    await JCinstance.addTrancheToProtocol(ZERO_ADDRESS, "jEthTrancheAToken", "JEA", "jEthTrancheBToken", "JEB", 400, 8, 18, { from: factoryOwner });
    trParams = await JCinstance.trancheAddresses(0);
    let EthTrA = await JTrancheAToken.at(trParams.ATrancheAddress);
    console.log("Eth Tranche A Token Address: " + EthTrA.address);
    let EthTrB = await JTrancheBToken.at(trParams.BTrancheAddress);
    console.log("Eth Tranche B Token Address: " + EthTrB.address);
    console.log("Eth Tranche A Total supply: " + await EthTrA.totalSupply());
    console.log("Eth Tranche B Total supply: " + await EthTrB.totalSupply());

    await JCinstance.addTrancheToProtocol(myDAIinstance.address, "jDaiTrancheAToken", "JDA", "jDaiTrancheBToken", "JDB", 400, 8, 18, { from: factoryOwner });
    trParams = await JCinstance.trancheAddresses(1);
    let DaiTrA = await JTrancheAToken.at(trParams.ATrancheAddress);
    console.log("Eth Tranche A Token Address: " + DaiTrA.address);
    let DaiTrB = await JTrancheBToken.at(trParams.BTrancheAddress);
    console.log("Eth Tranche B Token Address: " + DaiTrB.address);
    console.log("Eth Tranche A Total supply: " + await DaiTrA.totalSupply());
    console.log("Eth Tranche B Total supply: " + await DaiTrB.totalSupply());

  } else if (network == "kovan") {
    let { FEE_COLLECTOR_ADDRESS, PRICE_ORACLE_ADDRESS, IS_UPGRADE, CDAI_ADDRESS, DAI_ADDRESS, CETH_ADDRESS } = process.env;
    const accounts = await web3.eth.getAccounts();
    const factoryOwner = accounts[0];
    if (IS_UPGRADE == 'true') {

      console.log('contracts are upgraded');
    } else {
      // deployed new contract
      const compoundDeployer = await deployProxy(JTranchesDeployer, [], { from: factoryOwner, unsafeAllowCustomTypes: true });
      console.log(`COMPOUND_DEPLOYER=${compoundDeployer.address}`);

      // CETHAddress for Kovan: 0x41B5844f4680a8C38fBb695b7F9CFd1F64474a72
      // DAIAddress for Kovan: 0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa 
      // CDAIAddress for Kovan: 0xF0d0EB522cfa50B716B3b1604C4F0fA6f04376AD
      // Source: https://github.com/compound-finance/compound-config/blob/master/networks/kovan.json
      const JPOinstance = await deployProxy(JPriceOracle, [], { from: factoryOwner });
      console.log('JPriceOracle Deployed: ', JPOinstance.address);

      const JCompoundInstance = await deployProxy(JCompound, [JPOinstance.address, FEE_COLLECTOR_ADDRESS, compoundDeployer.address],
        { from: factoryOwner });

      console.log(`COMPOUND_TRANCHE_ADDRESS=${JCompoundInstance.address}`);
      compoundDeployer.setJCompoundAddress(JCompoundInstance.address);

      console.log('compound deployer 1');
      // TODO: dai address need to make it dynamic 
      await JCompoundInstance.setCTokenContract(DAI_ADDRESS, CDAI_ADDRESS, { from: factoryOwner });

      console.log('compound deployer 2');
      await JCompoundInstance.setCEthContract(ZERO_ADDRESS, CETH_ADDRESS, { from: factoryOwner });

      console.log('compound deployer 3');
      await JCompoundInstance.addTrancheToProtocol(DAI_ADDRESS, "JCD tranche A", "JCDA", "JCD tranche A", "JCDB", 1859852476, 8, 18, { from: factoryOwner });

      console.log('compound deployer 4');
      await JCompoundInstance.addTrancheToProtocol(ZERO_ADDRESS, "JCE tranche A", "JCEA", "JCE tranche A", "JCEB", 1859852476, 8, 18, { from: factoryOwner });

      console.log('compound deployer 5');
      console.log(`JCompound deployed at: ${JCompoundInstance.address}`);
    }
  }
}