// SPDX-License-Identifier: MIT
/**
 * Created on 2021-01-16
 * @summary: Jibrel Protocol Storage
 * @author: Jibrel Team
 */
pragma solidity 0.8.10;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./interfaces/ICEth.sol";
import "./interfaces/IETHGateway.sol";

contract JCompoundStorage is OwnableUpgradeable {
/* WARNING: NEVER RE-ORDER VARIABLES! Always double-check that new variables are added APPEND-ONLY. Re-ordering variables can permanently BREAK the deployed proxy contract.*/

    uint256 public constant PERCENT_DIVIDER = 10000;  // percentage divider for redemption

    struct TrancheAddresses {
        address buyerCoinAddress;       // ETH (ZERO_ADDRESS) or DAI
        address cTokenAddress;          // cETH or cDAI
        address ATrancheAddress;
        address BTrancheAddress;
    }

    struct TrancheParameters {
        uint256 trancheAFixedPercentage;    // fixed percentage (i.e. 4% = 0.04 * 10^18 = 40000000000000000)
        uint256 trancheALastActionBlock;
        uint256 storedTrancheAPrice;
        uint256 trancheACurrentRPB;
        uint16 redemptionPercentage;        // percentage with 2 decimals (divided by 10000, i.e. 95% is 9500)
        uint8 cTokenDecimals;
        uint8 underlyingDecimals;
    }

    address public adminToolsAddress;
    address public feesCollectorAddress;
    address public tranchesDeployerAddress;
    address public compTokenAddress;
    address public comptrollerAddress;
    address public rewardsToken;

    uint256 public tranchePairsCounter;
    uint256 public totalBlocksPerYear; 
    uint32 public redeemTimeout;

    mapping(address => address) public cTokenContracts;
    mapping(uint256 => TrancheAddresses) public trancheAddresses;
    mapping(uint256 => TrancheParameters) public trancheParameters;
    // last block number when the user buy/reddem tranche tokens
    mapping(address => uint256) public lastActivity;

    ICEth public cEthToken;
    IETHGateway public ethGateway;

    // enabling / disabling tranches for fund deposit
    mapping(uint256 => bool) public trancheDepositEnabled;
}


contract JCompoundStorageV2 is JCompoundStorage {
    struct StakingDetails {
        uint256 startTime;
        uint256 amount;
    }

    address public incentivesControllerAddress;

    // user => trancheNum => counter
    mapping (address => mapping(uint256 => uint256)) public stakeCounterTrA;
    mapping (address => mapping(uint256 => uint256)) public stakeCounterTrB;
    // user => trancheNum => stakeCounter => struct
    mapping (address => mapping (uint256 => mapping (uint256 => StakingDetails))) public stakingDetailsTrancheA;
    mapping (address => mapping (uint256 => mapping (uint256 => StakingDetails))) public stakingDetailsTrancheB;

    address public jCompoundHelperAddress;
}

contract JCompoundStorageV3 is JCompoundStorageV2 {
    mapping (address => bool) public tokenLoopEnabled;
    mapping (address => uint256) public tokenAllowedLoops;
}
