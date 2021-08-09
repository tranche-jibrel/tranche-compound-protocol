// SPDX-License-Identifier: MIT
/**
 * Created on 2021-06-18
 * @summary: Markets Interface
 * @author: Jibrel Team
 */
pragma solidity 0.6.12;

interface IIncentivesController {
    function claimRewardsAllMarkets() external;
    function claimRewardSingleMarketTrA(uint256 _idxMarket) external;
    function claimRewardSingleMarketTrB(uint256 _idxMarket) external;
}
