// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import './interfaces/IETHGateway.sol';
import "./TransferETHHelper.sol";
import "./interfaces/ICEth.sol";

contract ETHGateway is IETHGateway, Ownable {
  using SafeMath for uint256;

  ICEth internal immutable cEthToken;
  address public jCompoundAddress;

  /**
   * @dev Sets the WETH address and the JCompound address. Infinite approves JCompound contract.
   * @param _ceth Address of the Wrapped Ether contract
   * @param _jCompoundAddress Address of the JCompound contract
   **/
  constructor(address _ceth, address _jCompoundAddress) public {
    cEthToken = ICEth(_ceth);
    jCompoundAddress = _jCompoundAddress;
  }

  /**
  * @dev redeem cETH from compound contract (ethers remains in this contract)
  * @param _amount amount of cETH to redeem
  * @param _redeemType true or false, normally true
  */
  function redeemCEth(uint256 _amount, bool _redeemType) internal returns (uint256 redeemResult) {
      // _amount is scaled up by 1e18 to avoid decimals
      if (_redeemType) {
          // Retrieve your asset based on a cToken amount
          redeemResult = cEthToken.redeem(_amount);
      } else {
          // Retrieve your asset based on an amount of the asset
          redeemResult = cEthToken.redeemUnderlying(_amount);
      }
      return redeemResult;
  }

  /**
  * @dev get eth balance on this contract
  */
  function getEthBalance() public view returns (uint256) {
      return address(this).balance;
  }

  /**
  * @dev get eth balance on this contract
  */
  function getTokenBalance(address _token) public view returns (uint256) {
      return IERC20(_token).balanceOf(address(this));
  }

  /**
   * @dev withdraws the ETH from cEther tokens.
   * @param _amount amount of cETH to withdraw and receive native ETH
   * @param _to address of the user who will receive native ETH
   * @param _redeemType redeem type
   * @param _cEthBal cEth balance
   */
  function withdrawETH(uint256 _amount, address _to, bool _redeemType, uint256 _cEthBal) external override {
    require(msg.sender == jCompoundAddress, "ETHGateway: caller is not JCompound contract");

    uint256 oldEthBal = getEthBalance();
    uint256 retCompoundCode = redeemCEth(_amount, _redeemType);
    if(retCompoundCode != 0) { 
      // emergency: sennd all cEth to compound
      retCompoundCode = redeemCEth(_cEthBal, true); 
    }
    uint256 diffEthBal = getEthBalance().sub(oldEthBal);
    if (diffEthBal > 0) {
      TransferETHHelper.safeTransferETH(_to, diffEthBal);
    }
    uint256 newcEthBal = getTokenBalance(address(cEthToken));
    if (newcEthBal > 0)
       IERC20(address(cEthToken)).transfer(_to, newcEthBal);
  }

  /**
   * @dev transfer ERC20 from the utility contract, for ERC20 recovery in case of stuck tokens due
   * direct transfers to the contract address.
   * @param _token token to transfer
   * @param _to recipient of the transfer
   * @param _amount amount to send
   */
  function emergencyTokenTransfer(address _token, address _to, uint256 _amount) external onlyOwner {
    IERC20(_token).transfer(_to, _amount);
  }

  /**
   * @dev transfer native Ether from the utility contract, for native Ether recovery in case of stuck Ether
   * due selfdestructs or transfer ether to pre-computated contract address before deployment.
   * @param _to recipient of the transfer
   * @param _amount amount to send
   */
  function emergencyEtherTransfer(address _to, uint256 _amount) external onlyOwner {
    TransferETHHelper.safeTransferETH(_to, _amount);
  }

  /**
   * @dev Only cEther contract is allowed to transfer ETH here. Prevent other addresses to send Ether to this contract.
   */
  receive() external payable {
    require(msg.sender == address(cEthToken), 'Receive not allowed');
  }

  /**
   * @dev Revert fallback calls
   */
  fallback() external payable {
    revert('Fallback not allowed');
  }
}
