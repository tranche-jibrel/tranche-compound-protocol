// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

contract IncentivesController is OwnableUpgradeable {

    /**
     * @dev initialize contract
     */
    function initialize () public initializer() {
        OwnableUpgradeable.__Ownable_init();
    }

        /* USER CLAIM REWARDS */
    /**
     * @dev claim all rewards from all markets for a single user
     */
    function claimRewardsAllMarkets() external {
        claimRewardSingleMarketTrA(0);
        claimRewardSingleMarketTrB(0);
    }

    /**
     * @dev claim all rewards from a market tranche A for a single user
     * @param _idxMarket market index
     */
    function claimRewardSingleMarketTrA(uint256 _idxMarket) public {
        uint256 reward = _idxMarket;
    }

    /**
     * @dev claim all rewards from a market tranche B for a single user
     * @param _idxMarket market index
     */
    function claimRewardSingleMarketTrB(uint256 _idxMarket) public {
        uint256 reward = _idxMarket;
    }

}