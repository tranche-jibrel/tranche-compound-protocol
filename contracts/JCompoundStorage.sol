// SPDX-License-Identifier: MIT
/**
 * Created on 2021-01-16
 * @summary: Jibrel Protocol Storage
 * @author: Jibrel Team
 */
pragma solidity 0.6.12;

import "@openzeppelin/contracts-ethereum-package/contracts/access/Ownable.sol";
import "./ICEth.sol";

contract JCompoundStorage is OwnableUpgradeSafe {
/* WARNING: NEVER RE-ORDER VARIABLES! Always double-check that new variables are added APPEND-ONLY. Re-ordering variables can permanently BREAK the deployed proxy contract.*/
    uint256 public constant totalBlockYears = 2372500;

    struct TrancheAddresses {
        address buyerCoinAddress;       // ETH or DAI
        address dividendCoinAddress;    // cETH or cDAI
        address ATrancheAddress;
        address BTrancheAddress;
    }

    struct TrancheParameters {
        uint256 trancheAFixedRPB;
        uint256 genesisBlock;
        uint16 redemptionPercentage;    // percentage with 2 decimals (divided by 10000, i.e. 95% is 9500)
        uint8 cTokenDecimals;
        uint8 underlyingDecimals;
    }

    address public priceOracleAddress;
    address public feesCollectorAddress;
    address public tranchesDeployerAddress;

    uint256 public trancheCounter;

    address payable public cEtherContract;

    bool public fLock;

    mapping(address => address) public cTokenContracts;
    mapping(uint256 => TrancheAddresses) public trancheAddresses;
    mapping(uint256 => TrancheParameters) public trancheParameters;

    ICEth public cEthToken;
}