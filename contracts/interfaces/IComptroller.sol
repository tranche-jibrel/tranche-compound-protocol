// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

interface IComptroller {
    function markets(address) external returns (bool, uint256);
    function enterMarkets(address[] calldata) external returns (uint256[] memory);
    function getAccountLiquidity(address) external view returns (uint256, uint256, uint256);
    function claimComp(address) external;
    function compAccrued(address) external view returns (uint);
}
