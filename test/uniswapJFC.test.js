
const { accounts, contract, web3 } = require('@openzeppelin/test-environment');
const { expect } = require('chai');
const {
  BN,           // Big Number support
  constants,    // Common constants, like the zero address and largest integers
  expectEvent,  // Assertions for emitted events
  expectRevert, // Assertions for transactions that should fail
  time,         // time utilities
} = require('@openzeppelin/test-helpers');

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

//const UniswapV2FactoryBytecode = require('@uniswap/v2-core/build/UniswapV2Factory.json').bytecode

const UniswapV2Factory = contract.fromArtifact("UniswapV2Factory");
const UniswapV2Pair = contract.fromArtifact("UniswapV2Pair");
const UniswapV2Router02 = contract.fromArtifact("UniswapV2Router02");

const weth = contract.fromArtifact("myWETH");
const token1 = contract.fromArtifact("myERC20");
const token2 = contract.fromArtifact("myERC20");

const JAdminTools = contract.fromArtifact("JAdminTools");
const JFeesCollector = contract.fromArtifact("JFeesCollector");

// FACTORY
// mainnet
const factory = '0xc0a47dFe034B400B47bDaD5FecDa2621de6c4d95'
// testnet
const kovanFactory = '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f'

// EXCHANGE
const kovanExchange = '0xFD5c5DAB526dB1Ea1c351f67b6CE99C9e6E304F4'

// ROUTER02 on all networks
const KovanRouter02 = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'

const STABLE_COIN_AMOUNT1 = 150000;

const STABLE_COIN_AMOUNT2 = 50;


