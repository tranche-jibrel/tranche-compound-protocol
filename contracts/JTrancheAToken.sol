// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "./interfaces/IJTrancheTokens.sol";

contract JTrancheAToken is OwnableUpgradeable, ERC20Upgradeable, AccessControlUpgradeable, IJTrancheTokens {
	using SafeMathUpgradeable for uint256;

    // Create a new role identifier for the minter role
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

	function initialize(string memory name, string memory symbol) public initializer() {
		OwnableUpgradeable.__Ownable_init();
        __ERC20_init(name, symbol);
		// Grant the minter role to a specified account
        _setupRole(MINTER_ROLE, msg.sender);
	}

    function setJCompoundMinter(address _jCompound) external onlyOwner {
		// Grant the minter role to a specified account
        _setupRole(MINTER_ROLE, _jCompound);
	}

    /**
	 * @dev Internal function that mints tokens to an account.
	 * @param account The account that will receive the created tokens.
	 * @param value The amount that will be created.
	 */
	function mint(address account, uint256 value) external override {
		require(hasRole(MINTER_ROLE, msg.sender), "JTrancheA: Caller is not a minter");
		require(value > 0, "JTrancheA: value is zero");
        super._mint(account, value);
    }

    /** 
	 * @dev Internal function that burns an amount of the token of a given account.
	 * @param value The amount that will be burnt.
	 */
	function burn(uint256 value) external override {
		require(value > 0, "JTrancheA: value is zero");
		super._burn(msg.sender, value);
	}
}