// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./interfaces/IJTrancheTokens.sol";
import "./interfaces/IJCompound.sol";
import "./interfaces/IIncentivesController.sol";
import "./interfaces/IJAdminTools.sol";

contract MigrateOldTokens {
    using SafeMath for uint256; 

    address public oldProtocol;
    address public newProtocol;
    address public adminToolsAddress;
    address public sirControllerAddress;

    // oldAddress => newAddress
    mapping (address => address) public availableTokens;
    //newAddress => isTrancheA
    mapping (address => bool) public trancheATokens;
    //newAddress => newTrNum
    mapping (address => uint256) public newTokenTrNumbers;
    //oldAddress => oldTrNum
    mapping (address => uint256) public oldTokenTrNumbers;

    constructor(address _oldProt, address _newProt, address _atAddress, address _sirAddress) {
		oldProtocol = _oldProt;
        newProtocol = _newProt;
        adminToolsAddress = _atAddress;
        sirControllerAddress = _sirAddress;
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

    function setNewTokenTrNumbers(address _newTrAddress, uint256 _trNum) external onlyAdmins {
        newTokenTrNumbers[_newTrAddress] = _trNum;
    }

    function setOldTokenTrNumber(address _oldTrAddress, address _trNum) external onlyAdmins {
        availableTokens[_oldTrAddress] = _trNum;
    }


    // Step 0: enable this address as a minter in new tokens
    function migrateTokens(address _oldTrAddress) external {
        require(availableTokens[_oldTrAddress] != address(0), "No valid address");
        uint256 oldBal = IERC20(_oldTrAddress).balanceOf(msg.sender);
        require(oldBal > 0, "No Balance");
        IIncentivesController(sirControllerAddress).claimRewardsAllMarkets(msg.sender);

        uint256 oldTrNum = oldTokenTrNumbers[_oldTrAddress];
        address newTokenAddress = availableTokens[_oldTrAddress];
        uint256 newTrNumbers = newTokenTrNumbers[newTokenAddress];
        uint256 oldSenderCounter;
        uint256 i;
        // uint256 totalAmount;
        // uint256 oldTmpAmount;
        if (trancheATokens[newTokenAddress]) { 
            oldSenderCounter = IJCompound(oldProtocol).getSingleTrancheUserStakeCounterTrA(msg.sender, oldTrNum);
            for (i = 1; i <= oldSenderCounter; i++) { 
                // ( ,oldTmpAmount) = IJCompound(oldProtocol).getSingleTrancheUserSingleStakeDetailsTrA(msg.sender, oldTrNum, i);
                IJCompound(oldProtocol).setTrAStakingDetails(oldTrNum, msg.sender, i, 0, 0);
                // totalAmount = totalAmount.add(oldTmpAmount);
            }
            IJCompound(newProtocol).setTrAStakingDetails(newTrNumbers, msg.sender, 1, oldBal, block.timestamp);
        } else {
            oldSenderCounter = IJCompound(oldProtocol).getSingleTrancheUserStakeCounterTrB(msg.sender, oldTrNum);
            for (i = 1; i <= oldSenderCounter; i++) { 
                // ( ,oldTmpAmount) = IJCompound(oldProtocol).getSingleTrancheUserSingleStakeDetailsTrB(msg.sender, oldTrNum, i);
                IJCompound(oldProtocol).setTrAStakingDetails(oldTrNum, msg.sender, i, 0, 0);
                // totalAmount = totalAmount.add(oldTmpAmount);
            }
            IJCompound(newProtocol).setTrBStakingDetails(newTrNumbers, msg.sender, 1, oldBal, block.timestamp);
        }

        // IJTrancheTokens(_oldTrAddress).burn(oldBal);  // probably not working
        SafeERC20.safeTransferFrom(IERC20(_oldTrAddress), msg.sender, address(this), oldBal);

        IJTrancheTokens(newTokenAddress).mint(msg.sender, oldBal);
    }
}