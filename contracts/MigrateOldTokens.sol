// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./interfaces/IJTrancheTokens.sol";
import "./interfaces/IJCompound.sol";
import "./interfaces/IJAdminTools.sol";

contract MigrateOldTokens {
    using SafeMath for uint256; 

    address public oldProtocol;
    address public newProtocol;
    address public adminToolsAddress;

    // oldAddress => newAddress
    mapping (address => address) public availableTokens;
    //newAddress => isTrancheA
    mapping (address => bool) public trancheATokens;

    constructor(address _oldProt, address _newProt, address _atAddress) {
		oldProtocol = _oldProt;
        newProtocol = _newProt;
        adminToolsAddress = _atAddress;
	}

    /**
     * @dev admins modifiers
     */
    modifier onlyAdmins() {
        require(IJAdminTools(adminToolsAddress).isAdmin(msg.sender), "!Admin");
        _;
    }

    function setAvailableToken(address _oldTrAddress, address _newTrAddress) external onlyAdmins {
        availableTokens[_oldTrAddress] = _newTrAddress;
    }

    function setTrancheAToken(address _newTrAddress, bool _isTrA) external onlyAdmins {
        trancheATokens[_newTrAddress] = _isTrA;
    }

    // Step 0: enable this address as a minter in new tokens
    function migrateTokens(address _oldTrAddress) external {
        require(availableTokens[_oldTrAddress] != address(0), "No valid address");
        uint256 oldBal = IERC20(_oldTrAddress).balanceOf(msg.sender);
        require(oldBal > 0, "No Balance");

        address newTokenAddress = availableTokens[_oldTrAddress];

        // IJTrancheTokens(_oldTrAddress).burn(oldBal);  // probably not working
        SafeERC20.safeTransferFrom(IERC20(_oldTrAddress), msg.sender, address(this), oldBal);

        IJTrancheTokens(newTokenAddress).mint(msg.sender, oldBal);
    }
}