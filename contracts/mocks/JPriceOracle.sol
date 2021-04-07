// SPDX-License-Identifier: MIT
/**
 * Created on 2020-11-09
 * @summary: Jibrel Price Oracle
 * @author: Jibrel Team
 */
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "./IJPriceOracleTest.sol";
import "./JPriceOracleStorage.sol";

contract JPriceOracle is OwnableUpgradeable, JPriceOracleStorage, IJPriceOracleTest { 
    using SafeMathUpgradeable for uint256;

    /**
    * @dev contract initializer
    */
    function initialize() external initializer() {
        OwnableUpgradeable.__Ownable_init();
        _addAdmin(msg.sender);
        contractVersion = 1;
    }

    /**
    * @dev admins modifiers
    */
    modifier onlyAdmins() {
        require(isAdmin(msg.sender), "!Admin");
        _;
    }

    /*   Admins Roles Mngmt  */
    /**
     * @dev add an address as an admin
     * @param account address to check
     */
    function _addAdmin(address account) internal {
        adminCounter = adminCounter.add(1);
        _Admins[account] = true;
        emit AdminAdded(account);
    }

    /**
     * @dev remove an address from admin
     * @param account address to remove
     */
    function _removeAdmin(address account) internal {
        require(adminCounter > 1, "Cannot remove last admin");
        adminCounter = adminCounter.sub(1);
        _Admins[account] = false;
        emit AdminRemoved(account);
    }

    /**
     * @dev check if an address is an admin
     * @param account address to check
     * @return true or false 
     */
    function isAdmin(address account) public override view returns (bool) {
        return _Admins[account];
    }

    /**
     * @dev add an address as an admin
     * @param account address to add
     */
    function addAdmin(address account) external override onlyAdmins {
        require(account != address(0), "Not a valid address!");
        require(!isAdmin(account), " Address already Administrator");
        _addAdmin(account);
    }

    /**
     * @dev remove an address from admin
     * @param account address to remove
     */
    function removeAdmin(address account) external override onlyAdmins {
        _removeAdmin(account);
    }

    /**
     * @dev an address renounce to be an admin
     */
    function renounceAdmin() external override onlyAdmins {
        _removeAdmin(msg.sender);
    }

    /**
    * @dev update contract version
    * @param _ver new version
    */
    function updateVersion(uint256 _ver) external onlyAdmins {
        require(_ver > contractVersion, "!NewVersion");
        contractVersion = _ver;
    }


}

