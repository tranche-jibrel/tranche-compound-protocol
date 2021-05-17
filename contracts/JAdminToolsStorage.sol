// SPDX-License-Identifier: MIT
/**
 * Created on 2021-05-16
 * @summary: Admin Tools storage
 * @author: Jibrel Team
 */
pragma solidity 0.6.12;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract JAdminToolsStorage is OwnableUpgradeable {
/* WARNING: NEVER RE-ORDER VARIABLES! Always double-check that new variables are added APPEND-ONLY. Re-ordering variables can permanently BREAK the deployed proxy contract.*/
    uint256 public contractVersion;
    uint256 public adminCounter;
    // mapping for Tranches administrators
    mapping (address => bool) public _Admins;
}