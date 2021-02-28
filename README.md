## compoundProtocol usage

a) deploy JCompound contract and initialize it (address _priceOracle, address _feesCollector, address _tranchesDepl)

b) call setCEtherContract(address payable _cEtherContract) (cETH address) and setCTokenContract(address _erc20Contract, address _cErc20Contract), i.e. DAI and cDAI address, or 0x0(ethers) and cETH address, and so on

c) set jCompound address in jTranchesDeployer contract

c) call addTrancheToProtocol(address _erc20Contract, string memory _nameA, string memory _symbolA, 
            string memory _nameB, string memory _symbolB, uint256 _fixedRpb, uint8 _cTokenDec, uint8 _underlyingDec) to set a new tranche set

Users can now call buy and redeem functions for tranche A & B tokens


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
            <td><code>17.77 KiB</code></td>
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
