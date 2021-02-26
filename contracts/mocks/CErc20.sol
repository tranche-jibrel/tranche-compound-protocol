// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol";
//import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/access/Ownable.sol";

contract CErc20 is OwnableUpgradeSafe, ERC20UpgradeSafe {
    using SafeMath for uint256;

    //uint256 internal exchangeRate;
    uint256 internal exchangeRateStoredVal;
    //uint256 public supplyRate;
    uint256 public redeemPercentage;

    address public allowedToken;
    IERC20 public token;

    function initialize() public initializer {
        OwnableUpgradeSafe.__Ownable_init();
        ERC20UpgradeSafe.__ERC20_init_unchained("cToken", "cToken");
        //_setupDecimals(8);
        exchangeRateStoredVal = 21116902930684312;
        //supplyRate = 30368789660;
        super._mint(msg.sender, uint(1000).mul(10 ** 8));
    }

    function mint(uint256 amount) external returns (uint256){
        token.transferFrom(msg.sender, address(this), amount);
        mintFresh(msg.sender, amount);
        //super._mint(msg.sender, amount);
        return amount;
    }

    function setToken(address _token) external {
        allowedToken = _token;
        token = IERC20(allowedToken);
    }

    function getAllowedToken() external view returns (address) {
        return allowedToken;
    }
/*
    function setSupplyRatePerBlock(uint256 rate) external {
        supplyRate = rate;
    }

    function supplyRatePerBlock() external view returns (uint256) {
        return supplyRate;
    }

    function setRedeemPercentage(uint256 _redeemPercentage) external {
        redeemPercentage = _redeemPercentage;
    }
*/
    function redeem(uint redeemAmount) external returns (uint) {
        uint256 amount = redeemAmount.mul(exchangeRateStoredVal).div(10**18);

        token.transfer(msg.sender, amount);

        return amount;
    }

    function redeemUnderlying(uint redeemAmount) external returns (uint) {
        redeemFresh(msg.sender, 0, redeemAmount);
        return 0;
    }

    function setExchangeRateStored(uint256 rate) external {
        exchangeRateStoredVal = rate;
    }

    function exchangeRateStored() public view returns (uint) {
        return exchangeRateStoredVal;
    }

    /**
     * @notice User supplies assets into the market and receives cTokens in exchange
     * @dev Assumes interest has already been accrued up to the current block
     * @param minter The address of the account which is supplying the assets
     * @param mintAmount The amount of the underlying asset to supply
     */
    function mintFresh(address minter, uint mintAmount) internal {
        uint256 exchangeRateMantissa = exchangeRateStored();
        /*
         * We get the current exchange rate and calculate the number of cTokens to be minted:
         *  mintTokens = actualMintAmount / exchangeRate
         */
        uint256 mintTokens = mintAmount.mul(10**18).div(exchangeRateMantissa);

        super._mint(minter, mintTokens);
    }

    /**
     * @dev Similar to EIP20 transfer, except it handles a False success from `transfer` and returns an explanatory
     *      error code rather than reverting. If caller has not called checked protocol's balance, this may revert due to
     *      insufficient cash held in this contract. If caller has checked protocol's balance prior to this call, and verified
     *      it is >= amount, this should not revert in normal conditions.
     *
     *      Note: This wrapper safely handles non-standard ERC-20 tokens that do not return a value.
     *            See here: https://medium.com/coinmonks/missing-return-value-bug-at-least-130-tokens-affected-d67bf08521ca
     */
    function doTransferOut(address to, uint amount) internal {
        token.transfer(to, amount);
    }

    /**
     * @notice User redeems cTokens in exchange for the underlying asset
     * @dev Assumes interest has already been accrued up to the current block
     * @param redeemer The address of the account which is redeeming the tokens
     * @param redeemTokensIn The number of cTokens to redeem into underlying (only one of redeemTokensIn or redeemAmountIn may be non-zero)
     * @param redeemAmountIn The number of underlying tokens to receive from redeeming cTokens (only one of redeemTokensIn or redeemAmountIn may be non-zero)
     */
    function redeemFresh(address payable redeemer, uint redeemTokensIn, uint redeemAmountIn) internal {
        require(redeemTokensIn == 0 || redeemAmountIn == 0, "one of redeemTokensIn or redeemAmountIn must be zero");

        uint256 redeemAmount;
        uint256 redeemTokens;
        /* exchangeRate = invoke Exchange Rate Stored() */
        uint256 exchangeRateMantissa = exchangeRateStored();

        /* If redeemTokensIn > 0: */
        if (redeemTokensIn > 0) {
            /*
             * We calculate the exchange rate and the amount of underlying to be redeemed:
             *  redeemTokens = redeemTokensIn
             *  redeemAmount = redeemTokensIn x exchangeRateCurrent
             */
            redeemTokens = redeemTokensIn;
            redeemAmount = exchangeRateMantissa.mul(redeemTokensIn).div(10**28);
        } else {
            /*
             * We get the current exchange rate and calculate the amount to be redeemed:
             *  redeemTokens = redeemAmountIn / exchangeRate
             *  redeemAmount = redeemAmountIn
             */
            redeemTokens = redeemAmountIn.mul(10**18).div(exchangeRateMantissa);
            redeemAmount = redeemAmountIn;
        }

        //token.transferFrom(msg.sender, address(this), redeemTokens);
        /*
         * We calculate the new total supply and redeemer balance, checking for underflow:
         *  totalSupplyNew = totalSupply - redeemTokens
         *  accountTokensNew = accountTokens[redeemer] - redeemTokens
         */
        super._burn(redeemer, redeemTokens);

        /*
         * We invoke doTransferOut for the redeemer and the redeemAmount.
         *  Note: The cToken must handle variations between ERC-20 and ETH underlying.
         *  On success, the cToken has redeemAmount less of cash.
         *  doTransferOut reverts if anything goes wrong, since we can't be sure if side effects occurred.
         */
        doTransferOut(redeemer, redeemAmount);
    }
}