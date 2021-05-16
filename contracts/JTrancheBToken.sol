// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "./interfaces/IJTrancheTokens.sol";
import "./math/SafeMathUint.sol";
import "./math/SafeMathInt.sol";
import "./interfaces/IFDTBasic.sol";
import "./JTrancheBTokenStorage.sol";

contract JTrancheBToken is IFDTBasic, OwnableUpgradeable, ERC20Upgradeable, AccessControlUpgradeable, JTrancheBTokenStorage, IJTrancheTokens {
	using SafeMathUpgradeable for uint256;
	using SafeMathUint for uint256;
	using SafeMathInt for int256;

	function initialize(string memory name, string memory symbol) external initializer() {
		OwnableUpgradeable.__Ownable_init();
        __ERC20_init(name, symbol);
		// Grant the minter role to a specified account
        _setupRole(MINTER_ROLE, msg.sender);
	}

    function setJCompoundMinter(address _jCompound) external onlyOwner {
		// Grant the minter role to a specified account
        _setupRole(MINTER_ROLE, _jCompound);
	}

	function setRewardTokenAddress(address _token) external onlyOwner {
		//rewardsTokenAddress = _token;
		rewardsToken = IERC20Upgradeable(_token);
	}

	/** 
	 * prev. distributeDividends
	 * @notice Distributes funds to token holders.
	 * @dev It reverts if the total supply of tokens is 0.
	 * It emits the `FundsDistributed` event if the amount of received ether is greater than 0.
	 * About undistributed funds:
	 *   In each distribution, there is a small amount of funds which does not get distributed,
	 *     which is `(msg.value * pointsMultiplier) % totalSupply()`.
	 *   With a well-chosen `pointsMultiplier`, the amount funds that are not getting distributed
	 *     in a distribution can be less than 1 (base unit).
	 *   We can actually keep track of the undistributed ether in a distribution
	 *     and try to distribute it in the next distribution ....... todo implement  
	 */
	function _distributeFunds(uint256 value) internal {
		require(totalSupply() > 0, "JTrancheB: supply is zero");
		if (value > 0) {
			pointsPerShare = pointsPerShare.add(value.mul(pointsMultiplier) / totalSupply());
			emit FundsDistributed(msg.sender, value);
		}
	}

	/**
	 * prev. withdrawDividend
	 * @notice Prepares funds withdrawal
	 * @dev It emits a `FundsWithdrawn` event if the amount of withdrawn ether is greater than 0.
	 */
	function _prepareWithdraw() internal returns (uint256) {
		uint256 _withdrawableDividend = withdrawableFundsOf(msg.sender);
		withdrawnFunds[msg.sender] = withdrawnFunds[msg.sender].add(_withdrawableDividend);
		emit FundsWithdrawn(msg.sender, _withdrawableDividend);
		return _withdrawableDividend;
	}

	/** 
	 * prev. withdrawableDividendOf
	 * @notice View the amount of funds that an address can withdraw.
	 * @param _owner The address of a token holder.
	 * @return The amount funds that `_owner` can withdraw.
	 */
	function withdrawableFundsOf(address _owner) public view override returns(uint256) {
		return accumulativeFundsOf(_owner).sub(withdrawnFunds[_owner]);
	}
	
	/**
	 * prev. withdrawnDividendOf
	 * @notice View the amount of funds that an address has withdrawn.
	 * @param _owner The address of a token holder.
	 * @return The amount of funds that `_owner` has withdrawn.
	 */
	function withdrawnFundsOf(address _owner) public view returns(uint256) {
		return withdrawnFunds[_owner];
	}

	/**
	 * prev. accumulativeDividendOf
	 * @notice View the amount of funds that an address has earned in total.
	 * @dev accumulativeFundsOf(_owner) = withdrawableFundsOf(_owner) + withdrawnFundsOf(_owner)
	 * = (pointsPerShare * balanceOf(_owner) + pointsCorrection[_owner]) / pointsMultiplier
	 * @param _owner The address of a token holder.
	 * @return The amount of funds that `_owner` has earned in total.
	 */
	function accumulativeFundsOf(address _owner) public view returns(uint256) {
		return pointsPerShare.mul(balanceOf(_owner)).toInt256Safe().add(pointsCorrection[_owner]).toUint256Safe() / pointsMultiplier;
	}

	/**
	 * @dev Internal function that transfer tokens from one address to another.
	 * Update pointsCorrection to keep funds unchanged.
	 * @param from The address to transfer from.
	 * @param to The address to transfer to.
	 * @param value The amount to be transferred.
	 */
	function _transfer(address from, address to, uint256 value) internal override {
		super._transfer(from, to, value);
		int256 _magCorrection = pointsPerShare.mul(value).toInt256Safe();
		pointsCorrection[from] = pointsCorrection[from].add(_magCorrection);
		pointsCorrection[to] = pointsCorrection[to].sub(_magCorrection);
	}

	/**
	 * @dev mints tokens to an account.
	 * Update pointsCorrection to keep funds unchanged.
	 * @param account The account that will receive the created tokens.
	 * @param value The amount that will be created.
	 */
	function mint(address account, uint256 value) external override {
		require(hasRole(MINTER_ROLE, msg.sender), "JTrancheB: caller is not a minter");
		require(value > 0, "JTrancheB: value is zero");
        super._mint(account, value);
        pointsCorrection[account] = pointsCorrection[account].sub((pointsPerShare.mul(value)).toInt256Safe());
    }
	
	/** 
	 * @dev Internal function that burns an amount of the token of a given account.
	 * Update pointsCorrection to keep funds unchanged.
	 * @param value The amount that will be burnt.
	 */
	function burn(uint256 value) external override {
		require(value > 0, "JTrancheB: value is zero");
		super._burn(msg.sender, value);
		pointsCorrection[msg.sender] = pointsCorrection[msg.sender].add( (pointsPerShare.mul(value)).toInt256Safe() );
	}

	/**
	 * @notice Withdraws all available funds for a token holder
	 */
	function withdrawFunds() external {
		uint256 withdrawableFunds = _prepareWithdraw();
		require(rewardsToken.transfer(msg.sender, withdrawableFunds), "JTrancheB: withdraw funds transfer failed");
		_updateFundsTokenBalance();
	}

	/**
	 * @dev Updates the current funds token balance 
	 * and returns the difference of new and previous funds token balances
	 * @return A int256 representing the difference of the new and previous funds token balance
	 */
	function _updateFundsTokenBalance() internal returns (int256) {
		uint256 prevFundsTokenBalance = rewardsTokenBalance;
		rewardsTokenBalance = rewardsToken.balanceOf(address(this));
		return int256(rewardsTokenBalance).sub(int256(prevFundsTokenBalance));
	}

	/**
	 * @notice Register a payment of funds in tokens. May be called directly after a deposit is made.
	 * @dev Calls _updateFundsTokenBalance(), whereby the contract computes the delta of the previous and the new 
	 * funds token balance and increments the total received funds (cumulative) by delta by calling _registerFunds()
	 */
	function updateFundsReceived() external override {
		int256 newFunds = _updateFundsTokenBalance();
		if (newFunds > 0) {
			_distributeFunds(newFunds.toUint256Safe());
		}
	}

	/**
	 * @notice Emergency function to withdraw stuck tokens. It should be callable only by protocol
	 * @param _token token address
	 * @param _to receiver address
	 * @param _amount token amount
	 */
	function emergencyTokenTransfer(address _token, address _to, uint256 _amount) public override {
		require(hasRole(MINTER_ROLE, msg.sender), "JTrancheB:  Caller is not protocol");
        if(_token != address(0))
			IERC20Upgradeable(_token).transfer(_to, _amount);
		else {
			bool sent = payable(_to).send(_amount);
			require(sent, "Failed to send Ether");
		}
    }
}