// SPDX-License-Identifier: MIT
/**
 * Created on 2021-02-11
 * @summary: Jibrel Compound Tranche Deployer
 * @author: Jibrel Team
 */
pragma solidity 0.6.12;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "./interfaces/IJTranchesDeployer.sol";
import "./JTrancheAToken.sol";
import "./JTrancheBToken.sol";
import "./JTranchesDeployerStorage.sol";


contract JTranchesDeployer is OwnableUpgradeable, JTranchesDeployerStorage, IJTranchesDeployer {
    using SafeMathUpgradeable for uint256;

    function initialize() external initializer() {
        OwnableUpgradeable.__Ownable_init();
    }

    function setJCompoundAddress(address _jCompound) external onlyOwner {
        jCompoundAddress = _jCompound;
    }

    modifier onlyProtocol() {
        require(msg.sender == jCompoundAddress, "!jCompound");
        _;
    }

    function deployNewTrancheATokens(string memory _nameA, 
            string memory _symbolA, 
            address _sender, 
            address _rewardToken) external override onlyProtocol returns (address) {
        JTrancheAToken jTrancheA = new JTrancheAToken();
        jTrancheA.initialize(_nameA, _symbolA);
        jTrancheA.setJCompoundMinter(msg.sender); 
        jTrancheA.setRewardTokenAddress(_rewardToken);
        jTrancheA.transferOwnership(_sender);
        return address(jTrancheA);
    }

    function deployNewTrancheBTokens(string memory _nameB, 
            string memory _symbolB, 
            address _sender, 
            address _rewardToken) external override onlyProtocol returns (address) {
        JTrancheBToken jTrancheB = new JTrancheBToken();
        jTrancheB.initialize(_nameB, _symbolB);
        jTrancheB.setJCompoundMinter(msg.sender);
        jTrancheB.setRewardTokenAddress(_rewardToken);
        jTrancheB.transferOwnership(_sender);
        return address(jTrancheB);
    }

}