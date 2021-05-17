// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";

contract JTrancheBTokenStorage {
/* WARNING: NEVER RE-ORDER VARIABLES! Always double-check that new variables are added APPEND-ONLY. Re-ordering variables can permanently BREAK the deployed proxy contract.*/

    // optimize, see https://github.com/ethereum/EIPs/issues/1726#issuecomment-472352728
	uint256 constant public pointsMultiplier = 2**128;
	// Create a new role identifier for the minter role
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

	uint256 public pointsPerShare;

	mapping(address => int256) public pointsCorrection;
	mapping(address => uint256) public withdrawnFunds;

	// token in which the funds can be sent to the FundsDistributionToken
	IERC20Upgradeable public rewardsToken;
	
	// balance of rewardsToken that the FundsDistributionToken currently holds
	uint256 public rewardsTokenBalance;
}