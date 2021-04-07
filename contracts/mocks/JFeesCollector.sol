// SPDX-License-Identifier: MIT
/**
 * Created on 2020-11-09
 * @summary: Jibrel Fees Collector
 * @author: Jibrel Team
 */
pragma solidity 0.6.12;

import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/SafeERC20Upgradeable.sol";
import "../TransferETHHelper.sol";
import "./JFeesCollectorStorage.sol";
import "./IJFeesCollector.sol";

contract JFeesCollector is OwnableUpgradeable, JFeesCollectorStorage, IJFeesCollector {
    using SafeMathUpgradeable for uint256;

    function initialize() public initializer {
        OwnableUpgradeable.__Ownable_init();
        contractVersion = 1;
    }

    modifier locked() {
        require(!fLock);
        fLock = true;
        _;
        fLock = false;
    }

    /**
    * @dev update contract version
    * @param _ver new version
    */
    function updateVersion(uint256 _ver) external onlyOwner {
        require(_ver > contractVersion, "!NewVersion");
        contractVersion = _ver;
    }
    
    receive() external payable {
        emit EthReceived(msg.sender, msg.value, block.number);
    }

    /**
    * @dev withdraw eth amount
    * @param _amount amount of withdrawed eth
    */
    function ethWithdraw(uint256 _amount) external onlyOwner locked {
        require(_amount <= address(this).balance, "Not enough contract balance");
        TransferETHHelper.safeTransferETH(msg.sender, _amount);
        emit EthWithdrawn(_amount, block.number);
    }

    /**
    * @dev add allowed token address
    * @param _tok address of the token to add
    */
    function allowToken(address _tok) external onlyOwner {
        require(!isTokenAllowed(_tok), "Token already allowed");
        tokensAllowed[_tok] = true;
        emit TokenAdded(_tok, block.number);
    }

    /**
    * @dev remove allowed token address
    * @param _tok address of the token to add
    */
    function disallowToken(address _tok) external onlyOwner {
        require(isTokenAllowed(_tok), "Token not allowed");
        tokensAllowed[_tok] = false;
        emit TokenRemoved(_tok, block.number);
    }

    /**
    * @dev get eth contract balance
    * @return uint256 eth contract balance
    */
    function getEthBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
    * @dev get contract token balance
    * @param _tok address of the token
    * @return uint256 token contract balance
    */
    function getTokenBalance(address _tok) external view returns (uint256) {
        return IERC20Upgradeable(_tok).balanceOf(address(this));
    }

    /**
    * @dev check if a token is already allowed
    * @param _tok address of the token
    * @return bool token allowed
    */
    function isTokenAllowed(address _tok) public view returns (bool) {
        return tokensAllowed[_tok];
    }

    /**
    * @dev withdraw tokens from the contract, checking if a token is already allowed
    * @param _tok address of the token
    * @param _amount token amount
    */
    function withdrawTokens(address _tok, uint256 _amount) external onlyOwner locked {
        require(isTokenAllowed(_tok), "Token not allowed");
        SafeERC20Upgradeable.safeTransfer(IERC20Upgradeable(_tok), msg.sender, _amount);
        emit TokenWithdrawed(_tok, _amount, block.number);
    }

}
