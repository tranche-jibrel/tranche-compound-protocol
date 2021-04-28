// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

interface IComptrollerLensInterface {
    //function markets(address) external view returns (bool, uint);
    //function oracle() external view returns (PriceOracle);
    //function getAccountLiquidity(address) external view returns (uint, uint, uint);
    //function getAssetsIn(address) external view returns (CToken[] memory);
    function claimComp(address) external;
    function compAccrued(address) external view returns (uint);
}
