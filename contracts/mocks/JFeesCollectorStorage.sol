// SPDX-License-Identifier: MIT
/**
 * Created on 2020-11-26
 * @summary: Jibrel Loans storage
 * @author: Jibrel Team
 */
pragma solidity 0.6.12;


import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract JFeesCollectorStorage is OwnableUpgradeable {
/* WARNING: NEVER RE-ORDER VARIABLES! Always double-check that new variables are added APPEND-ONLY. Re-ordering variables can permanently BREAK the deployed proxy contract.*/
    bool public fLock;
    uint256 public contractVersion;

    mapping(address => bool) public tokensAllowed;
}