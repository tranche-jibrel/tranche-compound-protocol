require('dotenv').config();

module.exports = {
  skipFiles: [
    //'Migrations.sol',
  ],

  mocha: {
    enableTimeouts: false,
  },

  providerOptions: {
    allowUnlimetedContractSize: true,
    gasLimit: 0xfffffffffff,
    // logger: console,
    port: 9545,
    // fork: `https://mainnet.infura.io/v3/${process.env.INFURA_KEY}`, //@13410306`,
    fork: `https://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_KEY}/@13410306`,
    network_id: 1,
    unlocked_accounts: [
      '0x5ad3330aebdd74d7dda641d37273ac1835ee9330', // DAi tests
      '0xAe2D4617c862309A3d75A0fFB358c7a5009c673F', // USDC tests
      '0x2fEb1512183545f48f6b9C5b4EbfCaF49CfCa6F3', // WETH tests
    ],
  }
};
