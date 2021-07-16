<!-- Add banner here -->

# Compound Tranche Protocol

<img src="https://gblobscdn.gitbook.com/spaces%2F-MP969WsfbfQJJFgxp2K%2Favatar-1617981494187.png?alt=media" alt="Tranche Logo" width="100">

Compound Tranche is a decentralized protocol for managing risk and maximizing returns. The protocol integrates with Compound's cTokens, to create two new interest-bearing instruments, one with a fixed-rate, Tranche A, and one with a variable rate, Tranche B. 

Info URL: https://docs.tranche.finance/tranchefinance/

## Development

### Install Dependencies

```bash
npm i
```

### Compile project

```bash
truffle compile --all
```

### Run test

```bash
truffle run test
```

## Tranche Compound Protocol Usage

a) deploy JCompound contract and initialize it ((address _adminTools, address _feesCollector, address _tranchesDepl,
            address _compTokenAddress, address _comptrollAddress, address _rewardsToken)

b) call setCEtherContract(address payable _cEtherContract) (cETH address) and setCTokenContract(address _erc20Contract, address _cErc20Contract), i.e. DAI and cDAI address, or 0x0(ethers) and cETH address, and so on.

    setCEtherContract on Kovan: 0x41b5844f4680a8c38fbb695b7f9cfd1f64474a72

    setCTokenContract on Kovan(DAI): "0x4f96fe3b7a6cf9725f59d353f723c1bdb64ca6aa","0xf0d0eb522cfa50b716b3b1604c4f0fa6f04376ad"

    setCTokenContract on Kovan(USDT): "0x07de306FF27a2B630B1141956844eB1552B956B5","0x3f0A0EA2f86baE6362CF9799B523BA06647Da018"

    setCTokenContract on Kovan(USDC): "0xb7a4F3E9097C08dA09517b5aB877F7a917224ede","0x4a92E71227D294F041BD82dd8f78591B75140d63"

c) set jCompound address in jTranchesDeployer contract

d) call addTrancheToProtocol(address _erc20Contract, string memory _nameA, string memory _symbolA, 
            string memory _nameB, string memory _symbolB, uint256 _fixedRpb, uint8 _cTokenDec, uint8 _underlyingDec) to set a new tranche set

    add eth tranche "0x0000000000000000000000000000000000000000","eta","ETA","etb","ETB","40000000000000000","8","18" ---> Please read note here below

    add DAI tranche "0x4f96fe3b7a6cf9725f59d353f723c1bdb64ca6aa","dta","DTA","dtb","DTB","30000000000000000","8","18"

    add USDT tranche "0x07de306FF27a2B630B1141956844eB1552B956B5","utta","UTTA","uttb","UTTB","200000000000000","8","6"
    
    add USDC tranche "0xb7a4F3E9097C08dA09517b5aB877F7a917224ede","ucta","UCTA","uctb","UCTB","30000000000000","8","6"

e) remember to enable every tranche deposit with setTrancheDeposit(uint256 _trancheNum, bool _enable) function

Users can now call buy and redeem functions for tranche A & B tokens

Note: if ETH tranche is deployed, please deploy ETHGateway contract without a proxy, then set its address in JCompound with setETHGateway function.

[(Back to top)](#Compound-Tranche-Protocol)

### Uniswap contracts
### !!! Please note: we have to use 2 different versions of library for tests and for deploy on mainnet / testnet !!!

This is due to different init code hash for UniswapV2Library file when compiled with other solidity compiler versions.

    - hex'96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f' 
    // original init code hash, remember to restore it before deploying and recompile all files

    - hex'555c8bf3a68dcde924051e2b2db6a6bbce50f756cacad88fdfcaab07ec40b7d9' 
    // i.e. init code hash for tests

Please launch `!!uniswapInitHashCode.test.js` to get your init code hash in test environment

Tests performed on Kovan with the following already present contracts that can be used in this project:

    Uniswap factory on kovan: 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f 
    
    Uniswap Router02 on kovan: 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D

    DAI address: 0x4f96fe3b7a6cf9725f59d353f723c1bdb64ca6aa

    WETH address: 0xd0a1e359811322d97991e03f863a0c30c2cf029c

    USDC address: 0xb7a4F3E9097C08dA09517b5aB877F7a917224ede

[(Back to top)](#Compound-Tranche-Protocol)


## Contracts Size (main contracts, no interfaces, no test contracts)

<table>
    <thead>
      <tr>
        <th>Contract</th>
        <th>Size</th>
        <th>Description</th>
      </tr>
    </thead>
    <tbody>
        <tr>
            <td>ETHGateway</td>
            <td><code>3.02 KiB</code></td>
            <td>Ethereum gateway</td>
        </tr>
        <tr>
            <td>JAdminTools</td>
            <td><code>2.73 KiB</code></td>
            <td>Contract for administrative roles control (implementation)</td>
        </tr>
        <tr>
            <td>JAdminToolsStorage</td>
            <td><code>0.87 KiB</code></td>
            <td>Contract for administrative roles control (storage)</td>
        </tr>
        <tr>
            <td>JCompound</td>
            <td><code>22.40 KiB</code></td>
            <td>Core contract protocol (implementation)</td>
        </tr>
        <tr>
            <td>JCompoundStorage</td>
            <td><code>1.71 KiB</code></td>
            <td>Core contract protocol (storage)</td>
        </tr>
        <tr>
            <td>JFeesCollector</td>
            <td><code>10.40 KiB</code></td>
            <td>Fees collector and uniswap swapper (implementation)</td>
        </tr>
        <tr>
            <td>JFeesCollectorStorage</td>
            <td><code>0.96 KiB</code></td>
            <td>Fees collector and uniswap swapper (storage)</td>
        </tr>
        <tr>
            <td>JTrancheAToken</td>
            <td><code>10.18 KiB</code></td>
            <td>Tranche A token (implementation)</td>
        </tr>
        <tr>
            <td>JTrancheATokenStorage</td>
            <td><code>0.44 KiB</code></td>
            <td>Tranche A token (storage)</td>
        </tr>
        <tr>
            <td>JTrancheBToken</td>
            <td><code>10.18 KiB</code></td>
            <td>Tranche B token (implementation)</td>
        </tr>
        <tr>
            <td>JTrancheBTokenStorage</td>
            <td><code>0.44 KiB</code></td>
            <td>Tranche B token (storage)</td>
        </tr>
        <tr>
            <td>JTranchesDeployer</td>
            <td><code>23.70 KiB</code></td>
            <td>Tranche A & B token deployer (implementation)</td>
        </tr>
        <tr>
            <td>JTranchesDeployerStorage</td>
            <td><code>0.14 KiB</code></td>
            <td>Tranche A & B token deployer (storage)</td>
        </tr>
    </tbody>
  </table>

  [(Back to top)](#Compound-Tranche-Protocol)
