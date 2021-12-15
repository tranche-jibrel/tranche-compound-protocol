require('dotenv').config();
const { deployProxy, upgradeProxy } = require('@openzeppelin/truffle-upgrades');

var JAdminTools = artifacts.require("./JAdminTools.sol");
var JFeesCollector = artifacts.require("./JFeesCollector.sol");
var JCompound = artifacts.require('./JCompound');
var JCompoundHelper = artifacts.require('./JCompoundHelper');
var JTranchesDeployer = artifacts.require('./JTranchesDeployer');

module.exports = async (deployer, network, accounts) => {
  if (network == "development1") {

  } else if (network == "kovan") {

  } else if (network == "mainnet") {

    let {
      IS_UPGRADE, TRANCHE_ONE_TOKEN_ADDRESS, TRANCHE_ONE_CTOKEN_ADDRESS, TRANCHE_TWO_TOKEN_ADDRESS, TRANCHE_TWO_CTOKEN_ADDRESS, COMP_ADDRESS, COMP_CONTROLLER, SLICE_ADDRESS,
      FEE_COLLECTOR_ADDRESS, COMPOUND_TRANCHE_ADDRESS
    } = process.env;
    const accounts = await web3.eth.getAccounts();
    const factoryOwner = accounts[0];

    if (IS_UPGRADE == 'true') {
      console.log('contracts are being upgraded');
      const JCompoundInstance = await upgradeProxy(COMPOUND_TRANCHE_ADDRESS, JCompound, { from: factoryOwner });
      console.log(`COMPOUND_TRANCHE_ADDRESS=${JCompoundInstance.address}`)
      const JCHelper = await deployProxy(JCompoundHelper, [], { from: factoryOwner });
      console.log("JC Helper: " + JCHelper.address);
      await JcompoundInstance.setJCompoundHelperAddress(JCHelper.address)
      console.log('set helper in jcompound');
    } else {
      try {
        const JATinstance = await JAdminTools.at(ADMIN_TOOLS_ADDRESS);
        console.log('JAdminTools Deployed: ', JATinstance.address);

        const JFCinstance = await JFeesCollector.at(FEE_COLLECTOR_ADDRESS);
        console.log('JFeesCollector Deployed: ', JFCinstance.address);

        const compoundDeployer = await JTranchesDeployer.at(COMPOUND_DEPLOYER);
        console.log(`COMPOUND_DEPLOYER=${compoundDeployer.address}`);

        const JCompoundInstance = await JCompound.at(COMPOUND_TRANCHE_ADDRESS);
        console.log(`COMPOUND_TRANCHE_ADDRESS=${JCompoundInstance.address}`);

        // Aave - cAave
        /*await JCompoundInstance.setCTokenContract("0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9", "0xe65cdB6479BaC1e22340E4E755fAE7E509EcD06c", { from: factoryOwner });
        await JCompoundInstance.addTrancheToProtocol("0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9", "Tranche A - Compound AAVE", "ACAAVE", "Tranche B - Compound AAVE", "BCAAVE", web3.utils.toWei("0", "ether"), 8, 18, { from: factoryOwner });
        console.log('compound Aave - cAave added');
        let trancheCounter = await JCompoundInstance.JCompoundInstance();
        trParams = await JCompoundInstance.trancheAddresses(trancheCounter - 1);
        console.log("TrancheA: " + trParams.ATrancheAddress + ", TrancheB: " + trParams.BTrancheAddress)
        await JCinstance.setTrancheDeposit(trancheCounter - 1, true); // enabling deposit

        // Bat - cBat
        await JCompoundInstance.setCTokenContract("0x0D8775F648430679A709E98d2b0Cb6250d2887EF", "0x70e36f6bf80a52b3b46b3af8e106cc0ed743e8e4", { from: factoryOwner });
        await JCompoundInstance.addTrancheToProtocol("0x0D8775F648430679A709E98d2b0Cb6250d2887EF", "Tranche A - Compound BAT", "ACBAT", "Tranche B - Compound BAT", "BCBAT", web3.utils.toWei("0.003", "ether"), 8, 18, { from: factoryOwner });
        console.log('compound Bat - cBat added');
        let trancheCounter = await JCompoundInstance.JCompoundInstance();
        trParams = await JCompoundInstance.trancheAddresses(trancheCounter - 1);
        console.log("TrancheA: " + trParams.ATrancheAddress + ", TrancheB: " + trParams.BTrancheAddress)
        await JCinstance.setTrancheDeposit(trancheCounter - 1, true); // enabling deposit

        // Comp - cComp
        await JCompoundInstance.setCTokenContract("0xc00e94Cb662C3520282E6f5717214004A7f26888", "0x70e36f6BF80a52b3B46b3aF8e106CC0ed743E8e4", { from: factoryOwner });
        await JCompoundInstance.addTrancheToProtocol("0xc00e94Cb662C3520282E6f5717214004A7f26888", "Tranche A - Compound COMP", "ACCOMP", "Tranche B - Compound COMP", "BCCOMP", web3.utils.toWei("0.0027", "ether"), 8, 18, { from: factoryOwner });
        console.log('compound Comp - cComp added');
        let trancheCounter = await JCompoundInstance.JCompoundInstance();
        trParams = await JCompoundInstance.trancheAddresses(trancheCounter - 1);
        console.log("TrancheA: " + trParams.ATrancheAddress + ", TrancheB: " + trParams.BTrancheAddress)
        await JCinstance.setTrancheDeposit(trancheCounter - 1, true); // enabling deposit

        // Mkr - cMkr
        await JCompoundInstance.setCTokenContract("0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2", "0x95b4eF2869eBD94BEb4eEE400a99824BF5DC325b", { from: factoryOwner });
        await JCompoundInstance.addTrancheToProtocol("0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2", "Tranche A - Compound MKR", "ACMKR", "Tranche B - Compound MKR", "BCMKR", web3.utils.toWei("0", "ether"), 8, 18, { from: factoryOwner });
        console.log('compound Mkr - cMkr added');
        let trancheCounter = await JCompoundInstance.JCompoundInstance();
        trParams = await JCompoundInstance.trancheAddresses(trancheCounter - 1);
        console.log("TrancheA: " + trParams.ATrancheAddress + ", TrancheB: " + trParams.BTrancheAddress)
        await JCinstance.setTrancheDeposit(trancheCounter - 1, true); // enabling deposit

        // Sai - CSai
        await JCompoundInstance.setCTokenContract("0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359", "0xF5DCe57282A584D2746FaF1593d3121Fcac444dC", { from: factoryOwner });
        await JCompoundInstance.addTrancheToProtocol("0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359", "Tranche A - Compound SAI", "ACSAI", "Tranche B - Compound SAI", "BCSAI", web3.utils.toWei("0", "ether"), 8, 18, { from: factoryOwner });
        console.log('compound Sai - CSai added');
        let trancheCounter = await JCompoundInstance.JCompoundInstance();
        trParams = await JCompoundInstance.trancheAddresses(trancheCounter - 1);
        console.log("TrancheA: " + trParams.ATrancheAddress + ", TrancheB: " + trParams.BTrancheAddress)
        await JCinstance.setTrancheDeposit(trancheCounter - 1, true); // enabling deposit

        // Sushi - CSushi
        await JCompoundInstance.setCTokenContract("0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359", "0x4B0181102A0112A2ef11AbEE5563bb4a3176c9d7", { from: factoryOwner });
        await JCompoundInstance.addTrancheToProtocol("0x89d24A6b4CcB1B6fAA2625fE562bDD9a23260359", "Tranche A - Compound SUSHI", "ACSUSHI", "Tranche B - Compound SUSHI", "BCSUSHI", web3.utils.toWei("0", "ether"), 8, 18, { from: factoryOwner });
        console.log('compound Sushi - CSushi added');
        let trancheCounter = await JCompoundInstance.JCompoundInstance();
        trParams = await JCompoundInstance.trancheAddresses(trancheCounter - 1);
        console.log("TrancheA: " + trParams.ATrancheAddress + ", TrancheB: " + trParams.BTrancheAddress)
        await JCinstance.setTrancheDeposit(trancheCounter - 1, true); // enabling deposit*/

        // Tusd - CTusd
        await JCompoundInstance.setCTokenContract("0x0000000000085d4780B73119b644AE5ecd22b376", "0x12392F67bdf24faE0AF363c24aC620a2f67DAd86", { from: factoryOwner });
        await JCompoundInstance.addTrancheToProtocol("0x0000000000085d4780B73119b644AE5ecd22b376", "Tranche A - Compound TUSD", "ACTUSD", "Tranche B - Compound TUSD", "BCTUSD", web3.utils.toWei("0.0123", "ether"), 8, 18, { from: factoryOwner });
        console.log('compound Tusd - CTusd added');
        let trancheCounter = await JCompoundInstance.JCompoundInstance();
        trParams = await JCompoundInstance.trancheAddresses(trancheCounter - 1);
        console.log("TrancheA: " + trParams.ATrancheAddress + ", TrancheB: " + trParams.BTrancheAddress)
        await JCinstance.setTrancheDeposit(trancheCounter - 1, true); // enabling deposit

        // Uni - CUni
        /*await JCompoundInstance.setCTokenContract("0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", "0x35A18000230DA775CAc24873d00Ff85BccdeD550", { from: factoryOwner });
        await JCompoundInstance.addTrancheToProtocol("0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", "Tranche A - Compound UNI", "ACUNI", "Tranche B - Compound UNI", "BCUNI", web3.utils.toWei("0.0011", "ether"), 8, 18, { from: factoryOwner });
        console.log('compound Uni - CUni added');
        let trancheCounter = await JCompoundInstance.JCompoundInstance();
        trParams = await JCompoundInstance.trancheAddresses(trancheCounter - 1);
        console.log("TrancheA: " + trParams.ATrancheAddress + ", TrancheB: " + trParams.BTrancheAddress)
        await JCinstance.setTrancheDeposit(trancheCounter - 1, true); // enabling deposit 

        // Usdt - CUsdt
        await JCompoundInstance.setCTokenContract("0xdAC17F958D2ee523a2206206994597C13D831ec7", "0xf650c3d88d12db855b8bf7d11be6c55a4e07dcc9", { from: factoryOwner });
        await JCompoundInstance.addTrancheToProtocol("0xdAC17F958D2ee523a2206206994597C13D831ec7", "Tranche A - Compound USDT", "ACUSDT", "Tranche B - Compound USDT", "BCUSDT", web3.utils.toWei("0", "ether"), 8, 6, { from: factoryOwner });
        console.log('compound Usdt - CUsdt added');
        let trancheCounter = await JCompoundInstance.JCompoundInstance();
        trParams = await JCompoundInstance.trancheAddresses(trancheCounter - 1);
        console.log("TrancheA: " + trParams.ATrancheAddress + ", TrancheB: " + trParams.BTrancheAddress)
        await JCinstance.setTrancheDeposit(trancheCounter - 1, true); // enabling deposit

        // Yfi - Cyfi
        await JCompoundInstance.setCTokenContract("0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", "0x35A18000230DA775CAc24873d00Ff85BccdeD550", { from: factoryOwner });
        await JCompoundInstance.addTrancheToProtocol("0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", "Tranche A - Compound YFI", "ACYFI", "Tranche B - Compound YFI", "BCYFI", web3.utils.toWei("0.0024", "ether"), 8, 18, { from: factoryOwner });
        console.log('compound Yfi - Cyfi added');
        let trancheCounter = await JCompoundInstance.JCompoundInstance();
        trParams = await JCompoundInstance.trancheAddresses(trancheCounter - 1);
        console.log("TrancheA: " + trParams.ATrancheAddress + ", TrancheB: " + trParams.BTrancheAddress)
        await JCinstance.setTrancheDeposit(trancheCounter - 1, true); // enabling deposit

        // Zrx - CZrx
        await JCompoundInstance.setCTokenContract("0xE41d2489571d322189246DaFA5ebDe1F4699F498", "0xB3319f5D18Bc0D84dD1b4825Dcde5d5f7266d407", { from: factoryOwner });
        await JCompoundInstance.addTrancheToProtocol("0xE41d2489571d322189246DaFA5ebDe1F4699F498", "Tranche A - Compound ZRX", "ACZRX", "Tranche B - Compound ZRX", "BCZRX", web3.utils.toWei("0.0024", "ether"), 8, 18, { from: factoryOwner });
        console.log('compound Yfi - Cyfi added');
        let trancheCounter = await JCompoundInstance.JCompoundInstance();
        trParams = await JCompoundInstance.trancheAddresses(trancheCounter - 1);
        console.log("TrancheA: " + trParams.ATrancheAddress + ", TrancheB: " + trParams.BTrancheAddress)
        await JCinstance.setTrancheDeposit(trancheCounter - 1, true); // enabling deposit*/

      } catch (error) {
        console.log(error);
      }
    }
  }
}