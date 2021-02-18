// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/access/Ownable.sol";

/*contract ERC223ReceivingContract { 
  function tokenFallback(address _from, uint _value, bytes memory _data) public;
}*/

contract ERC20SampleToken is OwnableUpgradeSafe, ERC20UpgradeSafe {

	uint8 public constant DECIMALS = 18;
	uint256 public constant INITIAL_SUPPLY = 10000 * (10 ** uint256(DECIMALS));

	constructor (string memory name, string memory symbol) public {
		OwnableUpgradeSafe.__Ownable_init();
        ERC20UpgradeSafe.__ERC20_init_unchained(name, symbol);
		_mint(msg.sender, INITIAL_SUPPLY);
	}
}