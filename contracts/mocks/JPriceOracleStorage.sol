// SPDX-License-Identifier: MIT
/**
 * Created on 2020-12-10
 * @summary: Price Oracle storage
 * @author: Jibrel Team
 */
pragma solidity 0.6.12;

import "@openzeppelin/contracts-ethereum-package/contracts/access/Ownable.sol";

contract JPriceOracleStorage is OwnableUpgradeSafe {
/* WARNING: NEVER RE-ORDER VARIABLES! Always double-check that new variables are added APPEND-ONLY. Re-ordering variables can permanently BREAK the deployed proxy contract.*/
    uint256 public constant fixed_1 = 1000000000000000000000000;
    
    uint256 public pairCounter;
    uint256 public contractVersion;
    uint256 public adminCounter;

    struct Pair {
        string basePairName;        // base pair name (collateral)
        string quotePairName;       // quote pair name (stable coin)
        uint256 pairValue;          // pairprice
        address baseAddress;        // base token address (ETH = 0x0)
        address quoteAddress;       // quote token address
        address externalProviderAddress;   // external provider address
        uint8 pairDecimals;         // pair decimals
        uint8 baseDecimals;         // base token decimals (normally 18)
        uint8 quoteDecimals;        // quote token decimals (normally 18)
        uint8 priceOrigin;          // 1: manual, 2: Chainlink, 3: UniswapV2, 4: UniswapTWAP, 5: OrFeed
        bool reciprocalPrice;       // reciprocal price if needed
        bytes32 orFeedVenue;        // string for OrFeed oracle
    }

    mapping(uint256 => Pair) public pairs;
    // mapping for Price Oracle administrators
    mapping (address => bool) public _Admins;
}