// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/access/Ownable.sol";

contract CErc20 is OwnableUpgradeSafe, ERC20UpgradeSafe {
    using SafeMath for uint256;

    uint256 internal exchangeRate;
    uint256 internal exchangeRateStoredVal;
    uint256 internal supplyRate;
    uint256 public redeemPercentage;

    IERC20 public token;

    function initialize(uint256 _initialSupply) public initializer {
        OwnableUpgradeSafe.__Ownable_init();
        ERC20UpgradeSafe.__ERC20_init_unchained("NewJNT", "NJNT");
        _mint(msg.sender, _initialSupply.mul(10 ** 18));
    }

    function mint(uint256 amount) external returns (uint256) {
        _mint(msg.sender, amount);
        return amount;
    }

    function setToken(address _token) external {
        token = IERC20(_token);
    }

    function setExchangeRateCurrent(uint256 rate) external {
        exchangeRate = rate;
    }

    function exchangeRateCurrent() external returns (uint256) {
        return exchangeRate;
    }

    function setSupplyRatePerBlock(uint256 rate) external {
        supplyRate = rate;
    }

    function supplyRatePerBlock() external returns (uint256) {
        return supplyRate;
    }

    function setRedeemPercentage(uint256 _redeemPercentage) external {
        redeemPercentage = _redeemPercentage;
    }

    function redeem(uint redeemAmount) external returns (uint) {
        uint256 amount = redeemAmount + (redeemAmount * redeemPercentage)/100;

        SafeERC20.safeTransfer(token, msg.sender, amount);

        return amount;
    }

    function redeemUnderlying(uint redeemAmount) external returns (uint) {
        SafeERC20.safeTransfer(token, msg.sender, redeemAmount);

        return redeemAmount;
    }

    function setExchangeRateStored(uint256 rate) external {
        exchangeRateStoredVal = rate;
    }

    function exchangeRateStored() external view returns (uint) {
        return exchangeRateStoredVal;
    }
}