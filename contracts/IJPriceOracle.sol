// SPDX-License-Identifier: MIT
/**
 * Created on 2020-11-09
 * @summary: JPriceOracle Interface
 * @author: Jibrel Team
 */
pragma solidity 0.6.12;

interface IJPriceOracle {
    function isAdmin(address account) external view returns (bool);
    function addAdmin(address account) external;
    function removeAdmin(address account) external;
    function renounceAdmin() external;
    function setNewPair(string calldata _basePairName, 
            string calldata _quotePairName, 
            uint256 _price, 
            address _baseAddress, 
            address _quoteAddress,
            address _extProvAddress, 
            uint8 _pairDecimals,
            uint8 _baseDecimals,
            uint8 _quoteDecimals, 
            uint8 _priceOrigin,
            bool _reciprPrice,
            bytes32 _orFeedVenue) external;
    function setUniswapRouterAddress(address _uniswapRouter) external;
    function setOrFeedAddress(address _orFeed) external;
    function setPairValue(uint256 _pairId, uint256 _price, uint8 _pairDecimals) external;
    function setBaseQuoteDecimals(uint256 _pairId, uint8 _baseDecimals, uint8 _quoteDecimals) external;
    function setExternalProviderParameters(uint256 _pairId, address _extProvAddress, uint8 _priceOrigin, bool _reciprPrice) external;
    function getPairCounter() external view returns (uint256);
    function getPairValue(uint256 _pairId) external view returns (uint256);
    function getPairName(uint256 _pairId) external view returns (string memory, string memory);
    function getPairDecimals(uint256 _pairId) external view returns (uint8);
    function getPairBaseDecimals(uint256 _pairId) external view returns (uint8);
    function getPairQuoteDecimals(uint256 _pairId) external view returns (uint8);
    function getPairBaseAddress(uint256 _pairId) external view returns (address);
    function getPairQuoteAddress(uint256 _pairId) external view returns (address);

    event AdminAdded(address account);
    event AdminRemoved(address account);
    event NewPair(uint256 indexed _pairId, string indexed basePairName, string indexed quotePairName, uint256 blockNumber);
    event NewPrice(uint256 indexed pairId, string indexed basePairName, string indexed quotePairName, uint256 pairValue, uint8 pairDecimals, uint256 blockNumber);
    event UniswapRouterAddressUpdated(address newAddress);
    event OrFeedAddressUpdated(address newAddress);
    event NewPairBaseQuoteDecimals(uint256 indexed pairId, string indexed basePairName, string indexed quotePairName, uint8 baseDecimals, uint8 quoteDecimals, uint256 blockNumber);
    event NewPairAddresses(uint256 indexed pairId, string indexed basePairName, string indexed quotePairName, address baseAddress , address quoteAddress, uint256 blockNumber);
    event NewExternalProviderParameters(uint256 indexed pairId, string indexed basePairName, string indexed quotePairName, address extrnalAddress, uint8 priceOrigin, bool reciprocalPrice, uint256 blockNumber);
}