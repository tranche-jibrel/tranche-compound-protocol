// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

interface ICEth {
    function mint() external payable;
    function exchangeRateCurrent() external returns (uint256);
    function supplyRatePerBlock() external view returns (uint256);
    function redeem(uint) external returns (uint);
    function redeemUnderlying(uint) external returns (uint);
    function exchangeRateStored() external view returns (uint);
    function setExchangeRateStored(uint256 rate) external;
    function borrow(uint256) external returns (uint256);
    function repayBorrow() external payable;
    function borrowBalanceCurrent(address) external returns (uint256);
    function borrowRatePerBlock() external view returns (uint256);
}