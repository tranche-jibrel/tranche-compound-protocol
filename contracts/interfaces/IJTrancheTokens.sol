// SPDX-License-Identifier: MIT
/**
 * Created on 2021-01-16
 * @summary: JTranches Interface
 * @author: Jibrel Team
 */
pragma solidity 0.6.12;

interface IJTrancheTokens {
    function mint(address account, uint256 value) external;
    function burn(uint256 value) external;
    function updateFundsReceived() external;
    function emergencyTokenTransfer(address _token, address _to, uint256 _amount) external;
    function setRewardTokenAddress(address _token) external;
}