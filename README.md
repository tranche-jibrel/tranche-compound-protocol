## compoundProtocol usage

a) deploy JCompound contract and initialize it (address _priceOracle, address _feesCollector, address _tranchesDepl)

b) call setCEtherContract(address payable _cEtherContract) (cETH address) and setCTokenContract(address _erc20Contract, address _cErc20Contract), i.e. DAI and cDAI address, or 0x0(ethers) and cETH address, and so on.

    setCEtherContract on Kovan: 0x41b5844f4680a8c38fbb695b7f9cfd1f64474a72

    setCTokenContract on Kovan(DAI): "0x4f96fe3b7a6cf9725f59d353f723c1bdb64ca6aa","0xf0d0eb522cfa50b716b3b1604c4f0fa6f04376ad"

    setCTokenContract on Kovan(USDT): "0x07de306FF27a2B630B1141956844eB1552B956B5","0x3f0A0EA2f86baE6362CF9799B523BA06647Da018"

    setCTokenContract on Kovan(USDC): "0xb7a4F3E9097C08dA09517b5aB877F7a917224ede","0x4a92E71227D294F041BD82dd8f78591B75140d63"

c) set jCompound address in jTranchesDeployer contract

c) call addTrancheToProtocol(address _erc20Contract, string memory _nameA, string memory _symbolA, 
            string memory _nameB, string memory _symbolB, uint256 _fixedRpb, uint8 _cTokenDec, uint8 _underlyingDec) to set a new tranche set

    add eth tranche "0x0000000000000000000000000000000000000000","eta","ETA","etb","ETB","40000000000000000","8","18" ---> Please read note here below

    add DAI tranche "0x4f96fe3b7a6cf9725f59d353f723c1bdb64ca6aa","dta","DTA","dtb","DTB","30000000000000000","8","18"

    add USDT tranche "0x07de306FF27a2B630B1141956844eB1552B956B5","utta","UTTA","uttb","UTTB","200000000000000","8","6"
    
    add USDC tranche "0xb7a4F3E9097C08dA09517b5aB877F7a917224ede","ucta","UCTA","uctb","UCTB","30000000000000","8","6"

Users can now call buy and redeem functions for tranche A & B tokens

Note: if ETH tranche is deployed, please deploy ETHGateway contract without a proxy, then set its address in JCompound with setETHGateway function.


## Contracts Size (main contracts, no interfaces, no test contracts)
Limit is 24 KiB for single contract
<table>
    <thead>
      <tr>
        <th>Contract</th>
        <th>Size</th>
      </tr>
    </thead>
    <tbody>
        <tr>
            <td>ETHGateway</td>
            <td><code>3.13 KiB</code></td>
        </tr>
        <tr>
            <td>JCompound</td>
            <td><code>21.39 KiB</code></td>
        </tr>
        <tr>
            <td>JCompoundStorage</td>
            <td><code>1.65 KiB</code></td>
        </tr>
        <tr>
            <td>JTrancheAToken</td>
            <td><code>7.71 KiB</code></td>
        </tr>
        <tr>
            <td>JTrancheBToken</td>
            <td><code>7.71 KiB</code></td>
        </tr>
        <tr>
            <td>JTranchesDeployer</td>
            <td><code>18.62 KiB</code></td>
        </tr>
    </tbody>
  </table>
