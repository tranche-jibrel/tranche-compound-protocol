// SPDX-License-Identifier: MIT
/**
 * Created on 2021-02-11
 * @summary: Jibrel Compound Tranche Deployer
 * @author: Jibrel Team
 */
pragma solidity ^0.6.12;

import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/SafeERC20.sol";
import "./TransferETHHelper.sol";
import "./IJPriceOracle.sol";
import "./IJTrancheTokens.sol";
import "./IJTranchesDeployer.sol";
import "./JCompoundStorage.sol";
import "./IJCompound.sol";
import "./ICErc20.sol";


contract JCompound is OwnableUpgradeSafe, JCompoundStorage, IJCompound {
    using SafeMath for uint256;

    /**
     * @dev contract initializer
     * @param _priceOracle price oracle address
     * @param _feesCollector fees collector contract address
     * @param _tranchesDepl tranches deployer contract address
     */
    function initialize(address _priceOracle, 
            address _feesCollector, 
            address _tranchesDepl) public initializer() {
        OwnableUpgradeSafe.__Ownable_init();
        priceOracleAddress = _priceOracle;
        feesCollectorAddress = _feesCollector;
        tranchesDeployerAddress = _tranchesDepl;
    }

    /**
     * @dev admins modifiers
     */
    modifier onlyAdmins() {
        require(IJPriceOracle(priceOracleAddress).isAdmin(msg.sender), "Protocol: not an Admin");
        _;
    }

    /**
     * @dev locked modifiers
     */
    modifier locked() {
        require(!fLock);
        fLock = true;
        _;
        fLock = false;
    }

    // This is needed to receive ETH when calling redeemCEth function
    fallback() external payable {}
    receive() external payable {}

    /**
     * @dev set realationship between ethers and the corresponding Compound cETH contract
     * @param _cEtherContract compound token contract address (cETH contract, on Kovan: 0x41b5844f4680a8c38fbb695b7f9cfd1f64474a72)
     */
    function setCEtherContract(address payable _cEtherContract) external onlyAdmins {
        cEtherContract = _cEtherContract;
        cEthToken = ICEth(cEtherContract);
        cTokenContracts[0x0000000000000000000000000000000000000000] = _cEtherContract;
    }

    /**
     * @dev set relationship between a token and the corresponding Compound cToken contract
     * @param _erc20Contract token contract address (i.e. DAI contract, on Kovan: 0x4f96fe3b7a6cf9725f59d353f723c1bdb64ca6aa)
     * @param _cErc20Contract compound token contract address (i.e. cDAI contract, on Kovan: 0xf0d0eb522cfa50b716b3b1604c4f0fa6f04376ad)
     */
    function setCTokenContract(address _erc20Contract, address _cErc20Contract) external onlyAdmins {
        cTokenContracts[_erc20Contract] = _cErc20Contract;
    }

    /**
     * @dev check if a cToken is allowed or not
     * @param _erc20Contract token contract address (i.e. DAI contract, on Kovan: 0x4f96fe3b7a6cf9725f59d353f723c1bdb64ca6aa)
     * @return true or false
     */
    function isCTokenAllowed(address _erc20Contract) public view returns (bool) {
        return cTokenContracts[_erc20Contract] != address(0);
    }

    /**
     * @dev check if a cToken is allowed or not
     * @param _cTokenDec cToken decimals
     * @param _underlyingDec underlying token decimals
     */
    function setDecimals(uint8 _cTokenDec, uint8 _underlyingDec) external onlyAdmins {
        trancheParameters[trancheCounter].cTokenDecimals = _cTokenDec;
        trancheParameters[trancheCounter].underlyingDecimals = _underlyingDec;
    }

    /**
     * @dev set tranche redemption percentage
     * @param _trancheNum tranche number
     * @param _redeemPercent user redemption percent
     */
    function setTrancheVaultPercentage(uint256 _trancheNum, uint16 _redeemPercent) external onlyAdmins {
        trancheParameters[_trancheNum].redemptionPercentage = _redeemPercent;
    }

    function addTrancheToProtocol(address _erc20Contract, string memory _nameA, string memory _symbolA, string memory _nameB, 
                string memory _symbolB, uint256 _fixedRpb, uint8 _cTokenDec, uint8 _underlyingDec, uint256 _initBSupply) public onlyAdmins locked {
        require(tranchesDeployerAddress != address(0), "CProtocol: set tranche eth deployer");
        require(isCTokenAllowed(_erc20Contract), "CProtocol: cToken not allowed");

        trancheAddresses[trancheCounter].buyerCoinAddress = _erc20Contract;
        trancheAddresses[trancheCounter].dividendCoinAddress = cTokenContracts[_erc20Contract];
        trancheAddresses[trancheCounter].ATrancheAddress = 
                IJTranchesDeployer(tranchesDeployerAddress).deployNewTrancheATokens(_nameA, _symbolA, msg.sender);
        trancheAddresses[trancheCounter].BTrancheAddress = 
                IJTranchesDeployer(tranchesDeployerAddress).deployNewTrancheBTokens(_nameB, _symbolB, msg.sender, _initBSupply);
        

        trancheParameters[trancheCounter].cTokenDecimals = _cTokenDec;
        trancheParameters[trancheCounter].underlyingDecimals = _underlyingDec;
        trancheParameters[trancheCounter].trancheAFixedRPB = _fixedRpb;
        trancheParameters[trancheCounter].genesisBlock = block.number;
        trancheParameters[trancheCounter].redemptionPercentage = 9950;  //default value 99.5%

        emit TrancheAddedToProtocol(trancheCounter, trancheAddresses[trancheCounter].ATrancheAddress, trancheAddresses[trancheCounter].BTrancheAddress);

        trancheCounter = trancheCounter.add(1);
    } 

    /**
     * @dev send eth to cETH compound contract (it sends ethers from msg.sender), giving back tranche tokens
     */
/*    function sendEthToCompound() public payable returns (bool) {
        cEthToken.mint{value: msg.value}();
        return true;
    }*/

    /**
     * @dev send an amount of tokens to corresponding compound contract (it takes tokens from this contract). Only allowed token should be sent
     * @param _erc20Contract token contract address
     * @param _numTokensToSupply token amount to be sent
     * @return mint result
     */
    function sendErc20ToCompound(address _erc20Contract, uint256 _numTokensToSupply) internal returns(uint256) {
        require(cTokenContracts[_erc20Contract] != address(0), "token not accepted");
        // i.e. DAI contract, on Kovan: 0x4f96fe3b7a6cf9725f59d353f723c1bdb64ca6aa
        IERC20 underlying = IERC20(_erc20Contract);

        // i.e. cDAI contract, on Kovan: 0xf0d0eb522cfa50b716b3b1604c4f0fa6f04376ad
        ICErc20 cToken = ICErc20(cTokenContracts[_erc20Contract]);

        underlying.approve(cTokenContracts[_erc20Contract], _numTokensToSupply);
        require(underlying.allowance(address(this), cTokenContracts[_erc20Contract]) >= _numTokensToSupply, "JCompound: cannot send to compound contract");

        uint256 mintResult = cToken.mint(_numTokensToSupply);
        return mintResult;
    }

    /**
     * @dev redeem an amount of cTokens to have back original tokens (tokens remains in this contract). Only allowed token should be sent
     * @param _erc20Contract original token contract address
     * @param _amount cToken amount to be sent
     * @param _redeemType true or false, normally true
     */
    function redeemCErc20Tokens(address _erc20Contract, uint256 _amount, bool _redeemType) internal returns (uint256 redeemResult) {
        require(cTokenContracts[_erc20Contract] != address(0), "token not accepted");
        // i.e. cDAI contract, on Kovan: 0xf0d0eb522cfa50b716b3b1604c4f0fa6f04376ad
        ICErc20 cToken = ICErc20(cTokenContracts[_erc20Contract]);

        if (_redeemType == true) {
            // Retrieve your asset based on a cToken amount
            redeemResult = cToken.redeem(_amount);
        } else {
            // Retrieve your asset based on an amount of the asset
            redeemResult = cToken.redeemUnderlying(_amount);
        }
        return redeemResult;
    }

    /**
     * @dev redeem cETH from compound contract (ethers remains in this contract)
     * @param _amount amount of cETH to redeem
     * @param _redeemType true or false, normally true
     */
    function redeemCEth(uint256 _amount, bool _redeemType) internal returns (uint256 redeemResult) {
        // _amount is scaled up by 1e18 to avoid decimals
        if (_redeemType == true) {
            // Retrieve your asset based on a cToken amount
            redeemResult = cEthToken.redeem(_amount);
        } else {
            // Retrieve your asset based on an amount of the asset
            redeemResult = cEthToken.redeemUnderlying(_amount);
        }
        return redeemResult;
    }

    /**
     * @dev get cETH exchange rate from compound contract
     * @return exchRateMantissa exchange rate cEth mantissa
     */
    function getCEthExchangeRate() public view returns (uint256 exchRateMantissa) {
        // Amount of current exchange rate from cToken to underlying
        return exchRateMantissa = cEthToken.exchangeRateStored(); // it returns something like 200335783821833335165549849
        //uint256 mantissa = (uint256(trancheParameters[_trancheNum].underlyingDecimals)).add(18).sub(uint256(trancheParameters[_trancheNum].cTokenDecimals));
        //oneCEthInUnderlying = exchRateMantissa.div(10 ** mantissa);
        //return oneCEthInUnderlying; // something like 0.020033578382183333 ETH per 1 cETH
    }

    /**
     * @dev get cETH exchange rate from compound contract
     * @param _tokenContract tranche number
     * @return exchRateMantissa exchange rate cToken mantissa
     */
    function getCTokenExchangeRate(address _tokenContract) public view returns (uint256 exchRateMantissa) {
        ICErc20 cToken = ICErc20(cTokenContracts[_tokenContract]);
        // Amount of current exchange rate from cToken to underlying
        return exchRateMantissa = cToken.exchangeRateStored(); // it returns something like 210615675702828777787378059 (cDAI contract)
        //uint256 mantissa = (uint256(trancheParameters[_trancheNum].underlyingDecimals)).add(18).sub(uint256(trancheParameters[_trancheNum].cTokenDecimals));
        //oneCTokenInUnderlying = exchRateMantissa.div(10 ** mantissa);
        //return oneCTokenInUnderlying; // something like 0.02106157587347771 DAI per 1 cDAI
    }

    /**
     * @dev get tranche mantissa
     * @param _trancheNum tranche number
     * @return mantissa tranche mantissa
     */
    function getMantissa(uint256 _trancheNum) public view returns (uint256 mantissa) {
        return mantissa = (uint256(trancheParameters[_trancheNum].underlyingDecimals)).add(18).sub(uint256(trancheParameters[_trancheNum].cTokenDecimals));
    }

    /**
     * @dev get Tranche A exchange rate
     * @param _trancheNum tranche number
     * @return tranche A token current price
     */
    function getTrancheAExchangeRate(uint256 _trancheNum) public view returns (uint256) {
        return uint256(10 ** 18).add( (trancheParameters[_trancheNum].trancheAFixedRPB).mul( (block.number).sub(trancheParameters[_trancheNum].genesisBlock) ));
    }

    /**
     * @dev send tokens from caller to this contract and then to the corresponding cToken contract address
     * @param _erc20Contract original token contract address
     * @param _numTokensToSupply token amount to be sent
     */
    /*function sendErc20Tokens(address _erc20Contract, uint256 _numTokensToSupply) internal {
        require(cTokenContracts[_erc20Contract] != address(0), "token not accepted");
        require(IERC20(_erc20Contract).allowance(msg.sender, address(this)) >= _numTokensToSupply, "not enough allowance!");
        SafeERC20.safeTransferFrom(IERC20(_erc20Contract), msg.sender, address(this), _numTokensToSupply);
        sendErc20ToCompound(_erc20Contract, _numTokensToSupply);
    }*/

    /**
     * @dev buy Tranche A Tokens
     * @param _trancheNum tranche number
     * @param _amount amount of stable coins sent by buyer
     */
    function buyTrancheAToken(uint256 _trancheNum, uint256 _amount) public payable locked {
        if (trancheAddresses[_trancheNum].buyerCoinAddress == address(0)){
            _amount = msg.value;
            //Transfer ETH from msg.sender to protocol;
            TransferETHHelper.safeTransferETH(address(this), _amount);
            // transfer ETH to Coompound receiving cETH
            cEthToken.mint{value: _amount}();
        } else {
            // check approve
            require(IERC20(trancheAddresses[_trancheNum].buyerCoinAddress).allowance(msg.sender, address(this)) >= _amount, "JCompound: allowance failed buying tranche A");
            //Transfer DAI from msg.sender to protocol;
            SafeERC20.safeTransferFrom(IERC20(trancheAddresses[_trancheNum].buyerCoinAddress), msg.sender, address(this), _amount);
            // transfer DAI to Coompound receiving cDai
            sendErc20ToCompound(trancheAddresses[_trancheNum].buyerCoinAddress, _amount);
        }
        // set amount of tokens to be minted calculate taToken amount via taToken price
        uint256 taAmount = _amount.mul(10**18).div(getTrancheAExchangeRate(_trancheNum));

        //Mint trancheA tokens and send them to msg.sender;
        IJTrancheTokens(trancheAddresses[_trancheNum].ATrancheAddress).mint(msg.sender, taAmount);
        emit TrancheATokenMinted(_trancheNum, msg.sender, _amount, taAmount);
    }

    /**
     * @dev redeem Tranche A Tokens
     * @param _trancheNum tranche number
     * @param _amount amount of stable coins sent by buyer
     */
    function redeemTrancheAToken(uint256 _trancheNum, uint256 _amount) public locked {
        // check approve
        require(IERC20(trancheAddresses[_trancheNum].ATrancheAddress).allowance(msg.sender, address(this)) >= _amount, "JCompound: allowance failed redeeming tranche A");
        //Transfer DAI from msg.sender to protocol;
        SafeERC20.safeTransferFrom(IERC20(trancheAddresses[_trancheNum].ATrancheAddress), msg.sender, address(this), _amount);

        // uint256 cTokenAmount;
        uint256 initBal;
        uint256 newBal;
        // uint256 initCTokenBal = getTokenBalance(trancheAddresses[_trancheNum].dividendCoinAddress);
        // uint256 diffDigits = uint256(trancheParameters[_trancheNum].underlyingDecimals).sub(uint256(trancheParameters[_trancheNum].cTokenDecimals));
        uint256 tmpAmount = _amount.mul(trancheParameters[_trancheNum].redemptionPercentage).div(10000);
        uint256 taAmount = tmpAmount.mul(getTrancheAExchangeRate(_trancheNum)).div(10**18);
        if (trancheAddresses[_trancheNum].buyerCoinAddress == address(0)) {
            // calculate taETH amount via cETH price
            initBal = getEthBalance();
            // cTokenAmount = taAmount.mul(10 ** getMantissa(_trancheNum)).div(getCEthExchangeRate()).div(diffDigits);
            // if (cTokenAmount > initCTokenBal)
            //     cTokenAmount = initCTokenBal;
            require(redeemCEth(taAmount, false) == 0, "JCompound: incorrect answer from cEth");
            newBal = getEthBalance();
            TransferETHHelper.safeTransferETH(msg.sender, newBal.sub(initBal));
        } else {
            // calculate taToken amount via cToken price
            initBal = getTokenBalance(trancheAddresses[_trancheNum].buyerCoinAddress);
            // cTokenAmount = taAmount.mul(10 ** getMantissa(_trancheNum)).div(getCTokenExchangeRate(trancheAddresses[_trancheNum].buyerCoinAddress)).div(diffDigits);
            // if (cTokenAmount > initCTokenBal)
            //     cTokenAmount = initCTokenBal;
            require(redeemCErc20Tokens(trancheAddresses[_trancheNum].buyerCoinAddress, taAmount, false) == 0, "JCompound: incorrect answer from cToken");
            newBal = getTokenBalance(trancheAddresses[_trancheNum].buyerCoinAddress);
            SafeERC20.safeTransfer(IERC20(trancheAddresses[_trancheNum].buyerCoinAddress), msg.sender, newBal.sub(initBal));
        }
        
        IJTrancheTokens(trancheAddresses[_trancheNum].ATrancheAddress).burn(_amount);
        emit TrancheATokenBurned(_trancheNum, msg.sender, _amount, taAmount);
    }

    /*  TEST FUNCTION  */
    function getBalTrB(uint _trancheNum) public view returns (uint) {
        uint256 diffDigits = uint256(trancheParameters[_trancheNum].underlyingDecimals).sub(uint256(trancheParameters[_trancheNum].cTokenDecimals));
        uint256 bal = getTokenBalance(trancheAddresses[_trancheNum].dividendCoinAddress);
        uint256 balFactor;
        if (trancheAddresses[_trancheNum].buyerCoinAddress == address(0)) {
            balFactor = bal.mul(10 ** diffDigits).mul(getCEthExchangeRate()).div(10 ** getMantissa(_trancheNum));
        } else {
            balFactor = bal.mul(10 ** diffDigits).mul(getCTokenExchangeRate(trancheAddresses[_trancheNum].buyerCoinAddress)).div(10 ** getMantissa(_trancheNum));
        }
        return balFactor;
    }
    
    /*  TEST FUNCTION  */
    function getCompPrice(uint _trancheNum) public view returns (uint) {
        //uint256 diffDigits = uint256(trancheParameters[_trancheNum].underlyingDecimals).sub(uint256(trancheParameters[_trancheNum].cTokenDecimals));
        uint256 compPrice;
        if (trancheAddresses[_trancheNum].buyerCoinAddress == address(0)) {
            compPrice = getCEthExchangeRate().mul(10 ** 18).div(10 ** getMantissa(_trancheNum));
        } else {
            compPrice = getCTokenExchangeRate(trancheAddresses[_trancheNum].buyerCoinAddress).mul(10 ** 18).div(10 ** getMantissa(_trancheNum));
        }
        return compPrice;
    }
    
    /*  TEST FUNCTION  */
    function getAFactor(uint _trancheNum) public view returns (uint) {
        uint256 totASupply = IERC20(trancheAddresses[_trancheNum].ATrancheAddress).totalSupply();
        return totASupply.mul(getTrancheAExchangeRate(_trancheNum)).div(10**18);
    }

    /**
     * @dev get Tranche B exchange rate
     * @param _trancheNum tranche number
     * @return tbPrice tranche B token current price
     */
    function getTrancheBExchangeRate(uint256 _trancheNum) public view returns (uint256 tbPrice) {
        // set amount of tokens to be minted via taToken price
        // Current tbDai price = (((cDai X cRate)-(aSupply X taRate)) / bSupply)
        // where: cDai = How much cDai we hold in the protocol
        // cRate = cDai / Dai price
        // aSupply = Total number of taDai in circulation
        // taRate = Price of Dai to taDai
        // bSupply = Total number of tbDai in circulation (minimum 1 to avoid divide by 0)
        uint256 diffDigits = uint256(trancheParameters[_trancheNum].underlyingDecimals).sub(uint256(trancheParameters[_trancheNum].cTokenDecimals));
        uint256 bal = getTokenBalance(trancheAddresses[_trancheNum].dividendCoinAddress);
        uint256 totASupply = IERC20(trancheAddresses[_trancheNum].ATrancheAddress).totalSupply();
        // require(totASupply > 0, "Tranche A token supply is 0");
        uint256 totBSupply = IERC20(trancheAddresses[_trancheNum].BTrancheAddress).totalSupply();
        require(totBSupply > 0, "Tranche B token supply is 0");
        uint256 compPrice;
        if (trancheAddresses[_trancheNum].buyerCoinAddress == address(0)) {
            compPrice = getCEthExchangeRate().mul(10 ** 18).div(10 ** getMantissa(_trancheNum));
        } else {
            compPrice = getCTokenExchangeRate(trancheAddresses[_trancheNum].buyerCoinAddress).mul(10 ** 18).div(10 ** getMantissa(_trancheNum));
        }
        uint256 balFactor = bal.mul(10 ** diffDigits).mul(compPrice).div(10 ** 18);
        uint256 aFactor = totASupply.mul(getTrancheAExchangeRate(_trancheNum)).div(10**18);
        if (balFactor > aFactor) {
            uint256 tmpPrice = ( balFactor.sub(aFactor) ).div(totBSupply);
            tbPrice = compPrice.add(tmpPrice);
        } else{
            tbPrice = compPrice;
        }
        return tbPrice;
    }

    /**
     * @dev buy Tranche B Tokens
     * @param _trancheNum tranche number
     * @param _amount amount of stable coins sent by buyer
     */
    function buyTrancheBToken(uint256 _trancheNum, uint256 _amount) public payable locked {
        uint256 tbAmount;
        if (trancheAddresses[_trancheNum].buyerCoinAddress == address(0)) {
            _amount = msg.value;
            TransferETHHelper.safeTransferETH(address(this), _amount);
            // transfer ETH to Coompound receiving cETH
            cEthToken.mint{value: _amount}();
            // get cEth exchange rate from compound
            tbAmount = _amount.mul(10**18).div(getTrancheBExchangeRate(_trancheNum));
        } else {
            // check approve
            require(IERC20(trancheAddresses[_trancheNum].buyerCoinAddress).allowance(msg.sender, address(this)) >= _amount, "JCompound: allowance failed buying tranche B");
            //Transfer DAI from msg.sender to protocol;
            SafeERC20.safeTransferFrom(IERC20(trancheAddresses[_trancheNum].buyerCoinAddress), msg.sender, address(this), _amount);
            // transfer DAI to Couompound receiving cDai
            sendErc20ToCompound(trancheAddresses[_trancheNum].buyerCoinAddress, _amount);
            // get cToken exchange rate from compound
            tbAmount = _amount.mul(10**18).div(getTrancheBExchangeRate(_trancheNum));
        }

        //Mint trancheB tokens and send them to msg.sender;
        IJTrancheTokens(trancheAddresses[_trancheNum].BTrancheAddress).mint(msg.sender, tbAmount);
        emit TrancheBTokenMinted(_trancheNum, msg.sender, _amount, tbAmount);
    }

    /**
     * @dev redeem Tranche B Tokens
     * @param _trancheNum tranche number
     * @param _amount amount of stable coins sent by buyer
     */
    function redeemTrancheBToken(uint256 _trancheNum, uint256 _amount) public locked {
        // check approve
        require(IERC20(trancheAddresses[_trancheNum].BTrancheAddress).allowance(msg.sender, address(this)) >= _amount, "JCompound: allowance failed redeeming tranche B");
        //Transfer DAI from msg.sender to protocol;
        SafeERC20.safeTransferFrom(IERC20(trancheAddresses[_trancheNum].BTrancheAddress), msg.sender, address(this), _amount);

        uint256 initBal;
        uint256 newBal;
        // uint256 cTokenAmount;
        // uint256 initCTokenBal = getTokenBalance(trancheAddresses[_trancheNum].dividendCoinAddress);
        // uint256 diffDigits = uint256(trancheParameters[_trancheNum].underlyingDecimals).sub(uint256(trancheParameters[_trancheNum].cTokenDecimals));
        uint256 tmpAmount = _amount.mul(trancheParameters[_trancheNum].redemptionPercentage).div(10000);
        uint256 tbAmount = tmpAmount.mul(getTrancheBExchangeRate(_trancheNum)).div(10**18);
        if (trancheAddresses[_trancheNum].buyerCoinAddress == address(0)){
            // calculate tbETH amount via cETH price
            initBal = getEthBalance();
            // cTokenAmount = tmpAmount.mul(10 ** getMantissa(_trancheNum)).div(getCEthExchangeRate()).div(diffDigits);
            // if (cTokenAmount > initCTokenBal)
            //     cTokenAmount = initCTokenBal;
            require(redeemCEth(tbAmount, false) == 0, "JCompound: incorrect answer from cEth");
            newBal = getEthBalance();
            TransferETHHelper.safeTransferETH(msg.sender, newBal.sub(initBal));
        } else {
            // calculate taToken amount via cToken price
            initBal = getTokenBalance(trancheAddresses[_trancheNum].buyerCoinAddress);
            // cTokenAmount = tmpAmount.mul(10 ** getMantissa(_trancheNum)).div(getCTokenExchangeRate(trancheParameters[_trancheNum].buyerCoinAddress)).div(diffDigits);
            // if (cTokenAmount > initCTokenBal)
            //     cTokenAmount = initCTokenBal;
            require(redeemCErc20Tokens(trancheAddresses[_trancheNum].buyerCoinAddress, tbAmount, false) == 0, "JCompound: incorrect answer from cToken");
            newBal = getTokenBalance(trancheAddresses[_trancheNum].buyerCoinAddress);
            SafeERC20.safeTransfer(IERC20(trancheAddresses[_trancheNum].buyerCoinAddress), msg.sender, newBal.sub(initBal));
        }
        
        IJTrancheTokens(trancheAddresses[_trancheNum].BTrancheAddress).burn(_amount);
        emit TrancheBTokenBurned(_trancheNum, msg.sender, _amount, tbAmount);
    }

    /**
     * @dev get every token balance in this contract
     * @param _tokenContract token contract address
     */
    function getTokenBalance(address _tokenContract) public view returns (uint256) {
        return IERC20(_tokenContract).balanceOf(address(this));
    }

    /**
     * @dev get eth balance on this contract
     */
    function getEthBalance() public view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev transfer tokens in this contract to owner address
     * @param _tokenContract token contract address
     * @param _amount token amount to be transferred 
     */
    function transferTokenToOwner(address _tokenContract, uint256 _amount) external onlyAdmins {
        SafeERC20.safeTransfer(IERC20(_tokenContract), msg.sender, _amount);
    }

    /**
     * @dev transfer ethers in this contract to owner address
     * @param _amount ethers amount to be transferred 
     */
    function withdrawEthToOwner(uint256 _amount) external onlyAdmins {
        msg.sender.transfer(_amount);
    }

}