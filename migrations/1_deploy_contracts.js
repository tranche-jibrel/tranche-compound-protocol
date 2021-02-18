require('dotenv').config();
const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');
var myERC20 = artifacts.require("./myERC20.sol");
var { abi } = require('../build/contracts/myERC20.json');
var JFeesCollector = artifacts.require("./JFeesCollector.sol");
var JPriceOracle = artifacts.require("./JPriceOracle.sol");

//compound tranche import
var JCompound = artifacts.require("./compound/JCompound.sol");
var JCompoundDeployer = artifacts.require("./compound/JTranchesDeployer.sol");

module.exports = async (deployer, network, accounts) => {
  const MYERC20_TOKEN_SUPPLY = 5000000;
  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
  const emptyString = "0x0000000000000000000000000000000000000000000000000000000000000000";
  //const daiRequest = 100 * Math.pow(10, 18);
  //const DAI_REQUEST_HEX = "0x" + daiRequest.toString(16);
  //const ethRpb = 1 * Math.pow(10, 9);
  //const ETH_RPB_HEX = "0x" + ethRpb.toString(16);

  if (network == "development") {
    const tokenOwner = accounts[0];
    const myERC20instance = await deployProxy(myERC20, [MYERC20_TOKEN_SUPPLY], { from: tokenOwner });
    console.log('myERC20 Deployed: ', myERC20instance.address);

    const factoryOwner = accounts[0];
    const JFCinstance = await deployProxy(JFeesCollector, [], { from: factoryOwner });
    const JFCinst = await JFeesCollector.at(JFCinstance.address);
    const JFCinstance2 = await upgradeProxy(JFCinst.address, JFeesCollector2, { from: factoryOwner });
    console.log('JFeesCollector Deployed: ', JFCinst.address);
    console.log('JFeesCollector2 Deployed: ', JFCinstance2.address);

    const JPOinstance = await deployProxy(JPriceOracle, [ZERO_ADDRESS, ZERO_ADDRESS], { from: factoryOwner, unsafeAllowCustomTypes: true });
    console.log('JPriceOracle Deployed: ', JPOinstance.address);

  } else if (network == "kovan") {
    let {
      FEE_COLLECTOR_ADDRESS, PRICE_ORACLE_ADDRESS, DAIAddress, SLICEAddress, USDCAddress, AlasAddress, DivyasAddress,
      IS_UPGRADE, IS_PRICE_ORACLE_ADDRESS_UPGRADE, IS_FEE_COLLECTOR_UPGRADE, IS_COMPOUND, CDAI_ADDRESS
    } = process.env;
    let DAI = new web3.eth.Contract(abi, DAIAddress)
    const accounts = await web3.eth.getAccounts();
    const factoryOwner = accounts[0];
    if (IS_UPGRADE == 'true') {
      console.log('Contracts are upgrading, process started: ')
      console.log(`PRICE_ORACLE_ADDRESS=${PRICE_ORACLE_ADDRESS}`)
      console.log(`FEE_COLLECTOR_ADDRESS=${FEE_COLLECTOR_ADDRESS}`)
      console.log(`LOAN_HELPER_ADDRESS=${LOAN_HELPER_ADDRESS}`)
      console.log(`LOAN_ADDRESS=${LOAN_ADDRESS}`)
      console.log(`PROTOCOL_ADDRESS=${PROTOCOL_ADDRESS}`)

      if (IS_LOAN_ADDRESS_UPGRADE == 'true') {
        const JLinstance = await upgradeProxy(LOAN_ADDRESS, JLoan, { from: factoryOwner, unsafeAllowCustomTypes: true });
        console.log(`LOAN_ADDRESS=${JLinstance.address}`)
      }

      if (IS_PRICE_ORACLE_ADDRESS_UPGRADE == 'true') {
        const JPOinstance = await upgradeProxy(PRICE_ORACLE_ADDRESS, JPriceOracle, { from: factoryOwner, unsafeAllowCustomTypes: true });
        console.log(`PRICE_ORACLE_ADDRESS=${JPOinstance.address}`)
      }

      if (IS_FEE_COLLECTOR_UPGRADE == 'true') {
        const JFCinstance = await upgradeProxy(FEE_COLLECTOR_ADDRESS, JFeesCollector, { from: factoryOwner });
        console.log(`FEE_COLLECTOR_ADDRESS=${JFCinstance.address}`)
      }

      if (IS_PROTOCOL_ADDRESS_UPGRADE == 'true') {
        const JPinstance = await upgradeProxy(PROTOCOL_ADDRESS, JProtocol, { from: factoryOwner });
        console.log(`PROTOCOL_ADDRESS=${JPinstance.address}`)
      }
      //const JLHinstance = await upgradeProxy(LOAN_HELPER_ADDRESS, JLoanHelper, { from: factoryOwner});
      //console.log(`LOAN_HELPER_ADDRESS=${JLHinstance.address}`)
      console.log('contracts are upgraded')

    } else {
      // deployed new contract
      const JFCinstance = await deployProxy(JFeesCollector, [], { from: factoryOwner });
      const JPOinstance = await deployProxy(JPriceOracle, [UniRouterAddress, ZERO_ADDRESS], { from: factoryOwner, unsafeAllowCustomTypes: true });
      let JLHinstance = await deployer.deploy(JLoanHelper, JPOinstance.address, { from: factoryOwner });
      JLHinstance = await JLoanHelper.deployed();

      const JLinstance = await deployProxy(JLoan, [JPOinstance.address, JFCinstance.address, JLHinstance.address], { from: factoryOwner, unsafeAllowCustomTypes: true });
      await JLinstance.setGeneralLoansParams(50, 50, 200, 150, 120, 160, { from: factoryOwner });
      // console.log(await JLinstance.generalLoanParams())

      // admin setup 
      await JPOinstance.addAdmin(AlasAddress, { from: factoryOwner });
      await JPOinstance.addAdmin(DivyasAddress, { from: factoryOwner });


      // deploy jeth protocol address
      // deploy JTranchDeployers
      const JTEth = await deployProxy(JTranchEthDeployer, [], { from: factoryOwner, unsafeAllowCustomTypes: true });
      const JTErc20 = await deployProxy(JTranchErc20Deployer, [], { from: factoryOwner, unsafeAllowCustomTypes: true });

      // deploy jeth protocol address
      const JPinstance = await deployProxy(JProtocol, [JLinstance.address, JPOinstance.address, JFCinstance.address, JTEth.address, JTErc20.address], { from: factoryOwner, unsafeAllowCustomTypes: true });

      // add protocol address in JTrancheDeployers
      await JTEth.setJProtocolAddress(JPinstance.address)
      await JTErc20.setJProtocolAddress(JPinstance.address)

      // add protocol address in JLoan
      await JLinstance.setProtocolContractsAddress(JPinstance.address)

      // adding allowed pairs in JProtocol
      await JPinstance.pairIdAllowance(0, true, { from: factoryOwner })
      // await JPinstance.pairIdAllowance(1, true, { from: factoryOwner })

      // adding tranches to protocol
      await JPinstance.addTrancheToProtocol(0, "ETHDAI Tranche A", "EDTA", "ETHDAI Tranche B", "EDTB", 100000000, { from: factoryOwner })
      const trancheAddresses = await JPinstance.trancheAddresses(0, { from: factoryOwner });
      await DAI.methods.transfer(JPinstance.address, 1000).send({ from: factoryOwner });

      // Deploy open market
      if (IS_OPEN_MARKET === true) {
        let OpenMarketInstance = await deployer.deploy(OpenMarket, JLinstance.address, { from: factoryOwner });
        // set in JLoan
        JLinstance.setOpenMarketContractsAddress(OpenMarketInstance.address)
        console.log(`OPEN_MARKET_ADDRESS=${OpenMarketInstance.address}`)
      }

      if (IS_COMPOUND == 'true') {
        const compoundDeployer = await deployProxy(JCompoundDeployer, [], { from: factoryOwner, unsafeAllowCustomTypes: true });
        console.log(`COMPOUND_DEPLOYER=${compoundDeployer.address}`)
        // CETHAddress for Kovan: 0x41B5844f4680a8C38fBb695b7F9CFd1F64474a72
        // DAIAddress for Kovan: 0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa 
        // CDAIAddress for Kovan: 0xF0d0EB522cfa50B716B3b1604C4F0fA6f04376AD
        // Source: https://github.com/compound-finance/compound-config/blob/master/networks/kovan.json
        const JCompoundInstance = await deployProxy(JCompound, [JPOinstance.address, JFCinstance.address, compoundDeployer.address],
          { from: factoryOwner });

        console.log(`COMPOUND_TRANCHE_ADDRESS=${JCompoundInstance.address}`);
        compoundDeployer.setJCompoundAddress(JCompoundInstance.address);
        
        // TODO: dai address need to make it dynamic 
        await JCompoundInstance.setCTokenContract('0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa', CDAI_ADDRESS, { from: factoryOwner });
        await JCompoundInstance.setCTokenContract(ZERO_ADDRESS, '0x41b5844f4680a8c38fbb695b7f9cfd1f64474a72)', { from: factoryOwner });
        await JCompoundInstance.addTrancheToProtocol('0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa', "JCD tranche A", "JCDA", "JCD tranche A", "JCDB", 400, 8, 18, { from: factoryOwner });
        await JCompoundInstance.addTrancheToProtocol(ZERO_ADDRESS, "JCE tranche A", "JCEA", "JCE tranche A", "JCEB", 400, 8, 18, { from: factoryOwner });
        console.log(`JCompound deployed at: ${JCompoundInstance.address}`);
      }


      // Backend
      console.log(`FEES_COLLECTOR=${JFCinstance.address}`)
      console.log(`PRICE_ORACLE=${JPOinstance.address}`)
      // Frontend
      console.log(`REACT_APP_FEES_COLLECTOR=${JFCinstance.address}`)
      console.log(`REACT_APP_PRICE_ORACLE=${JPOinstance.address}`)
      // For upgrade
      console.log(`PRICE_ORACLE_ADDRESS=${JPOinstance.address}`)
      console.log(`FEE_COLLECTOR_ADDRESS=${JFCinstance.address}`)

    }
  }

};
