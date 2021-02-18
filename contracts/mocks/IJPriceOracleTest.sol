// SPDX-License-Identifier: MIT
/**
 * Created on 2020-11-09
 * @summary: JPriceOracle Interface
 * @author: Jibrel Team
 */
pragma solidity 0.6.12;

interface IJPriceOracleTest {
    function isAdmin(address account) external view returns (bool);
    function addAdmin(address account) external;
    function removeAdmin(address account) external;
    function renounceAdmin() external;

    event AdminAdded(address account);
    event AdminRemoved(address account);
}