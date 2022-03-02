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

### Code Coverage

```bash
truffle run coverage
```

or to test a single file:

```bash
truffle run coverage --network development --file="test/JCTruffle.test.js"    
```

[(Back to top)](#Compound-Tranche-Protocol)

## Multirewards

forked from: https://github.com/curvefi/multi-rewards

[(Back to top)](#Compound-Tranche-Protocol)

### Test Coverage

<table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Test %</th>
        <th>Notes</th>
      </tr>
    </thead>
    <tbody>
        <tr>
            <td>ETHGateway</td>
            <td><code>77.27%</code></td>
            <td>---</td>
        </tr>
        <tr>
            <td>JAdminTools</td>
            <td><code>57.89%</code></td>
            <td>---</td>
        </tr>
        <tr>
            <td>JCompound</td>
            <td><code>76,63%</code></td>
            <td>---</td>
        </tr>
        <tr>
            <td>JFeesCollector</td>
            <td><code>6.25%</code></td>
            <td>---</td>
        </tr>
        <tr>
            <td>JTrancheTokensDeployer</td>
            <td><code>100%</code></td>
            <td>---</td>
        </tr>
        <tr>
            <td>JTrancheTokens</td>
            <td><code>100%</code></td>
            <td>---</td>
        </tr>
    </tbody>
  </table>

[(Back to top)](#BenQi-Tranche-Protocol)

## Main contracts - Name, Size and Description

<table>
    <thead>
      <tr>
        <th>Name</th>
        <th>Size (KiB)</th>
        <th>Description</th>
      </tr>
    </thead>
    <tbody>
        <tr>
            <td>ETHGateway</td>
            <td><code>3.08</code></td>
            <td>Ethereum gateway, useful when dealing with ethers</td>
        </tr>
        <tr>
            <td>JAdminTools</td>
            <td><code>2.16</code></td>
            <td>Contract for administrative roles control (implementation), allowing the identification of addresses when dealing with reserved methods.</td>
        </tr>
        <tr>
            <td>JAdminToolsStorage</td>
            <td><code>0.72</code></td>
            <td>Contract for administrative roles control (storage)</td>
        </tr>
        <tr>
            <td>JCompound</td>
            <td><code>17,99</code></td>
            <td>Core contract protocol (implementation). It is responsible to make all actions to give the exact amount of tranche token to users, connecting with Compound to have interest rates and other informations to give tokens the price they should have block by block. It claims extra token from Compound, sending them to Fees collector contract, that changes all fees and extra tokens into new interests for token holders. It also opens new tranches, and, via Tranche Deployer contract, it deploys new tranche tokens.</td>
        </tr>
        <tr>
            <td>JCompoundStorageV2</td>
            <td><code>1.94</code></td>
            <td>Core contract protocol V2 (storage)</td>
        </tr>
        <tr>
            <td>JFeesCollector</td>
            <td><code>8.69</code></td>
            <td>Fees collector and uniswap swapper (implementation), it changes all fees and extra tokens into new interests for token holders, sending back extra mount to Compound protocol contract</td>
        </tr>
        <tr>
            <td>JFeesCollectorStorage</td>
            <td><code>0.82</code></td>
            <td>Fees collector and uniswap swapper (storage)</td>
        </tr>
        <tr>
            <td>JTrancheAToken</td>
            <td><code>5.63</code></td>
            <td>Tranche A token (implementation), with a non decreasing price, making possible for holders to have a fixed interest percentage.</td>
        </tr>
        <tr>
            <td>JTrancheBToken</td>
            <td><code>5.63</code></td>
            <td>Tranche B token (implementation), with a floating price, making possible for holders to have a variable interest percentage.</td>
        </tr>
        <tr>
            <td>JTranchesDeployer</td>
            <td><code>15.46</code></td>
            <td>Tranche A & B token deployer (implementation): this contract deploys tranche tokens everytime a new tranche is opened by the core protocol contract</td>
        </tr>
        <tr>
            <td>JTranchesDeployerStorage</td>
            <td><code>0.17</code></td>
            <td>Tranche A & B token deployer (storage)</td>
        </tr>
        <tr>
            <td>MigrateOldTokens</td>
            <td><code>2.24</code></td>
            <td>Token migration, v1 to v2</td>
        </tr>
    </tbody>
</table>

[(Back to top)](#Compound-Tranche-Protocol)