describe('Uniswap JFeesCollector', function () {
  const [ tokenOwner, factoryOwner, factoryAdmin, feeSetter, jfcOwner ] = accounts;

    it('deploy', async () => {
      this.weth = await weth.new({ from: tokenOwner });
      console.log("myWETH address: " + this.weth.address);

      this.AT = await JAdminTools.new({ from: jfcOwner });
      console.log("myAT address: " + this.AT.address);
      await this.AT.initialize({ from: jfcOwner })

      this.JFeesCollector = await JFeesCollector.new({ from: jfcOwner });
      tx = await this.JFeesCollector.initialize(this.AT.address, { from: jfcOwner })

			this.uniswapV2Factory = await UniswapV2Factory.new(this.JFeesCollector.address, { from: factoryOwner });
			this.uniswapV2Router02 = await UniswapV2Router02.new(this.uniswapV2Factory.address, this.weth.address, { from: factoryOwner });
      console.log("init code hash pair for Uniswap library: " + await this.uniswapV2Factory.getInitCodeHashPair())

      this.token1 = await token1.new({ from: tokenOwner });
      tx = await this.token1.initialize(1000000, { from: tokenOwner })
      console.log("Token1 address: " + this.token1.address);
      this.token2 = await token2.new({ from: tokenOwner });
      tx = await this.token2.initialize(1000000, { from: tokenOwner })
      console.log("Token2 address: " + this.token2.address);

      tx = await this.JFeesCollector.setUniswapAddresses(this.uniswapV2Factory.address, this.uniswapV2Router02.address, { from: jfcOwner });
      console.log("JFC address: " + this.JFeesCollector.address);
      expect(this.uniswapV2Router02.address).to.be.equal( (await this.JFeesCollector.uniV2Router02()) )      
    });

    it('set a new pair of tokens and add liquidity', async () => {
      this.uniswapV2Factory.createPair(this.token1.address, this.token2.address, { from: factoryAdmin });
      console.log('Total Pairs: ' + await this.uniswapV2Factory.allPairsLength());
      pair0 = await this.uniswapV2Factory.allPairs(0);
      console.log('Pairs0 address: ' + pair0);
      pair0 = await this.uniswapV2Factory.getPair(this.token1.address, this.token2.address);
      console.log('Pairs0 get pair: ' + pair0);
      this.uniV2TokensPair = await UniswapV2Pair.at(pair0);
      fact = await this.uniV2TokensPair.factory();
      expect(fact).to.be.equal(this.uniswapV2Factory.address)
      console.log('Pairs0 token0: ' + await this.uniV2TokensPair.token0());
      console.log('Pairs0 token1: ' + await this.uniV2TokensPair.token1());
      console.log('Pairs0 total supply: ' + await this.uniV2TokensPair.totalSupply());
      //console.log('Pairs0 reserves: ' + JSON.stringify(await this.uniV2TokensPair.getReserves()));
      console.log('Pair liquidity: ' + JSON.stringify(await this.JFeesCollector.pairInfo(this.token1.address, this.token2.address)));

      console.log('tokenOwner TK1 balance: ' + web3.utils.fromWei(await this.token1.balanceOf(tokenOwner)))
      console.log('tokenOwner TK2 balance: ' + web3.utils.fromWei(await this.token2.balanceOf(tokenOwner)))

      tx = await this.token1.approve(this.uniswapV2Router02.address, web3.utils.toWei(STABLE_COIN_AMOUNT1.toString(),'ether'), {from: tokenOwner});
      tx = await this.token2.approve(this.uniswapV2Router02.address, web3.utils.toWei(STABLE_COIN_AMOUNT1.toString(),'ether'), {from: tokenOwner});

      addLiqTokens = await this.uniswapV2Router02.addLiquidity(this.token1.address, this.token2.address,
              web3.utils.toWei(STABLE_COIN_AMOUNT1.toString(),'ether'), web3.utils.toWei(STABLE_COIN_AMOUNT1.toString(),'ether'), 
              0, 0, tokenOwner, 1678461730, {from: tokenOwner});
      //console.log (JSON.stringify(addLiqtokens))

      console.log('tokenOwner TK1 balance: ' + web3.utils.fromWei(await this.token1.balanceOf(tokenOwner)))
      console.log('tokenOwner TK2 balance: ' + web3.utils.fromWei(await this.token2.balanceOf(tokenOwner)))
      console.log('tokenOwner LP balance: ' + web3.utils.fromWei(await this.uniV2TokensPair.balanceOf(tokenOwner)))

      console.log('Pairs0 total supply: ' + web3.utils.fromWei(await this.uniV2TokensPair.totalSupply()));
      //console.log('Pairs0 reserves: ' + JSON.stringify(await this.uniV2TokensPair.getReserves()));
      console.log('Pair liquidity: ' + JSON.stringify(await this.JFeesCollector.pairInfo(this.token1.address, this.token2.address)));
    });

    it('exchange token1 for token2 from LP0', async () => {
      let block = await web3.eth.getBlock("latest");
      console.log("Actual Block: " + block.number);
      console.log("Actual Block Timestamp: " + block.timestamp);

      let deadline = block.timestamp + 15; // using 'now' for convenience, for mainnet pass deadline from frontend!

      path = [this.token1.address, this.token2.address]
      amounts = await this.uniswapV2Router02.getAmountsOut(web3.utils.toWei("15000",'ether'), path)
      console.log(web3.utils.fromWei(amounts[0].toString()))
      console.log(web3.utils.fromWei(amounts[1].toString()))
      console.log("Price pair0: " + amounts[0] / amounts[1])
      tx = await this.token1.approve(this.uniswapV2Router02.address, web3.utils.toWei(STABLE_COIN_AMOUNT1.toString(),'ether'), {from: tokenOwner});
      exchangeEth = await this.uniswapV2Router02.swapExactTokensForTokens(amounts[0], amounts[1], path, tokenOwner, deadline, {from: tokenOwner});
      
      console.log('tokenOwner TK1 balance: ' + web3.utils.fromWei(await this.token1.balanceOf(tokenOwner)))
      console.log('tokenOwner TK2 balance: ' + web3.utils.fromWei(await this.token2.balanceOf(tokenOwner)))
      console.log('tokenOwner LP balance: ' + web3.utils.fromWei(await this.uniV2TokensPair.balanceOf(tokenOwner)))

      console.log('Pairs0 total supply: ' + web3.utils.fromWei(await this.uniV2TokensPair.totalSupply()))
      //console.log('Pairs0 reserves: ' + JSON.stringify(await this.uniV2TokensPair.getReserves()));
      console.log('Pair liquidity: ' + JSON.stringify(await this.JFeesCollector.pairInfo(this.token1.address, this.token2.address)));
    });

    it('exchange token2 for token1 from LP0', async () => {
      let block = await web3.eth.getBlock("latest");
      console.log("Actual Block: " + block.number);
      console.log("Actual Block Timestamp: " + block.timestamp);

      let deadline = block.timestamp + 15; // using 'now' for convenience, for mainnet pass deadline from frontend!

      path = [this.token2.address, this.token1.address]
      amounts = await this.uniswapV2Router02.getAmountsOut(web3.utils.toWei("15000",'ether'), path)
      console.log(web3.utils.fromWei(amounts[0].toString()))
      console.log(web3.utils.fromWei(amounts[1].toString()))
      console.log("Price pair0: " + amounts[0] / amounts[1])
      tx = await this.token2.approve(this.uniswapV2Router02.address, web3.utils.toWei(STABLE_COIN_AMOUNT1.toString(),'ether'), {from: tokenOwner});
      exchangeEth = await this.uniswapV2Router02.swapExactTokensForTokens(amounts[0], amounts[1], path, tokenOwner, deadline, {from: tokenOwner});
      
      console.log('tokenOwner TK1 balance: ' + web3.utils.fromWei(await this.token1.balanceOf(tokenOwner)))
      console.log('tokenOwner TK2 balance: ' + web3.utils.fromWei(await this.token2.balanceOf(tokenOwner)))
      console.log('tokenOwner LP balance: ' + web3.utils.fromWei(await this.uniV2TokensPair.balanceOf(tokenOwner)))

      console.log('Pairs0 total supply: ' + web3.utils.fromWei(await this.uniV2TokensPair.totalSupply()));
      //console.log('Pairs0 reserves: ' + JSON.stringify(await this.uniV2TokensPair.getReserves()));
      console.log('Pair liquidity: ' + JSON.stringify(await this.JFeesCollector.pairInfo(this.token1.address, this.token2.address)));
    });

    it('set a new pair of tokens and ETH and add liquidity', async () => {
      this.uniswapV2Factory.createPair(this.weth.address, this.token1.address, { from: factoryAdmin });
      console.log('Total Pairs: ' + await this.uniswapV2Factory.allPairsLength());
      pair1 = await this.uniswapV2Factory.allPairs(1);
      console.log('Pairs1 address: ' + pair1);
      pair1 = await this.uniswapV2Factory.getPair(this.weth.address, this.token1.address);
      console.log('Pairs1 get pair: ' + pair1);
      this.uniV2EthPair = await UniswapV2Pair.at(pair1);
      fact = await this.uniV2EthPair.factory();
      console.log('Pairs1 factory: ' + factory);
      expect(this.uniswapV2Factory.address).to.be.equal(fact)
      console.log('Pairs1 token0: ' + await this.uniV2EthPair.token0());
      console.log('Pairs1 token1: ' + await this.uniV2EthPair.token1());
      
      console.log('Pairs1 total supply: ' + await this.uniV2EthPair.totalSupply());
      console.log('Pairs1 reserves: ' + JSON.stringify(await this.uniV2EthPair.getReserves()));
      console.log('Pair liquidity: ' + JSON.stringify(await this.JFeesCollector.pairInfo(this.weth.address, this.token1.address)));

      console.log('tokenOwner TK1 balance: ' + web3.utils.fromWei(await this.token1.balanceOf(tokenOwner)))
      console.log('tokenOwner eth balance: ' + web3.utils.fromWei(await web3.eth.getBalance(tokenOwner)));

      tx = await this.token1.approve(this.uniswapV2Router02.address, web3.utils.toWei(STABLE_COIN_AMOUNT2.toString(),'ether'), {from: tokenOwner});

      addLiqEth = await this.uniswapV2Router02.addLiquidityETH(this.token1.address, web3.utils.toWei(STABLE_COIN_AMOUNT2.toString(),'ether'), 
            0, 0, tokenOwner, 1678461730, {from: tokenOwner, value: web3.utils.toWei("50",'ether')});
      //console.log (JSON.stringify(addLiqEth))

      console.log('tokenOwner TK1 balance: ' + web3.utils.fromWei(await this.token1.balanceOf(tokenOwner)))
      console.log('tokenOwner eth balance: ' + web3.utils.fromWei(await web3.eth.getBalance(tokenOwner)))
      console.log('tokenOwner LP balance: ' + web3.utils.fromWei(await this.uniV2EthPair.balanceOf(tokenOwner)))

      console.log('Pairs0 total supply: ' + web3.utils.fromWei(await this.uniV2TokensPair.totalSupply()))
      //console.log('Pairs0 reserves: ' + JSON.stringify(await this.uniV2TokensPair.getReserves()));
      console.log('Pair liquidity: ' + JSON.stringify(await this.JFeesCollector.pairInfo(this.weth.address, this.token1.address)));
    });

    it('exchange eth for tokens from LP1', async () => {
      let block = await web3.eth.getBlock("latest");
      console.log("Actual Block: " + block.number);
      console.log("Actual Block Timestamp: " + block.timestamp);

      let deadline = block.timestamp + 15; // using 'now' for convenience, for mainnet pass deadline from frontend!

      path = [this.weth.address, this.token1.address]
      amounts = await this.uniswapV2Router02.getAmountsIn(web3.utils.toWei("1.5",'ether'), path)
      console.log(web3.utils.fromWei(amounts[0].toString()))
      console.log(web3.utils.fromWei(amounts[1].toString()))
      console.log("Price pair1: " + amounts[0] / amounts[1])
      exchangeEth = await this.uniswapV2Router02.swapETHForExactTokens(amounts[0], path, tokenOwner, deadline, {from: tokenOwner, value: web3.utils.toWei("2",'ether') });
      
      console.log('tokenOwner TK1 balance: ' + web3.utils.fromWei(await this.token1.balanceOf(tokenOwner)))
      console.log('tokenOwner eth balance: ' + web3.utils.fromWei(await web3.eth.getBalance(tokenOwner)))
      console.log('tokenOwner LP balance: ' + web3.utils.fromWei(await this.uniV2EthPair.balanceOf(tokenOwner)))

      console.log('Pairs0 total supply: ' + web3.utils.fromWei(await this.uniV2TokensPair.totalSupply()))
      //console.log('Pairs0 reserves: ' + JSON.stringify(await this.uniV2TokensPair.getReserves()));
      console.log('Pair liquidity: ' + JSON.stringify(await this.JFeesCollector.pairInfo(this.weth.address, this.token1.address)));;
    });

    it('exchange tokens for eth from LP1', async () => {
      let block = await web3.eth.getBlock("latest");
      console.log("Actual Block: " + block.number);
      console.log("Actual Block Timestamp: " + block.timestamp);

      let deadline = block.timestamp + 15; // using 'now' for convenience, for mainnet pass deadline from frontend!

      path = [this.token1.address, this.weth.address]
      amounts = await this.uniswapV2Router02.getAmountsOut(web3.utils.toWei("1.5",'ether'), path)
      console.log(web3.utils.fromWei(amounts[0].toString()))
      console.log(web3.utils.fromWei(amounts[1].toString()))
      console.log("Price pair1: " + amounts[0] / amounts[1])
      tx = await this.token1.approve(this.uniswapV2Router02.address, web3.utils.toWei(STABLE_COIN_AMOUNT2.toString(),'ether'), {from: tokenOwner});
      exchangeEth = await this.uniswapV2Router02.swapExactTokensForETH(amounts[0], amounts[0], path, tokenOwner, deadline, { from: tokenOwner });
      
      console.log('tokenOwner TK1 balance: ' + web3.utils.fromWei(await this.token1.balanceOf(tokenOwner)))
      console.log('tokenOwner eth balance: ' + web3.utils.fromWei(await web3.eth.getBalance(tokenOwner)))
      console.log('tokenOwner LP balance: ' + web3.utils.fromWei(await this.uniV2EthPair.balanceOf(tokenOwner)))

      console.log('Pairs0 total supply: ' + web3.utils.fromWei(await this.uniV2TokensPair.totalSupply()))
      //console.log('Pairs0 reserves: ' + JSON.stringify(await this.uniV2TokensPair.getReserves()));
      console.log('Pair liquidity: ' + JSON.stringify(await this.JFeesCollector.pairInfo(this.weth.address, this.token1.address)));
    });

    it('sends eth and token2 to Fees collector', async () => {
      tx = await web3.eth.sendTransaction({from: tokenOwner, to: this.JFeesCollector.address, value: web3.utils.toWei("10",'ether')})
      tx = await this.token2.transfer(this.JFeesCollector.address, web3.utils.toWei("1000",'ether'), {from: tokenOwner})
      console.log("JFC eth balance: " + web3.utils.fromWei(await this.JFeesCollector.getEthBalance()) + " ETH")
      console.log("JFC TK2 balance: " + web3.utils.fromWei(await this.JFeesCollector.getTokenBalance(this.token2.address)) + " TK2")
    });

    it('Fees collector sends token2 for token1 in LP0', async () => {
      tx = await this.JFeesCollector.swapTokenForToken(this.token2.address, this.token1.address, web3.utils.toWei("500",'ether'))
      console.log("JFC TK2 balance: " + web3.utils.fromWei(await this.JFeesCollector.getTokenBalance(this.token2.address)) + " TK2")
      console.log("JFC TK1 balance: " + web3.utils.fromWei(await this.JFeesCollector.getTokenBalance(this.token1.address)) + " TK1")
    });

    it('Fees collector sends token1 for token2 in LP0', async () => {
      bal = await this.JFeesCollector.getTokenBalance(this.token1.address)
      tx = await this.JFeesCollector.swapTokenForToken(this.token1.address, this.token2.address, bal)
      console.log("JFC TK2 balance: " + web3.utils.fromWei(await this.JFeesCollector.getTokenBalance(this.token2.address)) + " TK2")
      console.log("JFC TK1 balance: " + web3.utils.fromWei(await this.JFeesCollector.getTokenBalance(this.token1.address)) + " TK1")
      bal = await this.JFeesCollector.getTokenBalance(this.token1.address)
      expect(bal.toString()).to.be.equal(new BN(0).toString())
    });

    it('Fees collector sends eth for token1 in LP1', async () => {
      tx = await this.JFeesCollector.swapEthForToken(this.token1.address, web3.utils.toWei("5",'ether'))
      console.log("JFC eth balance: " + web3.utils.fromWei(await this.JFeesCollector.getEthBalance()) + " ETH")
      console.log("JFC TK1 balance: " + web3.utils.fromWei(await this.JFeesCollector.getTokenBalance(this.token1.address)) + " TK1")
    });

    it('Fees collector sends token1 for eth in LP1', async () => {
      bal = await this.JFeesCollector.getTokenBalance(this.token1.address)
      tx = await this.JFeesCollector.swapTokenForEth(this.token1.address, bal)
      console.log("JFC eth balance: " + web3.utils.fromWei(await this.JFeesCollector.getEthBalance()) + " ETH")
      console.log("JFC TK1 balance: " + web3.utils.fromWei(await this.JFeesCollector.getTokenBalance(this.token1.address)) + " TK1")
      bal = await this.JFeesCollector.getTokenBalance(this.token1.address)
      expect(bal.toString()).to.be.equal(new BN(0).toString())
    });

  });
