// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

interface IJCompound {
    event TrancheAddedToProtocol(uint256 trancheNum, address trancheA, address trancheB);
    event TrancheATokenMinted(uint256 trancheNum, address buyer, uint256 amount, uint256 taAmount);
    event TrancheBTokenMinted(uint256 trancheNum, address buyer, uint256 amount, uint256 tbAmount);
    event TrancheATokenRedemption(uint256 trancheNum, address burner, uint256 amount, uint256 userAmount, uint256 feesAmount);
    event TrancheBTokenRedemption(uint256 trancheNum, address burner, uint256 amount, uint256 userAmount, uint256 feesAmount);

    function getSingleTrancheUserStakeCounterTrA(address _user, uint256 _trancheNum) external view returns (uint256);
    function getSingleTrancheUserStakeCounterTrB(address _user, uint256 _trancheNum) external view returns (uint256);
    function getSingleTrancheUserSingleStakeDetailsTrA(address _user, uint256 _trancheNum, uint256 _num) external view returns (uint256, uint256);
    function getSingleTrancheUserSingleStakeDetailsTrB(address _user, uint256 _trancheNum, uint256 _num) external view returns (uint256, uint256);
    function getTrAValue(uint256 _trancheNum) external view returns (uint256 trANormValue);
    function getTrBValue(uint256 _trancheNum) external view returns (uint256);
    function getTotalValue(uint256 _trancheNum) external view returns (uint256);
    function getTrancheACurrentRPB(uint256 _trancheNum) external view returns (uint256);
    function getTrancheAExchangeRate(uint256 _trancheNum) external view returns (uint256);
    function getTrancheBExchangeRate(uint256 _trancheNum, uint256 _newAmount) external view returns (uint256 tbPrice);
}