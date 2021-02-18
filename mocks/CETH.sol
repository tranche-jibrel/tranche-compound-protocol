// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol";
import "../../TransferETHHelper.sol";


contract CETH is ERC20 {
    uint256 internal exchangeRate;
    uint256 internal exchangeRateStored;
    uint256 internal supplyRate;
    uint256 public redeemPercentage;

    constructor(string memory name_, string memory symbol_, uint256 _initialSupply) public ERC20(name_, symbol_) {
        _mint(msg.sender, _initialSupply * (10 ** 18));
    }

    function mint() external payable {
        _mint(msg.sender, msg.value);
    }

    fallback() external payable {}

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

        TransferETHHelper.safeTransferETH(msg.sender, amount);

        return amount;
    }

    function redeemUnderlying(uint redeemAmount) external returns (uint) {
        TransferETHHelper.safeTransferETH(msg.sender, redeemAmount);

        return redeemAmount;
    }

    function setExchangeRateStored(uint256 rate) external {
        exchangeRateStored = rate;
    }

    function exchangeRateStored() external view returns (uint) {
        return exchangeRateStored;
    }
}
