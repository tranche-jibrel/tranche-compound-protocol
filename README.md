## compoundProtocol usage

a) deploy JCompound contract and initialize it (address _priceOracle, address _feesCollector, address _tranchesDepl)

b) call setCEtherContract(address payable _cEtherContract) (cETH address) and setCTokenContract(address _erc20Contract, address _cErc20Contract), i.e. DAI and cDAI address, or 0x0(ethers) and cETH address, and so on

c) set jCompound address in jTranchesDeployer contract

c) call addTrancheToProtocol(address _erc20Contract, string memory _nameA, string memory _symbolA, 
            string memory _nameB, string memory _symbolB, uint256 _fixedRpb, uint8 _cTokenDec, uint8 _underlyingDec) to set a new tranche set

Users can now call buy and redeem functions for tranche A & B tokens


## latest Kovan environment

PriceOracle: 0x603c7FaFf64321Ed9C9517640Be06FEB52D561C5 initialized (reduced size and functions)

FeesCollector: 0x041158667FdECeFF3098c329ef007f8B22836176 initialized

TranchesDeployer: 0x15cd54282F838d67938748b578a87d76279b0006 initialized

JCompound: 0xF36340ADc978D4DF2b980466a16c3849AAb6eFFA initialized

set jcompound in TranchesDeployer: ok

initialize jCompound: "0x603c7FaFf64321Ed9C9517640Be06FEB52D561C5","0x041158667FdECeFF3098c329ef007f8B22836176","0x15cd54282F838d67938748b578a87d76279b0006"

setCEtherContract on Kovan: 0x41b5844f4680a8c38fbb695b7f9cfd1f64474a72

setCTokenContract on Kovan: "0x4f96fe3b7a6cf9725f59d353f723c1bdb64ca6aa","0xf0d0eb522cfa50b716b3b1604c4f0fa6f04376ad"

add eth tranche as #0: "0x0000000000000000000000000000000000000000","eta","ETA","etb","ETB","40000000000000000","8","18"

add DAI tranche as #1: "0x4f96fe3b7a6cf9725f59d353f723c1bdb64ca6aa","dta","DTA","dtb","DTB","30000000000000000","8","18"


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
            <td>JCompound</td>
            <td><code>18.25 KiB</code></td>
        </tr>
        <tr>
            <td>JCompoundStorage</td>
            <td><code>1.55 KiB</code></td>
        </tr>
        <tr>
            <td>JTrancheAToken</td>
            <td><code>7.46 KiB</code></td>
        </tr>
        <tr>
            <td>JTrancheBToken</td>
            <td><code>7.46 KiB</code></td>
        </tr>
        <tr>
            <td>JTranchesDeployer</td>
            <td><code>18.08 KiB</code></td>
        </tr>
		<tr>
            <td>TransferETHHelper</td>
            <td><code>0.08 KiB</code></td>
        </tr>
    </tbody>
  </table>
