// SPDX-License-Identifier: MIT
/**
 * Created on 2021-08-27
 * @summary: Jibrel Compound Tranche Protocol Helper
 * @author: Jibrel Team
 */
pragma solidity 0.8.10;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
// import "@openzeppelin/contracts-upgradeable/token/ERC20/SafeERC20Upgradeable.sol";
import "./interfaces/ICErc20.sol";
import "./interfaces/IJCompoundHelper.sol";


contract JCompoundHelper is OwnableUpgradeable, IJCompoundHelper {
    using SafeMathUpgradeable for uint256;

    // address public jCompoundAddress;

    function initialize (/*address _jCompAddr*/) public initializer {
        OwnableUpgradeable.__Ownable_init();
        // jCompoundAddress = _jCompAddr;
    }
/*
    /**
     * @dev modifiers
     */
/*    modifier onlyJCompound() {
        require(msg.sender == jCompoundAddress, "!JCompound");
        _;
    }

    /**
     * @dev send an amount of tokens to corresponding compound contract (it takes tokens from this contract). Only allowed token should be sent
     * @param _underToken underlying token contract address
     * @param _cToken ctoken contract address
     * @param _numTokensToSupply token amount to be sent
     * @return mint result
     */
/*    function sendErc20ToCompoundHelper(address _underToken, 
            address _cToken, 
            uint256 _numTokensToSupply) public override onlyJCompound returns(uint256) {
        require(_cToken != address(0), "!Accept");
        // i.e. DAI contract, on Kovan: 0x4f96fe3b7a6cf9725f59d353f723c1bdb64ca6aa
        IERC20Upgradeable underlying = IERC20Upgradeable(_underToken);

        // i.e. cDAI contract, on Kovan: 0xf0d0eb522cfa50b716b3b1604c4f0fa6f04376ad
        ICErc20 cToken = ICErc20(_cToken);

        SafeERC20Upgradeable.safeApprove(underlying, _cToken, _numTokensToSupply);
        require(underlying.allowance(jCompoundAddress, _cToken) >= _numTokensToSupply, "!AllowCToken");

        uint256 mintResult = cToken.mint(_numTokensToSupply);
        return mintResult;
    }

    /**
     * @dev redeem an amount of cTokens to have back original tokens (tokens remains in this contract). Only allowed token should be sent
     * @param _cToken ctoken contract address
     * @param _amount cToken amount to be sent
     * @param _redeemType true or false, normally true
     */
/*    function redeemCErc20TokensHelper(address _cToken, 
            uint256 _amount, 
            bool _redeemType) public override onlyJCompound returns (uint256 redeemResult) {
        require(_cToken != address(0),  "!Accept");
        // i.e. cDAI contract, on Kovan: 0xf0d0eb522cfa50b716b3b1604c4f0fa6f04376ad
        ICErc20 cToken = ICErc20(_cToken);

        if (_redeemType) {
            // Retrieve your asset based on a cToken amount
            redeemResult = cToken.redeem(_amount);
        } else {
            // Retrieve your asset based on an amount of the asset
            redeemResult = cToken.redeemUnderlying(_amount);
        }
        return redeemResult;
    }
*/
    /**
     * @dev get cToken stored exchange rate from compound contract
     * @param _cTokenAddress cToken address
     * @return exchRateMantissa exchange rate cToken mantissa
     */
    function getCTokenExchangeRate(address _cTokenAddress) public view returns (uint256 exchRateMantissa) {
        // Amount of current exchange rate from cToken to underlying
        return exchRateMantissa = ICErc20(_cTokenAddress).exchangeRateStored(); // it returns something like 210615675702828777787378059 (cDAI contract) or 209424757650257 (cUSDT contract)
    }

    /**
     * @dev get compound mantissa
     * @param _underDecs underlying decimals
     * @param _cTokenDecs cToken decimals
     * @return mantissa tranche mantissa (from 16 to 28 decimals)
     */
    function getMantissaHelper(uint256 _underDecs, uint256 _cTokenDecs) public pure override returns (uint256 mantissa) {
        mantissa = (uint256(_underDecs)).add(18).sub(uint256(_cTokenDecs));
        return mantissa;
    }

    /**
     * @dev get compound pure price for a single tranche
     * @param _cTokenAddress cToken address
     * @return compoundPrice compound current pure price
     */
    function getCompoundPurePriceHelper(address _cTokenAddress) public view override returns (uint256 compoundPrice) {
        compoundPrice = getCTokenExchangeRate(_cTokenAddress);
        return compoundPrice;
    }

     /**
     * @dev get compound price for a single tranche scaled by 1e18
     * @param _cTokenAddress cToken address
     * @param _underDecs underlying decimals
     * @param _cTokenDecs cToken decimalsr
     * @return compNormPrice compound current normalized price
     */
    function getCompoundPriceHelper(address _cTokenAddress, uint256 _underDecs, uint256 _cTokenDecs) public view override returns (uint256 compNormPrice) {
        compNormPrice = getCompoundPurePriceHelper(_cTokenAddress);

        uint256 mantissa = getMantissaHelper(_underDecs, _cTokenDecs);
        if (mantissa < 18) {
            compNormPrice = compNormPrice.mul(10 ** (uint256(18).sub(mantissa)));
        } else {
            compNormPrice = compNormPrice.div(10 ** (mantissa.sub(uint256(18))));
        }
        return compNormPrice;
    }
}