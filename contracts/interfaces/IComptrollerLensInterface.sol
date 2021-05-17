// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

interface IComptrollerLensInterface {
    function claimComp(address) external;
    function compAccrued(address) external view returns (uint);
}
