// SPDX-License-Identifier: MIT
/**
 * Created on 2020-11-09
 * @summary: Jibrel Fees Collector
 * @author: Jibrel Team
 */
pragma solidity 0.6.12;

import "@openzeppelin/contracts-upgradeable/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import './uniswap/UniswapV2Library.sol';
import './uniswap/IUniswapV2Pair.sol';
import "./TransferETHHelper.sol";
import "./JFeesCollectorStorage.sol";
import "./interfaces/IJAdminTools.sol";
import "./interfaces/IJFeesCollector.sol";

contract JFeesCollector is OwnableUpgradeable, ReentrancyGuardUpgradeable, JFeesCollectorStorage, IJFeesCollector {
    using SafeMathUpgradeable for uint256;

    function initialize(address _adminTools) external initializer {
        OwnableUpgradeable.__Ownable_init();
        adminToolsAddress = _adminTools;
        contractVersion = 1;
    }

    function setAdminToolsAddress(address _adminTools) external onlyOwner {
        adminToolsAddress = _adminTools;
    }

    /**
     * @dev admins modifiers
     */
    modifier onlyAdmins() {
        require(IJAdminTools(adminToolsAddress).isAdmin(msg.sender), "JCompound: not an Admin");
        _;
    }

    /**
    * @dev update contract version
    * @param _ver new version
    */
    function updateVersion(uint256 _ver) external onlyAdmins {
        require(_ver > contractVersion, "!NewVersion");
        contractVersion = _ver;
    }
    
    receive() external payable {
        emit EthReceived(msg.sender, msg.value, block.number);
    }

    /**
    * @dev withdraw eth amount
    * @param _amount amount of withdrawed eth
    */
    function ethWithdraw(uint256 _amount) external onlyAdmins nonReentrant {
        require(_amount <= address(this).balance, "Not enough contract balance");
        TransferETHHelper.safeTransferETH(msg.sender, _amount);
        emit EthWithdrawn(_amount, block.number);
    }

    /**
    * @dev add allowed token address
    * @param _tok address of the token to add
    */
    function allowToken(address _tok) external onlyAdmins {
        require(!isTokenAllowed(_tok), "Token already allowed");
        tokensAllowed[_tok] = true;
        emit TokenAdded(_tok, block.number);
    }

    /**
    * @dev remove allowed token address
    * @param _tok address of the token to add
    */
    function disallowToken(address _tok) external onlyAdmins {
        require(isTokenAllowed(_tok), "Token not allowed");
        tokensAllowed[_tok] = false;
        emit TokenRemoved(_tok, block.number);
    }

    /**
    * @dev get eth contract balance
    * @return uint256 eth contract balance
    */
    function getEthBalance() public view returns (uint256) {
        return address(this).balance;
    }

    /**
    * @dev get contract token balance
    * @param _tok address of the token
    * @return uint256 token contract balance
    */
    function getTokenBalance(address _tok) public view returns (uint256) {
        return IERC20Upgradeable(_tok).balanceOf(address(this));
    }

    /**
    * @dev check if a token is already allowed
    * @param _tok address of the token
    * @return bool token allowed
    */
    function isTokenAllowed(address _tok) public view returns (bool) {
        return tokensAllowed[_tok];
    }

    /**
    * @dev withdraw tokens from the contract, checking if a token is already allowed
    * @param _tok address of the token
    * @param _amount token amount
    */
    function withdrawTokens(address _tok, uint256 _amount) external onlyAdmins nonReentrant {
        require(isTokenAllowed(_tok), "Token not allowed");
        SafeERC20Upgradeable.safeTransfer(IERC20Upgradeable(_tok), msg.sender, _amount);
        emit TokenWithdrawn(_tok, _amount, block.number);
    }

    /**
    * @dev withdraw tokens from the contract, checking if a token is already allowed
    * @param _tok address of the token
    * @param _receiver recipient address
    * @param _amount token amount
    */
    function sendTokensToReceiver(address _tok, address _receiver, uint256 _amount) external onlyAdmins nonReentrant {
        require(isTokenAllowed(_tok), "Token not allowed");
        SafeERC20Upgradeable.safeTransfer(IERC20Upgradeable(_tok), _receiver, _amount);
        emit TokenWithdrawn(_tok, _amount, block.number);
    }

    /**
    * @dev set uniswap factory and routerV02
    * @param _factory uniswap factory address
    * @param _routerV02 uniswap routerV02 address
    */
    function setUniswapAddresses(address _factory, address _routerV02) external onlyAdmins {
        require(_factory != address(0), "JFC: Zero address for UNI factory");
        require(_routerV02 != address(0), "JFC: Zero address for UNI router02");
        factory = _factory; //Kovan factory: 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f
        uniV2Router02 = IUniswapV2Router02(_routerV02); //Kovan router02: 0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D
    }

    /**
    * @dev get pair info from uniswap
    * @param _tokenA first token of the pair
    * @param _tokenB second token of the pair
    * @return reserveA reserves for token A
    * @return reserveB reserves for token B
    * @return totalSupply total supply
    */
    function pairInfo(address _tokenA, address _tokenB) public view returns (uint reserveA, uint reserveB, uint totalSupply) {
        IUniswapV2Pair pair = IUniswapV2Pair(UniswapV2Library.pairFor(factory, _tokenA, _tokenB));
        totalSupply = pair.totalSupply();
        (uint reserves0, uint reserves1,) = pair.getReserves();
        (reserveA, reserveB) = _tokenA == pair.token0() ? (reserves0, reserves1) : (reserves1, reserves0);
        return (reserveA, reserveB, totalSupply);
    } 

    /**
    * @dev swap eth amount for tokens in a uniswap pool
    * @param _token token of the pair to be received
    * @param _amount eth amount to be sent to uniswap pool
    */
    function swapEthForToken(address _token, uint _amount) public payable {
        // amountOutMin must be retrieved from an oracle of some kind
        //uint amountOutMin = getUniswapPrice(_amount);
        address[] memory path = new address[](2);
        path[0] = uniV2Router02.WETH();
        path[1] = _token;
        (uint reserveA, uint reserveB,) = pairInfo(path[0], path[1]);
        uint amountOutMin = reserveB / reserveA * _amount;
        uniV2Router02.swapExactETHForTokens{value: _amount}(amountOutMin, path, address(this), block.timestamp);
    }

    /**
    * @dev swap token amount for eth in a uniswap pool
    * @param _token token of the pair to be sent
    * @param _amount token amount to be sent to uniswap pool
    */
    function swapTokenForEth(address _token, uint _amount) public {
        //require(IERC20Upgradeable(_token).transferFrom(msg.sender, address(this), _amount), 'transferFrom failed.');
        require(IERC20Upgradeable(_token).approve(address(uniV2Router02), _amount), 'approve failed.');
        // amountOutMin must be retrieved from an oracle of some kind
        //uint amountOutMin = getUniswapPrice(_amount);
        address[] memory path = new address[](2);
        path[0] = _token;
        path[1] = uniV2Router02.WETH();
        (uint reserveA, uint reserveB,) = pairInfo(path[0], path[1]);
        uint amountOutMin = reserveB / reserveA * _amount;
        uniV2Router02.swapExactTokensForETH(_amount, amountOutMin, path, address(this), block.timestamp);
    }

    /**
    * @dev swap token amount for another token in a uniswap pool
    * @param _tokenSent token of the pair to be sent
    * @param _tokenBack token of the pair to be received
    * @param _amount token amount to be sent to uniswap pool
    */
    function swapTokenForToken(address _tokenSent, address _tokenBack, uint _amount) public {
        //require(IERC20Upgradeable(_tokenSent).transferFrom(msg.sender, address(this), _amount), 'transferFrom failed.');
        require(IERC20Upgradeable(_tokenSent).approve(address(uniV2Router02), _amount), 'approve failed.');
        // amountOutMin must be retrieved from an oracle of some kind
        //uint amountOutMin = getUniswapPrice(_amount);
        address[] memory path = new address[](2);
        path[0] = _tokenSent;
        path[1] = _tokenBack;
        (uint reserveA, uint reserveB,) = pairInfo(path[0], path[1]);
        uint amountOutMin = reserveB / reserveA * _amount;
        uniV2Router02.swapExactTokensForTokens(_amount, amountOutMin, path, address(this), block.timestamp);
    }

}
