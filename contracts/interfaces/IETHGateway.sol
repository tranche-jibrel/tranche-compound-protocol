// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

interface IETHGateway {
  function withdrawETH(uint256 amount, address onBehalfOf, bool redeemType, uint256 _cEthBal) external;
}
