// SPDX-License-Identifier: MIT
/**
 * Created on 2021-02-11
 * @summary: Jibrel Compound Tranche Deployer
 * @author: Jibrel Team
 */
pragma solidity 0.6.12;

import "@openzeppelin/contracts-ethereum-package/contracts/access/Ownable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "./JTrancheAToken.sol";
import "./JTrancheBToken.sol";
import "./IJTranchesDeployer.sol";
import "./IJCompound.sol";

contract JTranchesDeployer is OwnableUpgradeSafe, IJTranchesDeployer {
    using SafeMath for uint256;

    address public jCompoundAddress;

    function initialize() public initializer() {
        OwnableUpgradeSafe.__Ownable_init();
    }

    function setJCompoundAddress(address _jCompound) public onlyOwner {
        jCompoundAddress = _jCompound;
    }

    modifier onlyProtocol() {
        require(msg.sender == jCompoundAddress, "TrancheDeployer: caller is not jCompound");
        _;
    }

    function deployNewTrancheATokens(string memory _nameA, string memory _symbolA, address _sender) public override onlyProtocol returns (address) {
        JTrancheAToken jTrancheA = new JTrancheAToken();
        jTrancheA.initialize(_nameA, _symbolA);
        jTrancheA.setJCompoundMinter(msg.sender); 
        jTrancheA.transferOwnership(_sender);
        return address(jTrancheA);
    }

    function deployNewTrancheBTokens(string memory _nameB, string memory _symbolB, address _sender) public override onlyProtocol returns (address) {
        JTrancheBToken jTrancheB = new JTrancheBToken();
        jTrancheB.initialize(_nameB, _symbolB);
        jTrancheB.setJCompoundMinter(msg.sender);
        jTrancheB.transferOwnership(_sender);
        return address(jTrancheB);
    }

}