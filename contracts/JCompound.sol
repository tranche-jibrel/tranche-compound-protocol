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
        redeemTimeout = 10; //default
        totalBlockYears = 2372500;
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
     * @dev set how many blocks will be produced per year on the blockchain 
     * @param _newValue new value (Compound blocksPerYear = 2102400)
     */
    function setBlocksPerYear(uint256 _newValue) external onlyAdmins {
        totalBlockYears = _newValue;
    }

    /**
     * @dev set relationship between ethers and the corresponding Compound cETH contract
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
     * @dev set how many blocks will be produced per year on the blockchain 
     * @param _trancheNum tranche number
     * @return cToken rate per block
     */
    function getCompoundRPBPerTranche(uint256 _trancheNum) external view returns (uint256) {
        if (trancheAddresses[_trancheNum].buyerCoinAddress == address(0)) {
            return cEthToken.supplyRatePerBlock();
        } else {
            ICErc20 cToken = ICErc20(cTokenContracts[trancheAddresses[_trancheNum].buyerCoinAddress]);
            return cToken.supplyRatePerBlock();
        }
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

    /**
     * @dev set tranche redemption percentage
     * @param _trancheNum tranche number
     * @param _newTrARPB new tranche A RPB
     */
    function setTrancheAFixedRPB(uint256 _trancheNum, uint256 _newTrARPB) external onlyAdmins {
        trancheParameters[_trancheNum].startingAPrice = setTrancheAExchangeRate(_trancheNum);
        trancheParameters[_trancheNum].startingABlock = block.number;
        trancheParameters[_trancheNum].trancheAFixedRPB = _newTrARPB;
    }

    /**
     * @dev set redemption timeout
     * @param _blockNum timeout (in block numbers)
     */
    function setRedemptionTimeout(uint32 _blockNum) external onlyAdmins {
        redeemTimeout = _blockNum;
    }

    function addTrancheToProtocol(address _erc20Contract, string memory _nameA, string memory _symbolA, string memory _nameB, 
                string memory _symbolB, uint256 _fixedRpb, uint8 _cTokenDec, uint8 _underlyingDec) external onlyAdmins locked {
        require(tranchesDeployerAddress != address(0), "CProtocol: set tranche eth deployer");
        require(isCTokenAllowed(_erc20Contract), "CProtocol: cToken not allowed");

        trancheAddresses[trancheCounter].buyerCoinAddress = _erc20Contract;
        trancheAddresses[trancheCounter].dividendCoinAddress = cTokenContracts[_erc20Contract];
        trancheAddresses[trancheCounter].ATrancheAddress = 
                IJTranchesDeployer(tranchesDeployerAddress).deployNewTrancheATokens(_nameA, _symbolA, msg.sender);
        trancheAddresses[trancheCounter].BTrancheAddress = 
                IJTranchesDeployer(tranchesDeployerAddress).deployNewTrancheBTokens(_nameB, _symbolB, msg.sender); //, _initBSupply);
        

        trancheParameters[trancheCounter].cTokenDecimals = _cTokenDec;
        trancheParameters[trancheCounter].underlyingDecimals = _underlyingDec;
        trancheParameters[trancheCounter].trancheAFixedRPB = _fixedRpb;
        trancheParameters[trancheCounter].startingABlock = block.number;
        trancheParameters[trancheCounter].startingAPrice = getCompoundPrice(trancheCounter);

        trancheParameters[trancheCounter].redemptionPercentage = 9950;  //default value 99.5%

        emit TrancheAddedToProtocol(trancheCounter, trancheAddresses[trancheCounter].ATrancheAddress, trancheAddresses[trancheCounter].BTrancheAddress);

        trancheCounter = trancheCounter.add(1);
    } 

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
     * @dev get compound price for a single tranche
     * @param _trancheNum tranche number
     * @return compPrice compound current price
     */
    function getCompoundPrice(uint256 _trancheNum) public view returns (uint256 compPrice) {
        if (trancheAddresses[_trancheNum].buyerCoinAddress == address(0)) {
            compPrice = getCEthExchangeRate().mul(10 ** uint256(trancheParameters[_trancheNum].underlyingDecimals)).div(10 ** getMantissa(_trancheNum));
        } else {
            compPrice = getCTokenExchangeRate(trancheAddresses[_trancheNum].buyerCoinAddress).mul(10 ** uint256(trancheParameters[_trancheNum].underlyingDecimals)).div(10 ** getMantissa(_trancheNum));
        }
        return compPrice;
    }

    /**
     * @dev get Tranche A exchange rate
     * @param _trancheNum tranche number
     * @return tranche A token current price
     */
    function getTrancheAExchangeRate(uint256 _trancheNum) public view returns (uint256) {
        return trancheParameters[_trancheNum].currentTrancheAPrice;
    }

    /**
     * @dev get Tranche A exchange rate
     * @param _trancheNum tranche number
     * @return tranche A token current price
     */
    function setTrancheAExchangeRate(uint256 _trancheNum) public returns (uint256) {
        trancheParameters[_trancheNum].currentTrancheAPrice = (trancheParameters[_trancheNum].startingAPrice)
                .add( (trancheParameters[_trancheNum].trancheAFixedRPB).mul( (block.number).sub(trancheParameters[_trancheNum].startingABlock) ));
        return trancheParameters[_trancheNum].currentTrancheAPrice;
    }

    /**
     * @dev get Tranche A value
     * @param _trancheNum tranche number
     * @return tranche A value
     */
    function getTrAValue(uint256 _trancheNum) public view returns (uint256) {
        uint256 totASupply = IERC20(trancheAddresses[_trancheNum].ATrancheAddress).totalSupply();
        return totASupply.mul(getTrancheAExchangeRate(_trancheNum)).div(10 ** uint256(trancheParameters[_trancheNum].underlyingDecimals));
    }

    /**
     * @dev get Tranche B value
     * @param _trancheNum tranche number
     * @return tranche B value
     */
    function getTrBValue(uint256 _trancheNum) external view returns (uint256) {
        uint256 totProtValue = getTotalValue(_trancheNum);
        uint256 totTrAValue = getTrAValue(_trancheNum);
        if (totProtValue > totTrAValue) {
            return totProtValue.sub(totTrAValue);
        } else
            return 0;
    }

    /**
     * @dev get Tranche total value
     * @param _trancheNum tranche number
     * @return tranche total value
     */
    function getTotalValue(uint256 _trancheNum) public view returns (uint256) {
        uint256 compPrice = getCompoundPrice(_trancheNum);
        uint256 totProtSupply = getTokenBalance(trancheAddresses[_trancheNum].dividendCoinAddress);
        return totProtSupply.mul(compPrice).div(10 ** uint256(trancheParameters[_trancheNum].cTokenDecimals));
    }

    /**
     * @dev get Tranche B exchange rate
     * @param _trancheNum tranche number
     * @param _newAmount new amount entering tranche B
     * @param _adding true if adding, false if subtracting
     * @return tbPrice tranche B token current price
     */
    function getTrancheBExchangeRate(uint256 _trancheNum, uint256 _newAmount, bool _adding) public view returns (uint256 tbPrice) {
        // set amount of tokens to be minted via taToken price
        // Current tbDai price = (((cDai X cPrice)-(aSupply X taPrice)) / bSupply)
        // where: cDai = How much cDai we hold in the protocol
        // cPrice = cDai / Dai price
        // aSupply = Total number of taDai in protocol
        // taPrice = taDai / Dai price
        // bSupply = Total number of tbDai in protocol (minimum 1 to avoid divide by 0?)

        uint256 totBSupply = IERC20(trancheAddresses[_trancheNum].BTrancheAddress).totalSupply();

        uint256 totProtValue = getTotalValue(_trancheNum);
        uint256 totTrAValue = getTrAValue(_trancheNum);
        uint256 totTrBValue = totProtValue.sub(totTrAValue);
        if (totBSupply.add(_newAmount) > 0 && totProtValue > 0) {
            if (_adding) {
                tbPrice = (totTrBValue).mul(10 ** uint256(trancheParameters[_trancheNum].underlyingDecimals)).div((totBSupply.add(_newAmount)));
            } else {
                tbPrice = (totTrBValue).mul(10 ** uint256(trancheParameters[_trancheNum].underlyingDecimals)).div((totBSupply.sub(_newAmount)));
            }
        } else
            tbPrice = 10 ** uint256(trancheParameters[_trancheNum].underlyingDecimals);

        return tbPrice;
    }

    /**
     * @dev buy Tranche A Tokens
     * @param _trancheNum tranche number
     * @param _amount amount of stable coins sent by buyer
     */
    function buyTrancheAToken(uint256 _trancheNum, uint256 _amount) external payable locked {
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
        uint256 taAmount = _amount.mul(10 ** uint256(trancheParameters[_trancheNum].underlyingDecimals)).div(setTrancheAExchangeRate(_trancheNum));

        //Mint trancheA tokens and send them to msg.sender;
        IJTrancheTokens(trancheAddresses[_trancheNum].ATrancheAddress).mint(msg.sender, taAmount);
        lastActivity[msg.sender] = block.number;
        emit TrancheATokenMinted(_trancheNum, msg.sender, _amount, taAmount);
    }

    /**
     * @dev redeem Tranche A Tokens
     * @param _trancheNum tranche number
     * @param _amount amount of stable coins sent by buyer
     */
    function redeemTrancheAToken(uint256 _trancheNum, uint256 _amount) external locked {
        require((block.number).sub(lastActivity[msg.sender]) >= redeemTimeout, "JCompound: redeem timeout not expired on tranche B");
        // check approve
        require(IERC20(trancheAddresses[_trancheNum].ATrancheAddress).allowance(msg.sender, address(this)) >= _amount, "JCompound: allowance failed redeeming tranche A");
        //Transfer DAI from msg.sender to protocol;
        SafeERC20.safeTransferFrom(IERC20(trancheAddresses[_trancheNum].ATrancheAddress), msg.sender, address(this), _amount);

        uint256 oldBal;
        uint256 diffBal;
        uint256 userAmount;
        uint256 feesAmount;
        uint256 taAmount = _amount.mul(setTrancheAExchangeRate(_trancheNum)).div(10 ** uint256(trancheParameters[_trancheNum].underlyingDecimals));
        if (trancheAddresses[_trancheNum].buyerCoinAddress == address(0)) {
            // calculate taETH amount via cETH price
            oldBal = getEthBalance();
            require(redeemCEth(taAmount, false) == 0, "JCompound: incorrect answer from cEth");
            //newBal = getEthBalance();
            diffBal = getEthBalance().sub(oldBal);
            userAmount = diffBal.mul(trancheParameters[_trancheNum].redemptionPercentage).div(10000);
            TransferETHHelper.safeTransferETH(msg.sender, userAmount);
            if (diffBal != userAmount) {
                // transfer fees to JFeesCollector
                feesAmount = diffBal.sub(userAmount);
                TransferETHHelper.safeTransferETH(feesCollectorAddress, feesAmount);
            }   
        } else {
            // calculate taToken amount via cToken price
            oldBal = getTokenBalance(trancheAddresses[_trancheNum].buyerCoinAddress);
            require(redeemCErc20Tokens(trancheAddresses[_trancheNum].buyerCoinAddress, taAmount, false) == 0, "JCompound: incorrect answer from cToken");
            diffBal = getTokenBalance(trancheAddresses[_trancheNum].buyerCoinAddress).sub(oldBal);
            userAmount = diffBal.mul(trancheParameters[_trancheNum].redemptionPercentage).div(10000);
            SafeERC20.safeTransfer(IERC20(trancheAddresses[_trancheNum].buyerCoinAddress), msg.sender, userAmount);
            if (diffBal != userAmount) {
                // transfer fees to JFeesCollector
                feesAmount = diffBal.sub(userAmount);
                SafeERC20.safeTransfer(IERC20(trancheAddresses[_trancheNum].buyerCoinAddress), feesCollectorAddress, feesAmount);
            }
        }
        
        IJTrancheTokens(trancheAddresses[_trancheNum].ATrancheAddress).burn(_amount);
        lastActivity[msg.sender] = block.number;
        emit TrancheATokenBurned(_trancheNum, msg.sender, _amount, taAmount);
    }

    /**
     * @dev buy Tranche B Tokens
     * @param _trancheNum tranche number
     * @param _amount amount of stable coins sent by buyer
     */
    function buyTrancheBToken(uint256 _trancheNum, uint256 _amount) external payable locked {
        if (trancheAddresses[_trancheNum].buyerCoinAddress == address(0)) {
            _amount = msg.value;
            TransferETHHelper.safeTransferETH(address(this), _amount);
            // transfer ETH to Coompound receiving cETH
            cEthToken.mint{value: _amount}();
        } else {
            // check approve
            require(IERC20(trancheAddresses[_trancheNum].buyerCoinAddress).allowance(msg.sender, address(this)) >= _amount, "JCompound: allowance failed buying tranche B");
            //Transfer DAI from msg.sender to protocol;
            SafeERC20.safeTransferFrom(IERC20(trancheAddresses[_trancheNum].buyerCoinAddress), msg.sender, address(this), _amount);
            // transfer DAI to Couompound receiving cDai
            sendErc20ToCompound(trancheAddresses[_trancheNum].buyerCoinAddress, _amount);
        }
        // update tranche A price, compound price is updated for sure since there is a previous operation on cTokens
        setTrancheAExchangeRate(_trancheNum);
        // get cToken exchange rate from compound
        uint256 tbAmount = _amount.mul(10 ** uint256(trancheParameters[_trancheNum].underlyingDecimals)).div(getTrancheBExchangeRate(_trancheNum, _amount, true));

        //Mint trancheB tokens and send them to msg.sender;
        IJTrancheTokens(trancheAddresses[_trancheNum].BTrancheAddress).mint(msg.sender, tbAmount);
        lastActivity[msg.sender] = block.number;
        emit TrancheBTokenMinted(_trancheNum, msg.sender, _amount, tbAmount);
    }

    /**
     * @dev redeem Tranche B Tokens
     * @param _trancheNum tranche number
     * @param _amount amount of stable coins sent by buyer
     */
    function redeemTrancheBToken(uint256 _trancheNum, uint256 _amount) external locked {
        require((block.number).sub(lastActivity[msg.sender]) >= redeemTimeout, "JCompound: redeem timeout not expired on tranche B");
        // check approve
        require(IERC20(trancheAddresses[_trancheNum].BTrancheAddress).allowance(msg.sender, address(this)) >= _amount, "JCompound: allowance failed redeeming tranche B");
        //Transfer DAI from msg.sender to protocol;
        SafeERC20.safeTransferFrom(IERC20(trancheAddresses[_trancheNum].BTrancheAddress), msg.sender, address(this), _amount);

        uint256 oldBal;
        uint256 diffBal;
        uint256 userAmount;
        uint256 feesAmount;
        // update tranche A price, compound price cannot be updated, but tranche A value has to be updated 
        setTrancheAExchangeRate(_trancheNum);
        uint256 tbAmount = _amount.mul(getTrancheBExchangeRate(_trancheNum, 0, true)).div(10 ** uint256(trancheParameters[_trancheNum].underlyingDecimals));
        if (trancheAddresses[_trancheNum].buyerCoinAddress == address(0)){
            // calculate tbETH amount via cETH price
            oldBal = getEthBalance();
            require(redeemCEth(tbAmount, false) == 0, "JCompound: incorrect answer from cEth");
            diffBal = getEthBalance().sub(oldBal);
            userAmount = diffBal.mul(trancheParameters[_trancheNum].redemptionPercentage).div(10000);
            TransferETHHelper.safeTransferETH(msg.sender, userAmount);
            if (diffBal != userAmount) {
                // transfer fees to JFeesCollector
                feesAmount = diffBal.sub(userAmount);
                TransferETHHelper.safeTransferETH(feesCollectorAddress, feesAmount);
            }   
        } else {
            // calculate taToken amount via cToken price
            oldBal = getTokenBalance(trancheAddresses[_trancheNum].buyerCoinAddress);
            require(redeemCErc20Tokens(trancheAddresses[_trancheNum].buyerCoinAddress, tbAmount, false) == 0, "JCompound: incorrect answer from cToken");
            diffBal = getTokenBalance(trancheAddresses[_trancheNum].buyerCoinAddress);
            userAmount = diffBal.mul(trancheParameters[_trancheNum].redemptionPercentage).div(10000);
            SafeERC20.safeTransfer(IERC20(trancheAddresses[_trancheNum].buyerCoinAddress), msg.sender, userAmount);
            if (diffBal != userAmount) {
                // transfer fees to JFeesCollector
                feesAmount = diffBal.sub(userAmount);
                SafeERC20.safeTransfer(IERC20(trancheAddresses[_trancheNum].buyerCoinAddress), feesCollectorAddress, feesAmount);
            }   
        }
        
        IJTrancheTokens(trancheAddresses[_trancheNum].BTrancheAddress).burn(_amount);
        lastActivity[msg.sender] = block.number;
        emit TrancheBTokenBurned(_trancheNum, msg.sender, _amount, tbAmount);
    }

    /**
     * @dev redeem every cToken amount and send values to fees collector
     * @param _trancheNum tranche number
     * @param _cTokenAmount cToken amount to send to compound protocol
     */
    function redeemCTokenAmount(uint256 _trancheNum, uint256 _cTokenAmount) external onlyAdmins locked {
        uint256 oldBal;
        uint256 diffBal;
        if (trancheAddresses[_trancheNum].buyerCoinAddress == address(0)) {
            oldBal = getEthBalance();
            require(redeemCEth(_cTokenAmount, true) == 0, "JCompound: incorrect answer from cEth");
            diffBal = getEthBalance().sub(oldBal);
            TransferETHHelper.safeTransferETH(feesCollectorAddress, diffBal);
        } else {
            // calculate taToken amount via cToken price
            oldBal = getTokenBalance(trancheAddresses[_trancheNum].buyerCoinAddress);
            require(redeemCErc20Tokens(trancheAddresses[_trancheNum].buyerCoinAddress, _cTokenAmount, true) == 0, "JCompound: incorrect answer from cToken");
            diffBal = getTokenBalance(trancheAddresses[_trancheNum].buyerCoinAddress);
            SafeERC20.safeTransfer(IERC20(trancheAddresses[_trancheNum].buyerCoinAddress), feesCollectorAddress, diffBal);
        }
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