// SPDX-License-Identifier: MIT
/**
 * Created on 2020-11-09
 * @summary: Jibrel Price Oracle
 * @author: Jibrel Team
 */
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/access/Ownable.sol";
import "@chainlink/contracts/src/v0.6/interfaces/AggregatorV3Interface.sol";
import "./IJPriceOracle.sol";
import "./JPriceOracleStorage.sol";
import "./uniswap/ITWAPOracle.sol";

contract JPriceOracle is OwnableUpgradeSafe, JPriceOracleStorage, IJPriceOracle { 
    using SafeMath for uint256;

    /**
    * @dev contract initializer
    * @param _uniswapRouter uinswap router contract address
    * @param _orFeed orFeed contract address
    */
    function initialize(address _uniswapRouter, address _orFeed) external initializer() {
        OwnableUpgradeSafe.__Ownable_init();
        _addAdmin(msg.sender);
        uniV2Router02 = IUniswapV2Router02(_uniswapRouter);
        orfeed = OrFeedInterface(_orFeed);
        contractVersion = 1;
    }

    /**
    * @dev admins modifiers
    */
    modifier onlyAdmins() {
        require(isAdmin(msg.sender), "!Admin");
        _;
    }

    /*   Admins Roles Mngmt  */
    /**
     * @dev add an address as an admin
     * @param account address to check
     */
    function _addAdmin(address account) internal {
        adminCounter = adminCounter.add(1);
        _Admins[account] = true;
        emit AdminAdded(account);
    }

    /**
     * @dev remove an address from admin
     * @param account address to remove
     */
    function _removeAdmin(address account) internal {
        require(adminCounter > 1, "Cannot remove last admin");
        adminCounter = adminCounter.sub(1);
        _Admins[account] = false;
        emit AdminRemoved(account);
    }

    /**
     * @dev check if an address is an admin
     * @param account address to check
     * @return true or false 
     */
    function isAdmin(address account) public override view returns (bool) {
        return _Admins[account];
    }

    /**
     * @dev add an address as an admin
     * @param account address to add
     */
    function addAdmin(address account) external override onlyAdmins {
        require(account != address(0), "Not a valid address!");
        require(!isAdmin(account), " Address already Administrator");
        _addAdmin(account);
    }

    /**
     * @dev remove an address from admin
     * @param account address to remove
     */
    function removeAdmin(address account) external override onlyAdmins {
        _removeAdmin(account);
    }

    /**
     * @dev an address renounce to be an admin
     */
    function renounceAdmin() external override onlyAdmins {
        _removeAdmin(msg.sender);
    }

    /**
    * @dev update contract version
    * @param _ver new version
    */
    function updateVersion(uint256 _ver) external onlyAdmins {
        require(_ver > contractVersion, "!NewVersion");
        contractVersion = _ver;
    }


    /**
    * @dev set Uniswap Router contract Address
    * @param _uniswapRouter uniswap router address
    */
    function setUniswapRouterAddress(address _uniswapRouter) external override onlyOwner {
        require(_uniswapRouter != address(0), "JPriceOracle: Zero address entered");
        uniV2Router02 = IUniswapV2Router02(_uniswapRouter);
        emit UniswapRouterAddressUpdated(_uniswapRouter);
    }

    /**
    * @dev set orFeed contract Address
    * @param _orFeed orFeed address
    */
    function setOrFeedAddress(address _orFeed) external override onlyOwner {
        require(_orFeed != address(0), "JPriceOracle: Zero address entered");
        orfeed = OrFeedInterface(_orFeed);
        emit OrFeedAddressUpdated(_orFeed);
    }

    /**
    * @dev get Uniswap Price
    * @param _pairId pair id
    * @param _amountIn amount in: 10 ** (pairs decimals)
    * @return price
    */
    // Mainnet
    // Uniswap Router V2: 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D
    // WETH: 0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2
    // DAI: 0x6B175474E89094C44Da98b954EedeAC495271d0F
	function getUniswapPrice(uint256 _pairId, uint256 _amountIn) public view returns (uint) {
        address[] memory path = new address[](2);
        path[0] = pairs[_pairId].baseAddress;
        path[1] = pairs[_pairId].quoteAddress;
        uint[] memory amounts;
		amounts = uniV2Router02.getAmountsOut(_amountIn, path);
        uint256 retLen = amounts.length;
        uint256 usV2Price = amounts[retLen-1];
        return usV2Price;
	}

    /**
    * @dev get orFeed Price
    * @param _pairId pair id
    * @param _venue string for orFeed source
    * @param _amount amount: 10 ** (pairs decimals)
    * @return price
    */
    // Mainnet
    // OrFeed contract: 0x8316b082621cfedab95bf4a44a1d4b64a6ffc336
	function getOrFeedPrice(uint256 _pairId, string memory _venue, uint256 _amount) public view returns (uint) {
		uint256 orFeedPrice = orfeed.getExchangeRate(pairs[_pairId].basePairName, pairs[_pairId].quotePairName, _venue, _amount);
        return orFeedPrice;
	}


    /**
    * @dev get Uniswap Time Weighted Average Price
    * @param _pairId pair id
    * @param _amountIn amount In: 10 ** (pairs decimals)
    * @return price
    */
    function getUniswapTimeWeightedAveragePrice(uint256 _pairId, uint256 _amountIn) public view returns (uint256 price) {
        price = ITWAPOracle(pairs[_pairId].externalProviderAddress).consult(pairs[_pairId].baseAddress, _amountIn);
	}

    /**
     * @dev get latest info on single pair from chainlink
     * @param _pairId pair id
     * @return string as pair description, int as pair price, uint8 as pair decimals
     */
    function getLatestChainlinkPairInfo(uint256 _pairId) external view returns (string memory, uint256, uint8) {
        uint256 clPrice = getChainlinkPrice(_pairId);
        uint8 clDecimals = getChainlinkDecimals(_pairId);
        string memory clDescr = getChainlinkDescription(_pairId);
        return (clDescr, clPrice, clDecimals);
    }

    /**
     * @dev get latest decimals of a single pair from chainlink
     * @param _pairId pair id
     * @return uint8 as pair decimals
     */
    function getChainlinkDecimals(uint256 _pairId) public view returns (uint8) {
        return AggregatorV3Interface(pairs[_pairId].externalProviderAddress).decimals();
    }

    /**
     * @dev get latest description of a single pair from chainlink
     * @param _pairId pair id
     * @return string as pair description
     */
    function getChainlinkDescription(uint256 _pairId) public view returns (string memory) {
        return AggregatorV3Interface(pairs[_pairId].externalProviderAddress).description();
    }

    /**
     * @dev get latest price of a single pair from chainlink
     * @param _pairId pair id
     * @return int as pair price
     */
    function getChainlinkPrice(uint256 _pairId) public view returns (uint256) {
        require(_pairId < pairCounter, "pair does not exists");
        require(pairs[_pairId].priceOrigin == 2, "Not a chainlink pair!");
        (uint80 roundID, 
            int price,
            uint256 startedAt,
            uint256 timeStamp,
            uint80 answeredInRound) = AggregatorV3Interface(pairs[_pairId].externalProviderAddress).latestRoundData();
        uint256 clPrice = uint256(price);
        if (pairs[_pairId].reciprocalPrice) {
            clPrice = reciprocal(uint256(price));
        }
        return clPrice;
    }

    /**
    * @dev bytes32 To String
    * @param _bytes32 bytes32 to convert
    * @return string converted
    */
    function bytes32ToString(bytes32 _bytes32) public pure returns (string memory) {
        uint8 i = 0;
        while(i < 32 && _bytes32[i] != 0) {
            i++;
        }
        bytes memory bytesArray = new bytes(i);
        for (i = 0; i < 32 && _bytes32[i] != 0; i++) {
            bytesArray[i] = _bytes32[i];
        }
        return string(bytesArray);
    }

    /**
     * @notice 1/x
     * @dev 
     * Test reciprocal(0) fails
     * Test reciprocal(fixed1()) returns fixed1()
     * Test reciprocal(fixed1()*fixed1()) returns 1 // Testing how the fractional is truncated
     * Test reciprocal(2*fixed1()*fixed1()) returns 0 // Testing how the fractional is truncated
     */
    function reciprocal(uint256 x) public pure returns (uint256) {
        require(x != 0, "PriceOracle: x = 0");
        return fixed_1.mul(fixed_1).div(x); // Can't overflow
    }

    /**
    * @dev set a new pair
    * @param _basePairName string describing the base name of the pair (i.e. ETH)
    * @param _quotePairName string describing the base name of the pair (i.e. DAI)
    * @param _price price of the pair
    * @param _baseAddress base address token
    * @param _quoteAddress quote address token
    * @param _extProvAddress chainlink address of the pair
    * @param _pairDecimals number of decimals for pair
    * @param _baseDecimals base decimals token
    * @param _quoteDecimals quote decimals token
    * @param _reciprPrice calculate reciprocal price
    * @param _orFeedVenue string for OrFeed oracle
    */
    function setNewPair(string memory _basePairName, 
            string memory _quotePairName, 
            uint256 _price, 
            address _baseAddress, 
            address _quoteAddress,
            address _extProvAddress, 
            uint8 _pairDecimals,
            uint8 _baseDecimals,
            uint8 _quoteDecimals, 
            uint8 _priceOrigin,
            bool _reciprPrice,
            bytes32 _orFeedVenue) external override onlyAdmins {
        pairs[pairCounter] = Pair({basePairName: _basePairName, quotePairName: _quotePairName, pairValue: _price, pairDecimals: _pairDecimals, baseAddress: _baseAddress,
                baseDecimals: _baseDecimals, quoteAddress: _quoteAddress, quoteDecimals: _quoteDecimals, externalProviderAddress: _extProvAddress, 
                priceOrigin: _priceOrigin, reciprocalPrice: _reciprPrice, orFeedVenue: _orFeedVenue});
        emit NewPair(pairCounter, _basePairName, _quotePairName, block.number);
        pairCounter = pairCounter.add(1);
    }

    /**
    * @dev set a price for the specified pair
    * @param _pairId number of the pair
    * @param _price price of the pair
    * @param _pairDecimals number of decimals for pair
    */
    function setPairValue(uint256 _pairId, uint256 _price, uint8 _pairDecimals) external override onlyAdmins {
        require(_pairId < pairCounter, "pair does not exists");
        if (pairs[_pairId].priceOrigin == 1) {
            pairs[_pairId].pairValue = _price;
            pairs[_pairId].pairDecimals = _pairDecimals;
        }
        emit NewPrice(_pairId, pairs[_pairId].basePairName, pairs[_pairId].quotePairName, pairs[_pairId].pairValue, pairs[_pairId].pairDecimals, block.number);
    }

    /**
    * @dev set a base and quote decimals for the specified pair
    * @param _pairId number of the pair
    * @param _baseDecimals base decimals of the pair
    * @param _quoteDecimals quote decimals for pair
    */
    function setBaseQuoteDecimals(uint256 _pairId, uint8 _baseDecimals, uint8 _quoteDecimals) external override onlyAdmins {
        require(_pairId < pairCounter, "BaseQuoteDecimals: pair does not exists");
        pairs[_pairId].baseDecimals = _baseDecimals;
        pairs[_pairId].quoteDecimals = _quoteDecimals;
        emit NewPairBaseQuoteDecimals(_pairId, pairs[_pairId].basePairName, pairs[_pairId].quotePairName, pairs[_pairId].baseDecimals, pairs[_pairId].quoteDecimals, block.number);
    }

    /**
    * @dev set a chainlink parameters for the specified pair
    * @param _pairId number of the pair
    * @param _extProvAddress chainlink address of the pair
    * @param _reciprPrice reciprocal price or not for the pair
    */
    function setExternalProviderParameters(uint256 _pairId, address _extProvAddress, uint8 _priceOrigin, bool _reciprPrice) external override onlyAdmins {
        require(_pairId < pairCounter, "Pair does not exists");
        require(_priceOrigin < 6, "Price origin not allowed");
        pairs[_pairId].priceOrigin = _priceOrigin;
        pairs[_pairId].externalProviderAddress = _extProvAddress;
        pairs[_pairId].reciprocalPrice = _reciprPrice;
        emit NewExternalProviderParameters(_pairId, pairs[_pairId].basePairName, pairs[_pairId].quotePairName, pairs[_pairId].externalProviderAddress, pairs[_pairId].priceOrigin, pairs[_pairId].reciprocalPrice, block.number);
    }

    /**
    * @dev get pair counter
    * @return pairs counter
    */
    function getPairCounter() external override view returns (uint256) {
        return pairCounter;
    }

    /**
    * @dev get a pair price
    * @param _pairId number of the pair
    * @return price of the pair
    */
    function getPairValue(uint256 _pairId) public override view returns (uint256) {
        require(_pairId < pairCounter, "PairValue: pair does not exists");
        if (pairs[_pairId].priceOrigin == 1) {
            return pairs[_pairId].pairValue;
        } else if (pairs[_pairId].priceOrigin == 2) {
            return uint256(getChainlinkPrice(_pairId));
        } else if (pairs[_pairId].priceOrigin == 3) {
            return uint256(getUniswapPrice(_pairId, (10 ** uint256(pairs[_pairId].pairDecimals))));
        } else if (pairs[_pairId].priceOrigin == 4) {
            return getUniswapTimeWeightedAveragePrice(_pairId, (10 ** uint256(pairs[_pairId].pairDecimals)));
        } else if (pairs[_pairId].priceOrigin == 5) {
            string memory venue = bytes32ToString(pairs[_pairId].orFeedVenue);
            return uint256(getOrFeedPrice(_pairId, venue, (10 ** uint256(pairs[_pairId].pairDecimals))));
        }
    }

    /**
    * @dev get a pair name
    * @param _pairId number of the pair
    * @return name of the pair
    */
    function getPairName(uint256 _pairId) external override view returns (string memory, string memory) {
        require(_pairId < pairCounter, "PairName: pair does not exists");
        return (pairs[_pairId].basePairName, pairs[_pairId].quotePairName);
    }

    /**
    * @dev get a pair decimals
    * @param _pairId number of the pair
    * @return decimals of the pair
    */
    function getPairDecimals(uint256 _pairId) public override view returns (uint8) {
        require(_pairId < pairCounter, "PairDecimals: pair does not exists");
        if (pairs[_pairId].priceOrigin == 2) {
            uint8 clDecimals = getChainlinkDecimals(_pairId);
            if (pairs[_pairId].reciprocalPrice) {
                return (48 - clDecimals); // Number of decimals in (fixed_1() * fixed_1()) is 48
            } else {
                return clDecimals;
            }
        } else {
            return pairs[_pairId].pairDecimals;
        }
    }

    /**
    * @dev get a pair base decimals
    * @param _pairId number of the pair
    * @return number of base currency decimals
    */
    function getPairBaseDecimals(uint256 _pairId) external override view returns (uint8) {
        require(_pairId < pairCounter, "PairBaseDecimals: pair does not exists");
        return pairs[_pairId].baseDecimals;
    }

    /**
    * @dev get a pair quote decimals
    * @param _pairId number of the pair
    * @return number of quote currency decimals
    */
    function getPairQuoteDecimals(uint256 _pairId) external override view returns (uint8) {
        require(_pairId < pairCounter, "PairQuoteDecimals: pair does not exists");
        return pairs[_pairId].quoteDecimals;
    }

    /**
    * @dev get a pair base address
    * @param _pairId number of the pair
    * @return address of base currency decimals
    */
    function getPairBaseAddress(uint256 _pairId) external override view returns (address) {
        require(_pairId < pairCounter, "PairBaseAddress: pair does not exists");
        return pairs[_pairId].baseAddress;
    }

    /**
    * @dev get a pair quote address
    * @param _pairId number of the pair
    * @return address of quote currency decimals
    */
    function getPairQuoteAddress(uint256 _pairId) external override view returns (address) {
        require(_pairId < pairCounter, "PairQuoteAddress: pair does not exists");
        return pairs[_pairId].quoteAddress;
    }

    function getPairDetails(uint256 _pairId) external view returns(string memory basePairName,
            string memory quotePairName,
            uint256 pairValue,
            address baseAddress,
            address quoteAddress,
            address externalProviderAddress,
            uint8 pairDecimals,
            uint8 baseDecimals,
            uint8 quoteDecimals,
            uint8 priceOrigin,
            bool reciprocalPrice,
            bytes32 orFeedVenue)  {
        basePairName = pairs[_pairId].basePairName;
        quotePairName = pairs[_pairId].quotePairName;
        pairValue = getPairValue(_pairId);
        baseAddress = pairs[_pairId].baseAddress;
        quoteAddress = pairs[_pairId].quoteAddress;
        externalProviderAddress = pairs[_pairId].externalProviderAddress;
        pairDecimals = getPairDecimals(_pairId);
        baseDecimals = pairs[_pairId].baseDecimals;
        quoteDecimals = pairs[_pairId].quoteDecimals;
        priceOrigin = pairs[_pairId].priceOrigin;
        reciprocalPrice = pairs[_pairId].reciprocalPrice;
        orFeedVenue = pairs[_pairId].orFeedVenue;
    }
}

