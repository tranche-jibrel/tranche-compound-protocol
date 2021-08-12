// SPDX-License-Identifier: MIT
/**
 * Created on 2021-06-18
 * @summary: Markets Interface
 * @author: Jibrel Team
 */
pragma solidity 0.6.12;

interface IIncentivesController {
    function trancheANewEnter(address account, uint256 amount, address trancheA) external; 
    function trancheBNewEnter(address account, uint256 amount, address trancheB) external; 

    function claimRewardsAllMarkets() external;
    function claimRewardSingleMarketTrA(uint256 _idxMarket) external;
    function claimRewardSingleMarketTrB(uint256 _idxMarket) external;
}
