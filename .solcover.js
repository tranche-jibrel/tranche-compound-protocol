require('dotenv').config();

module.exports = {
  skipFiles: [
    //'Migrations.sol',
  ],

  mocha: {
    enableTimeouts: false,
  }
};
