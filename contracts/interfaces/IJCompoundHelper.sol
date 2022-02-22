// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

interface IJCompoundHelper {
    function getMantissaHelper(uint256 _underDecs, uint256 _cTokenDecs) external pure returns (uint256 mantissa);
    function getCompoundPurePriceHelper(address _cTokenAddress) external view returns (uint256 compoundPrice);
    function getCompoundPriceHelper(address _cTokenAddress, uint256 _underDecs, uint256 _cTokenDecs) external view returns (uint256 compNormPrice);
}