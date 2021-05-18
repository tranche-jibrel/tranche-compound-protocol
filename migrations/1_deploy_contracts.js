require('dotenv').config();
const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
var { abi } = require('../build/contracts/myERC20.json');

var myERC20 = artifacts.require("./mocks/myERC20.sol");
var CErc20 = artifacts.require('./mocks/CErc20.sol');
var CEther = artifacts.require('./mocks/CEther.sol');

var JAdminTools = artifacts.require("./JAdminTools.sol");
var JFeesCollector = artifacts.require("./JFeesCollector.sol");
var JCompound = artifacts.require('./JCompound');
var JTranchesDeployer = artifacts.require('./JTranchesDeployer');

var JTrancheAToken = artifacts.require('./JTrancheAToken');
var JTrancheBToken = artifacts.require('./JTrancheBToken');

var EthGateway = artifacts.require('./ETHGateway');

module.exports = async (deployer, network, accounts) => {
  const MYERC20_TOKEN_SUPPLY = 5000000;
  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
  const COMP_ADDRESS = "0xc00e94cb662c3520282e6f5717214004a7f26888";
  const TROLLER_ADDRESS = "0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B";
  //const daiRequest = 100 * Math.pow(10, 18);
  //const DAI_REQUEST_HEX = "0x" + daiRequest.toString(16);
  //const ethRpb = 1 * Math.pow(10, 9);
  //const ETH_RPB_HEX = "0x" + ethRpb.toString(16);

  if (network == "development") {
    const tokenOwner = accounts[0];

    const mySLICEinstance = await deployProxy(myERC20, [MYERC20_TOKEN_SUPPLY], { from: tokenOwner });
    console.log('mySLICE Deployed: ', mySLICEinstance.address);

    const myDAIinstance = await deployProxy(myERC20, [MYERC20_TOKEN_SUPPLY], { from: tokenOwner });
    console.log('myDAI Deployed: ', myDAIinstance.address);

    const mycEthinstance = await deployProxy(CEther, [], { from: tokenOwner });
    console.log('myCEth Deployed: ', mycEthinstance.address);

    const mycDaiinstance = await deployProxy(CErc20, [], { from: tokenOwner });
    console.log('myCErc20 Deployed: ', mycDaiinstance.address);

    const factoryOwner = accounts[0];
    const JATinstance = await deployProxy(JAdminTools, [], { from: factoryOwner });
    console.log('JAdminTools Deployed: ', JATinstance.address);

    const JFCinstance = await deployProxy(JFeesCollector, [JATinstance.address], { from: factoryOwner });
    console.log('JFeesCollector Deployed: ', JFCinstance.address);

    const JTDeployer = await deployProxy(JTranchesDeployer, [], { from: factoryOwner });
    console.log("Tranches Deployer: " + JTDeployer.address);

    const JCinstance = await deployProxy(JCompound, [JATinstance.address, JFCinstance.address, JTDeployer.address,
      COMP_ADDRESS, TROLLER_ADDRESS, mySLICEinstance.address], { from: factoryOwner });
    console.log('JCompound Deployed: ', JCinstance.address);

    await deployer.deploy(EthGateway, mycEthinstance.address, JCinstance.address);
    const JEGinstance = await EthGateway.deployed();
    console.log('ETHGateway Deployed: ', JEGinstance.address);

    await JTDeployer.setJCompoundAddress(JCinstance.address, { from: factoryOwner });

    await JCinstance.setETHGateway(JEGinstance.address, { from: factoryOwner });

    await JCinstance.setCEtherContract(mycEthinstance.address, { from: factoryOwner });
    await JCinstance.setCTokenContract(myDAIinstance.address, mycDaiinstance.address, { from: factoryOwner });

    await JCinstance.addTrancheToProtocol(ZERO_ADDRESS, "jEthTrancheAToken", "JEA", "jEthTrancheBToken", "JEB", web3.utils.toWei("0.04", "ether"), 18, 18, { from: factoryOwner });
    trParams = await JCinstance.trancheAddresses(0);
    let EthTrA = await JTrancheAToken.at(trParams.ATrancheAddress);
    console.log("Eth Tranche A Token Address: " + EthTrA.address);
    let EthTrB = await JTrancheBToken.at(trParams.BTrancheAddress);
    console.log("Eth Tranche B Token Address: " + EthTrB.address);

    await JCinstance.addTrancheToProtocol(myDAIinstance.address, "jDaiTrancheAToken", "JDA", "jDaiTrancheBToken", "JDB", web3.utils.toWei("0.02", "ether"), 18, 18, { from: factoryOwner });
    trParams = await JCinstance.trancheAddresses(1);
    let DaiTrA = await JTrancheAToken.at(trParams.ATrancheAddress);
    console.log("Eth Tranche A Token Address: " + DaiTrA.address);
    let DaiTrB = await JTrancheBToken.at(trParams.BTrancheAddress);
    console.log("Eth Tranche B Token Address: " + DaiTrB.address);

  } else if (network == "kovan") {
    let { IS_UPGRADE, TRANCHE_ONE_TOKEN_ADDRESS, TRANCHE_ONE_CTOKEN_ADDRESS,
      TRANCHE_TWO_TOKEN_ADDRESS, TRANCHE_TWO_CTOKEN_ADDRESS, COMP_ADDRESS, COMP_CONTROLLER, SLICE_ADDRESS
    } = process.env;
    const accounts = await web3.eth.getAccounts();
    const factoryOwner = accounts[0];
    if (IS_UPGRADE == 'true') {
      console.log('contracts are upgraded');
    } else {
      // deployed new contract
      try {
        const JATinstance = await deployProxy(JAdminTools, [], { from: factoryOwner });
        console.log('JAdminTools Deployed: ', JATinstance.address);

        const JFCinstance = await deployProxy(JFeesCollector, [JATinstance.address], { from: factoryOwner });
        console.log('JFeesCollector Deployed: ', JFCinstance.address);

        const compoundDeployer = await deployProxy(JTranchesDeployer, [], { from: factoryOwner, unsafeAllowCustomTypes: true });
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
        await JCompoundInstance.addTrancheToProtocol(TRANCHE_ONE_TOKEN_ADDRESS, "Tranche A - Compound DAI", "ACDAI", "Tranche B - Compound DAI", "BCDAI", web3.utils.toWei("0.04", "ether"), 8, 18, { from: factoryOwner });

        console.log('compound deployer 4');
        //await JCompoundInstance.addTrancheToProtocol(ZERO_ADDRESS, "Tranche A - Compound ETH", "ACETH", "Tranche B - Compound ETH", "BCETH", web3.utils.toWei("0.04", "ether"), 8, 18, { from: factoryOwner });
        // await JCompoundInstance.addTrancheToProtocol("0xb7a4f3e9097c08da09517b5ab877f7a917224ede", "Tranche A - Compound USDC", "ACUSDC", "Tranche B - Compound USDC", "BCUSDC", web3.utils.toWei("0.02", "ether"), 8, 6, { from: factoryOwner });
        await JCompoundInstance.addTrancheToProtocol(TRANCHE_TWO_TOKEN_ADDRESS, "Tranche A - Compound USDT", "ACUSDT", "Tranche B - Compound USDT", "BCUSDT", web3.utils.toWei("0.02", "ether"), 8, 6, { from: factoryOwner });

        trParams = await JCompoundInstance.trancheAddresses(0);
        let DaiTrA = await trParams.ATrancheAddress;
        let DaiTrB = await trParams.BTrancheAddress;
        trParams = await JCompoundInstance.trancheAddresses(1);
        let USDTTrA = await trParams.ATrancheAddress;
        let USDTTrB = await trParams.BTrancheAddress;

        console.log(`COMPOUND_TRANCHE_ADDRESS=${JCompoundInstance.address}`);
        console.log(`REACT_APP_COMP_TRANCHE_TOKENS=${DaiTrA.address},${DaiTrB.address},${USDTTrA.address},${USDTTrB.address}`)
      } catch (error) {
        console.log(error);
      }
    }
  } else if (network == "mainnet") {
    let { 
      TRANCHE_ONE_TOKEN_ADDRESS, TRANCHE_ONE_CTOKEN_ADDRESS, TRANCHE_TWO_TOKEN_ADDRESS, TRANCHE_TWO_CTOKEN_ADDRESS, COMP_ADDRESS, COMP_CONTROLLER, SLICE_ADDRESS
    } = process.env;
    const accounts = await web3.eth.getAccounts();
    const factoryOwner = accounts[0];
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
      await JCompoundInstance.addTrancheToProtocol(TRANCHE_ONE_TOKEN_ADDRESS, "Tranche A - Compound DAI", "ACDAI", "Tranche B - Compound DAI", "BCDAI", web3.utils.toWei("0.04", "ether"), 8, 18, { from: factoryOwner });

      console.log('compound deployer 4');
      await JCompoundInstance.addTrancheToProtocol(TRANCHE_TWO_TOKEN_ADDRESS, "Tranche A - Compound USDC", "ACUSDC", "Tranche B - Compound USDC", "BCUSDC", web3.utils.toWei("0.02", "ether"), 8, 6, { from: factoryOwner });

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
