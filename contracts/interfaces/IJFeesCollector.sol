// SPDX-License-Identifier: MIT
/**
 * Created on 2020-12-10
 * @summary: JFeesCollector Interface
 * @author: Jibrel Team
 */
pragma solidity 0.6.12;

interface IJFeesCollector {
    event EthReceived(address sender, uint256 amount, uint256 blockNumber);
    event EthWithdrawn(uint256 amount, uint256 blockNumber);
    event TokenAdded(address token, uint256 blockNumber);
    event TokenRemoved(address token, uint256 blockNumber);
    event TokenWithdrawn(address token, uint256 amount, uint256 blockNumber);
}