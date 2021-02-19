// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/access/Ownable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "./IJTrancheTokens.sol";

contract JTrancheBToken is OwnableUpgradeSafe, ERC20UpgradeSafe, AccessControlUpgradeSafe, IJTrancheTokens {
	using SafeMath for uint256;

    // Create a new role identifier for the minter role
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

	function initialize(string memory name, string memory symbol) public initializer() {
		OwnableUpgradeSafe.__Ownable_init();
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
	 * Update pointsCorrection to keep funds unchanged.
	 * @param account The account that will receive the created tokens.
	 * @param value The amount that will be created.
	 */
	function mint(address account, uint256 value) external override {
		require(hasRole(MINTER_ROLE, msg.sender), "Caller is not a minter");
        super._mint(account, value);
    }

    /** 
	 * @dev Internal function that burns an amount of the token of a given account.
	 * Update pointsCorrection to keep funds unchanged.
	 * @param value The amount that will be burnt.
	 */
	function burn(uint256 value) external override {
		super._burn(msg.sender, value);
	}
}