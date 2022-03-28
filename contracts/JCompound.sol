// SPDX-License-Identifier: MIT
/**
 * Created on 2021-02-11
 * @summary: Jibrel Compound Tranche Protocol
 * @author: Jibrel Team
 */
pragma solidity 0.8.10;

import "@openzeppelin/contracts-upgradeable/utils/math/SafeMathUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "./interfaces/IJAdminTools.sol";
import "./interfaces/IJTrancheTokens.sol";
import "./interfaces/IJTranchesDeployer.sol";
import "./interfaces/IJCompound.sol";
import "./interfaces/ICErc20.sol";
import "./interfaces/IComptroller.sol";
import "./JCompoundStorage.sol";
import "./TransferETHHelper.sol";


contract JCompound is OwnableUpgradeable, ReentrancyGuardUpgradeable, JCompoundStorageV2, IJCompound {
    using SafeMathUpgradeable for uint256;

    /**
     * @dev contract initializer
     * @param _adminTools price oracle address
     * @param _feesCollector fees collector contract address
     * @param _tranchesDepl tranches deployer contract address
     * @param _compTokenAddress COMP token contract address
     * @param _comptrollAddress comptroller contract address
     */
    function initialize(address _adminTools, 
            address _feesCollector, 
            address _tranchesDepl,
            address _compTokenAddress,
            address _comptrollAddress) external initializer() {
        OwnableUpgradeable.__Ownable_init();
        adminToolsAddress = _adminTools;
        feesCollectorAddress = _feesCollector;
        tranchesDeployerAddress = _tranchesDepl;
        compTokenAddress = _compTokenAddress;
        comptrollerAddress = _comptrollAddress;
        redeemTimeout = 3; //default
        totalBlocksPerYear = 2102400; // same number like in Compound protocol
    }

    /**
     * @dev set constants for JCompound
     * @param _trNum tranche number
     * @param _redemPerc redemption percentage (scaled by 1e4)
     * @param _redemTimeout redemption timeout, in blocks
     * @param _blocksPerYear blocks per year (compound set it to 2102400)
     */
    function setConstantsValues(uint256 _trNum, uint16 _redemPerc, uint32 _redemTimeout, uint256 _blocksPerYear) external onlyAdmins {
        trancheParameters[_trNum].redemptionPercentage = _redemPerc;
        redeemTimeout = _redemTimeout;
        totalBlocksPerYear = _blocksPerYear;
    }

    /**
     * @dev set eth gateway 
     * @param _ethGateway ethGateway address
     */
    function setETHGateway(address _ethGateway) external onlyAdmins {
        ethGateway = IETHGateway(_ethGateway);
    }

    /**
     * @dev admins modifiers
     */
    modifier onlyAdmins() {
        require(IJAdminTools(adminToolsAddress).isAdmin(msg.sender), "!AdminJC");
        _;
    }

    // This is needed to receive ETH
    fallback() external payable {}
    receive() external payable {}

    /**
     * @dev set new addresses for price oracle, fees collector and tranche deployer 
     * @param _adminTools price oracle address
     * @param _feesCollector fees collector contract address
     * @param _tranchesDepl tranches deployer contract address
     * @param _compTokenAddress COMP token contract address
     * @param _comptrollAddress comptroller contract address
     */
    function setNewEnvironment(address _adminTools, 
            address _feesCollector, 
            address _tranchesDepl,
            address _compTokenAddress,
            address _comptrollAddress) external onlyOwner {
        require((_adminTools != address(0)) && (_feesCollector != address(0)) && 
            (_tranchesDepl != address(0)) && (_comptrollAddress != address(0)) && (_compTokenAddress != address(0)), "ChkAddress");
        adminToolsAddress = _adminTools;
        feesCollectorAddress = _feesCollector;
        tranchesDeployerAddress = _tranchesDepl;
        compTokenAddress = _compTokenAddress;
        comptrollerAddress = _comptrollAddress;
    }

    /**
     * @dev set relationship between ethers and the corresponding Compound cETH contract
     * @param _cEtherContract compound token contract address (cETH contract, on Kovan: 0x41b5844f4680a8c38fbb695b7f9cfd1f64474a72)
     */
    function setCEtherContract(address _cEtherContract) external onlyAdmins {
        cEthToken = ICEth(_cEtherContract);
        cTokenContracts[address(0)] = _cEtherContract;
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
     * @dev get RPB from compound
     * @param _trancheNum tranche number
     * @return cToken compound supply RPB
     */
    function getCompoundSupplyRPB(uint256 _trancheNum) external view returns (uint256) {
        ICErc20 cToken = ICErc20(cTokenContracts[trancheAddresses[_trancheNum].buyerCoinAddress]);
        return cToken.supplyRatePerBlock();
    }

    /**
     * @dev set decimals for tranche tokens
     * @param _trancheNum tranche number
     * @param _cTokenDec cToken decimals
     * @param _underlyingDec underlying token decimals
     */
    function setDecimals(uint256 _trancheNum, uint8 _cTokenDec, uint8 _underlyingDec) external onlyAdmins {
        require((_cTokenDec <= 18) && (_underlyingDec <= 18), "Decs");
        trancheParameters[_trancheNum].cTokenDecimals = _cTokenDec;
        trancheParameters[_trancheNum].underlyingDecimals = _underlyingDec;
    }

    /**
     * @dev set tranche A fixed percentage (scaled by 1e18)
     * @param _trancheNum tranche number
     * @param _newTrAPercentage new tranche A fixed percentage (scaled by 1e18)
     */
    function setTrancheAFixedPercentage(uint256 _trancheNum, uint256 _newTrAPercentage) external onlyAdmins {
        trancheParameters[_trancheNum].trancheAFixedPercentage = _newTrAPercentage;
        trancheParameters[_trancheNum].storedTrancheAPrice = setTrancheAExchangeRate(_trancheNum);
    }

    /**
     * @dev get cToken stored exchange rate from compound contract
     * @param _cTokenAddress cToken address
     * @return exchRateMantissa exchange rate cToken mantissa
     */
    function getCTokenExchangeRate(address _cTokenAddress) public view returns (uint256 exchRateMantissa) {
        // Amount of current exchange rate from cToken to underlying
        return exchRateMantissa = ICErc20(_cTokenAddress).exchangeRateStored(); // it returns something like 210615675702828777787378059 (cDAI contract) or 209424757650257 (cUSDT contract)
    }

    /**
     * @dev get compound mantissa
     * @param _underDecs underlying decimals
     * @param _cTokenDecs cToken decimals
     * @return mantissa tranche mantissa (from 16 to 28 decimals)
     */
    function getMantissa(uint256 _underDecs, uint256 _cTokenDecs) public pure returns (uint256 mantissa) {
        mantissa = (uint256(_underDecs)).add(18).sub(uint256(_cTokenDecs));
        return mantissa;
    }

    /**
     * @dev get compound pure price for a single tranche
     * @param _cTokenAddress cToken address
     * @return compoundPrice compound current pure price
     */
    function getCompoundPurePrice(address _cTokenAddress) public view returns (uint256 compoundPrice) {
        compoundPrice = getCTokenExchangeRate(_cTokenAddress);
        return compoundPrice;
    }

     /**
     * @dev get compound price for a single tranche scaled by 1e18
     * @param _cTokenAddress cToken address
     * @param _underDecs underlying decimals
     * @param _cTokenDecs cToken decimalsr
     * @return compNormPrice compound current normalized price
     */
    function getCompoundPrice(address _cTokenAddress, uint256 _underDecs, uint256 _cTokenDecs) public view returns (uint256 compNormPrice) {
        compNormPrice = getCompoundPurePrice(_cTokenAddress);

        uint256 mantissa = getMantissa(_underDecs, _cTokenDecs);
        if (mantissa < 18) {
            compNormPrice = compNormPrice.mul(10 ** (uint256(18).sub(mantissa)));
        } else {
            compNormPrice = compNormPrice.div(10 ** (mantissa.sub(uint256(18))));
        }
        return compNormPrice;
    }

    /**
     * @dev add tranche in protocol
     * @param _erc20Contract token contract address (0x0000000000000000000000000000000000000000 if eth)
     * @param _nameA tranche A token name
     * @param _symbolA tranche A token symbol
     * @param _nameB tranche B token name
     * @param _symbolB tranche B token symbol
     * @param _fixPercentage tranche A percentage fixed compounded interest per year
     * @param _cTokenDec cToken decimals
     * @param _underlyingDec underlying token decimals
     */
    function addTrancheToProtocol(address _erc20Contract, string memory _nameA, string memory _symbolA, string memory _nameB, 
                string memory _symbolB, uint256 _fixPercentage, uint8 _cTokenDec, uint8 _underlyingDec) external onlyAdmins nonReentrant {
        require(tranchesDeployerAddress != address(0), "!TrDepl");
        require(isCTokenAllowed(_erc20Contract), "!Allow");

        trancheAddresses[tranchePairsCounter].buyerCoinAddress = _erc20Contract;
        trancheAddresses[tranchePairsCounter].cTokenAddress = cTokenContracts[_erc20Contract];
        // our tokens always with 18 decimals
        trancheAddresses[tranchePairsCounter].ATrancheAddress = 
                IJTranchesDeployer(tranchesDeployerAddress).deployNewTrancheATokens(_nameA, _symbolA, tranchePairsCounter);
        trancheAddresses[tranchePairsCounter].BTrancheAddress = 
                IJTranchesDeployer(tranchesDeployerAddress).deployNewTrancheBTokens(_nameB, _symbolB, tranchePairsCounter);
        
        trancheParameters[tranchePairsCounter].cTokenDecimals = _cTokenDec;
        trancheParameters[tranchePairsCounter].underlyingDecimals = _underlyingDec;
        trancheParameters[tranchePairsCounter].trancheAFixedPercentage = _fixPercentage;
        trancheParameters[tranchePairsCounter].trancheALastActionBlock = block.number;
        // if we would like to have always 18 decimals
        trancheParameters[tranchePairsCounter].storedTrancheAPrice = getCompoundPrice(cTokenContracts[_erc20Contract], _underlyingDec, _cTokenDec);

        trancheParameters[tranchePairsCounter].redemptionPercentage = 10000;  //default value 100%

        calcRPBFromPercentage(tranchePairsCounter); // initialize tranche A RPB

        emit TrancheAddedToProtocol(tranchePairsCounter, trancheAddresses[tranchePairsCounter].ATrancheAddress, trancheAddresses[tranchePairsCounter].BTrancheAddress);

        tranchePairsCounter = tranchePairsCounter.add(1);
    } 

    /**
     * @dev enables or disables tranche deposit (default: disabled)
     * @param _trancheNum tranche number
     * @param _enable true or false
     */
    function setTrancheDeposit(uint256 _trancheNum, bool _enable) external onlyAdmins {
        trancheDepositEnabled[_trancheNum] = _enable;
    }

    /**
     * @dev send an amount of tokens to corresponding compound contract (it takes tokens from this contract). Only allowed token should be sent
     * @param _erc20Contract token contract address
     * @param _numTokensToSupply token amount to be sent
     * @return mint result
     */
    function sendErc20ToCompound(address _erc20Contract, uint256 _numTokensToSupply) internal returns(uint256) {
        address cTokenAddress = cTokenContracts[_erc20Contract];
        require(cTokenAddress != address(0), "!Accept");

        IERC20Upgradeable underlying = IERC20Upgradeable(_erc20Contract);

        ICErc20 cToken = ICErc20(cTokenAddress);

        SafeERC20Upgradeable.safeApprove(underlying, cTokenAddress, _numTokensToSupply);
        require(underlying.allowance(address(this), cTokenAddress) >= _numTokensToSupply, "!AllowCToken");

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
        address cTokenAddress = cTokenContracts[_erc20Contract];
        require(cTokenAddress != address(0),  "!Accept");

        ICErc20 cToken = ICErc20(cTokenAddress);

        if (_redeemType) {
            // Retrieve your asset based on a cToken amount
            redeemResult = cToken.redeem(_amount);
        } else {
            // Retrieve your asset based on an amount of the asset
            redeemResult = cToken.redeemUnderlying(_amount);
        }
        return redeemResult;
    }

    /**
     * @dev get Tranche A exchange rate
     * @param _trancheNum tranche number
     * @return tranche A token stored price
     */
    function getTrancheAExchangeRate(uint256 _trancheNum) public view returns (uint256) {
        return trancheParameters[_trancheNum].storedTrancheAPrice;
    }

    /**
     * @dev get RPB for a given percentage (expressed in 1e18)
     * @param _trancheNum tranche number
     * @return RPB for a fixed percentage
     */
    function getTrancheACurrentRPB(uint256 _trancheNum) external view returns (uint256) {
        return trancheParameters[_trancheNum].trancheACurrentRPB;
    }

    /**
     * @dev set Tranche A exchange rate
     * @param _trancheNum tranche number
     * @return tranche A token stored price
     */
    function setTrancheAExchangeRate(uint256 _trancheNum) internal returns (uint256) {
        calcRPBFromPercentage(_trancheNum);
        uint256 deltaBlocks = (block.number).sub(trancheParameters[_trancheNum].trancheALastActionBlock);
        if (deltaBlocks > 0) {
            uint256 deltaPrice = (trancheParameters[_trancheNum].trancheACurrentRPB).mul(deltaBlocks);
            trancheParameters[_trancheNum].storedTrancheAPrice = (trancheParameters[_trancheNum].storedTrancheAPrice).add(deltaPrice);
            trancheParameters[_trancheNum].trancheALastActionBlock = block.number;
        }
        return trancheParameters[_trancheNum].storedTrancheAPrice;
    }

    /**
     * @dev get Tranche A exchange rate (tokens with 18 decimals)
     * @param _trancheNum tranche number
     * @return tranche A token current price
     */
    function calcRPBFromPercentage(uint256 _trancheNum) public returns (uint256) {
        // if normalized price in tranche A price, everything should be scaled to 1e18 
        trancheParameters[_trancheNum].trancheACurrentRPB = trancheParameters[_trancheNum].storedTrancheAPrice
                        .mul(trancheParameters[_trancheNum].trancheAFixedPercentage).div(totalBlocksPerYear).div(1e18);
        // trancheParameters[_trancheNum].trancheACurrentRPB = (trancheParameters[_trancheNum].trancheAFixedPercentage).div(totalBlocksPerYear).div(1e18);
        return trancheParameters[_trancheNum].trancheACurrentRPB;
    }

    /**
     * @dev get Tranche A value in underlying tokens
     * @param _trancheNum tranche number
     * @return trANormValue tranche A value in underlying tokens
     */
    function getTrAValue(uint256 _trancheNum) public view returns (uint256 trANormValue) {
        uint256 totASupply = IERC20Upgradeable(trancheAddresses[_trancheNum].ATrancheAddress).totalSupply();
        uint256 diffDec = uint256(18).sub(uint256(trancheParameters[_trancheNum].underlyingDecimals));
        uint256 storedAPrice = trancheParameters[_trancheNum].storedTrancheAPrice;
        trANormValue = totASupply.mul(storedAPrice).div(1e18).div(10 ** diffDec);
        return trANormValue;
    }

    /**
     * @dev get Tranche B value in underlying tokens
     * @param _trancheNum tranche number
     * @return tranche B valuein underlying tokens
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
     * @dev get Tranche total value in underlying tokens
     * @param _trancheNum tranche number
     * @return tranche total value in underlying tokens
     */
    function getTotalValue(uint256 _trancheNum) public view returns (uint256) {
        address cTokenAddress = trancheAddresses[_trancheNum].cTokenAddress;
        uint256 compNormPrice = getCompoundPurePrice(cTokenAddress);
        uint256 totProtSupply = getTokenBalance(cTokenAddress);
        return totProtSupply.mul(compNormPrice).div(1e18);
    }

    /**
     * @dev get Tranche B exchange rate
     * @param _trancheNum tranche number
     * @return tbPrice tranche B token current price
     */
    function getTrancheBExchangeRate(uint256 _trancheNum) public view returns (uint256 tbPrice) {
        // set amount of tokens to be minted via taToken price
        // Current tbDai price = (((cDai X cPrice)-(aSupply X taPrice)) / bSupply)
        // where: cDai = How much cDai we hold in the protocol
        // cPrice = cDai / Dai price
        // aSupply = Total number of taDai in protocol
        // taPrice = taDai / Dai price
        // bSupply = Total number of tbDai in protocol

        uint256 totBSupply = IERC20Upgradeable(trancheAddresses[_trancheNum].BTrancheAddress).totalSupply(); // 18 decimals
        if (totBSupply > 0) {
            uint256 totProtValue = getTotalValue(_trancheNum); //underlying token decimals
            uint256 totTrAValue = getTrAValue(_trancheNum); //underlying token decimals
            uint256 totTrBValue = totProtValue.sub(totTrAValue); //underlying token decimals
            // if normalized price in tranche A price, everything should be scaled to 1e18 
            uint256 diffDec = uint256(18).sub(uint256(trancheParameters[_trancheNum].underlyingDecimals));
            totTrBValue = totTrBValue.mul(10 ** diffDec);
            tbPrice = totTrBValue.mul(1e18).div(totBSupply);
        } else {
            tbPrice = uint256(1e18);
        }
        return tbPrice;
    }

    /**
     * @dev set staking details for tranche A holders, with number, amount and time
     * @param _trancheNum tranche number
     * @param _account user's account
     * @param _stkNum staking detail counter
     * @param _amount amount of tranche A tokens
     * @param _time time to be considered the deposit
     */
    function setTrAStakingDetails(uint256 _trancheNum, address _account, uint256 _stkNum, uint256 _amount, uint256 _time) external onlyAdmins {
        stakeCounterTrA[_account][_trancheNum] = _stkNum;
        StakingDetails storage details = stakingDetailsTrancheA[_account][_trancheNum][_stkNum];
        details.startTime = _time;
        details.amount = _amount;
    }

    /**
     * @dev buy Tranche A Tokens
     * @param _trancheNum tranche number
     * @param _amount amount of stable coins sent by buyer
     */
    function buyTrancheAToken(uint256 _trancheNum, uint256 _amount) external payable nonReentrant {
        require(trancheDepositEnabled[_trancheNum], "!Deposit");
        address cTokenAddress = trancheAddresses[_trancheNum].cTokenAddress;
        address underTokenAddress = trancheAddresses[_trancheNum].buyerCoinAddress;
        uint256 prevCompTokenBalance = getTokenBalance(cTokenAddress);
        uint256 sentAmount = _amount;
        if (underTokenAddress == address(0)){
            require(msg.value == _amount, "!Amount");
            //Transfer ETH from msg.sender to protocol;
            TransferETHHelper.safeTransferETH(address(this), _amount);
            // transfer ETH to Compound receiving cETH
            cEthToken.mint{value: _amount}();
        } else {
            // check approve
            require(IERC20Upgradeable(underTokenAddress).allowance(msg.sender, address(this)) >= _amount, "!Allowance");
            //Transfer DAI from msg.sender to protocol;
            SafeERC20Upgradeable.safeTransferFrom(IERC20Upgradeable(underTokenAddress), msg.sender, address(this), _amount);
            // transfer DAI to Compound receiving cDai
            sendErc20ToCompound(underTokenAddress, _amount);
        }
        uint256 newCompTokenBalance = getTokenBalance(cTokenAddress);
        // set amount of tokens to be minted calculate taToken amount via taToken price
        setTrancheAExchangeRate(_trancheNum);
        uint256 taAmount;
        if (newCompTokenBalance > prevCompTokenBalance) {
            // if normalized price in tranche A price, everything should be scaled to 1e18 
            uint256 diffDec = uint256(18).sub(uint256(trancheParameters[_trancheNum].underlyingDecimals));
            uint256 normAmount = sentAmount.mul(10 ** diffDec);
            taAmount = normAmount.mul(1e18).div(trancheParameters[_trancheNum].storedTrancheAPrice);
            //Mint trancheA tokens and send them to msg.sender and notify to incentive controller BEFORE totalSupply updates
            IJTrancheTokens(trancheAddresses[_trancheNum].ATrancheAddress).mint(msg.sender, taAmount);
        } else {
            taAmount = 0;
        }

        lastActivity[msg.sender] = block.number;
        emit TrancheATokenMinted(_trancheNum, msg.sender, _amount, taAmount);
    }

    /**
     * @dev redeem Tranche A Tokens
     * @param _trancheNum tranche number
     * @param _amount amount of stable coins sent by buyer
     */
    function redeemTrancheAToken(uint256 _trancheNum, uint256 _amount) external nonReentrant {
        require((block.number).sub(lastActivity[msg.sender]) >= redeemTimeout, "!Timeout");
        // check approve
        address aTrancheAddress = trancheAddresses[_trancheNum].ATrancheAddress;
        require(IERC20Upgradeable(aTrancheAddress).allowance(msg.sender, address(this)) >= _amount, "!Allowance");
        //Transfer DAI from msg.sender to protocol;
        SafeERC20Upgradeable.safeTransferFrom(IERC20Upgradeable(aTrancheAddress), msg.sender, address(this), _amount);

        uint256 oldBal;
        uint256 diffBal;
        uint256 userAmount;
        uint256 feesAmount;
        setTrancheAExchangeRate(_trancheNum);
        // if normalized price in tranche A price, everything should be scaled to 1e18 
        uint256 taAmount = _amount.mul(trancheParameters[_trancheNum].storedTrancheAPrice).div(1e18);
        uint256 diffDec = uint256(18).sub(uint256(trancheParameters[_trancheNum].underlyingDecimals));
        uint256 normAmount = taAmount.div(10 ** diffDec);

        address cTokenAddress = trancheAddresses[_trancheNum].cTokenAddress;
        uint256 cTokenBal = getTokenBalance(cTokenAddress); // needed for emergency
        address underTokenAddress = trancheAddresses[_trancheNum].buyerCoinAddress;
        uint256 redeemPerc = uint256(trancheParameters[_trancheNum].redemptionPercentage);
        if (underTokenAddress == address(0)) {
            SafeERC20Upgradeable.safeTransfer(IERC20Upgradeable(cTokenAddress), address(ethGateway), cTokenBal);
            // calculate taAmount via cETH price
            oldBal = getEthBalance();
            ethGateway.withdrawETH(normAmount, address(this), false, cTokenBal);
            diffBal = getEthBalance().sub(oldBal);
            userAmount = diffBal.mul(redeemPerc).div(PERCENT_DIVIDER);
            TransferETHHelper.safeTransferETH(msg.sender, userAmount);
            if (diffBal != userAmount) {
                // transfer fees to JFeesCollector
                feesAmount = diffBal.sub(userAmount);
                TransferETHHelper.safeTransferETH(feesCollectorAddress, feesAmount);
            }   
        } else {
            uint256 totAmount = normAmount;
            // calculate taAmount via cToken price
            oldBal = getTokenBalance(underTokenAddress);
            uint256 compoundRetCode = redeemCErc20Tokens(underTokenAddress, totAmount, false);
            if(compoundRetCode != 0) {
                // emergency: send all ctokens balance to compound 
                redeemCErc20Tokens(underTokenAddress, cTokenBal, true);
            }
            diffBal = getTokenBalance(underTokenAddress).sub(oldBal);
            userAmount = diffBal.mul(redeemPerc).div(PERCENT_DIVIDER);
            SafeERC20Upgradeable.safeTransfer(IERC20Upgradeable(underTokenAddress), msg.sender, userAmount);
            if (diffBal != userAmount) {
                // transfer fees to JFeesCollector
                feesAmount = diffBal.sub(userAmount);
                SafeERC20Upgradeable.safeTransfer(IERC20Upgradeable(underTokenAddress), feesCollectorAddress, feesAmount);
            }
        }
    
        IJTrancheTokens(aTrancheAddress).burn(_amount);

        lastActivity[msg.sender] = block.number;
        emit TrancheATokenRedemption(_trancheNum, msg.sender, 0, userAmount, feesAmount);
    }

    /**
     * @dev buy Tranche B Tokens
     * @param _trancheNum tranche number
     * @param _amount amount of stable coins sent by buyer
     */
    function buyTrancheBToken(uint256 _trancheNum, uint256 _amount) external payable nonReentrant {
        require(trancheDepositEnabled[_trancheNum], "!Deposit");
        address cTokenAddress = trancheAddresses[_trancheNum].cTokenAddress;
        address underTokenAddress = trancheAddresses[_trancheNum].buyerCoinAddress;
        uint256 prevCompTokenBalance = getTokenBalance(cTokenAddress);
        // if eth, ignore _amount parameter and set it to msg.value
        if (trancheAddresses[_trancheNum].buyerCoinAddress == address(0)) {
            require(msg.value == _amount, "!Amount");
            //_amount = msg.value;
        }
        // refresh value for tranche A
        setTrancheAExchangeRate(_trancheNum);
        // get tranche B exchange rate
        // if normalized price in tranche B price, everything should be scaled to 1e18 
        uint256 diffDec = uint256(18).sub(uint256(trancheParameters[_trancheNum].underlyingDecimals));
        uint256 normAmount = _amount.mul(10 ** diffDec);
        uint256 tbAmount = normAmount.mul(1e18).div(getTrancheBExchangeRate(_trancheNum));
        if (underTokenAddress == address(0)) {
            TransferETHHelper.safeTransferETH(address(this), _amount);
            // transfer ETH to Compound receiving cETH
            cEthToken.mint{value: _amount}();
        } else {
            // check approve
            require(IERC20Upgradeable(underTokenAddress).allowance(msg.sender, address(this)) >= _amount, "!Allowance");
            //Transfer DAI from msg.sender to protocol;
            SafeERC20Upgradeable.safeTransferFrom(IERC20Upgradeable(underTokenAddress), msg.sender, address(this), _amount);
            // transfer DAI to Couompound receiving cDai
            sendErc20ToCompound(underTokenAddress, _amount);
        }
        uint256 newCompTokenBalance = getTokenBalance(cTokenAddress);
        if (newCompTokenBalance > prevCompTokenBalance) {
            //Mint trancheB tokens and send them to msg.sender and notify to incentive controller BEFORE totalSupply updates
            IJTrancheTokens(trancheAddresses[_trancheNum].BTrancheAddress).mint(msg.sender, tbAmount);
        } else 
            tbAmount = 0;

        lastActivity[msg.sender] = block.number;
        emit TrancheBTokenMinted(_trancheNum, msg.sender, _amount, tbAmount);
    }

    /**
     * @dev redeem Tranche B Tokens
     * @param _trancheNum tranche number
     * @param _amount amount of stable coins sent by buyer
     */
    function redeemTrancheBToken(uint256 _trancheNum, uint256 _amount) external nonReentrant {
        require((block.number).sub(lastActivity[msg.sender]) >= redeemTimeout, "!Timeout");
        // check approve
        address bTrancheAddress = trancheAddresses[_trancheNum].BTrancheAddress;
        require(IERC20Upgradeable(bTrancheAddress).allowance(msg.sender, address(this)) >= _amount, "!Allowance");
        //Transfer DAI from msg.sender to protocol;
        SafeERC20Upgradeable.safeTransferFrom(IERC20Upgradeable(bTrancheAddress), msg.sender, address(this), _amount);

        uint256 oldBal;
        uint256 diffBal;
        uint256 userAmount;
        uint256 feesAmount;
        // refresh value for tranche A
        setTrancheAExchangeRate(_trancheNum);
        // get tranche B exchange rate
        // if normalized price in tranche B price, everything should be scaled to 1e18 
        uint256 tbAmount = _amount.mul(getTrancheBExchangeRate(_trancheNum)).div(1e18);
        uint256 diffDec = uint256(18).sub(uint256(trancheParameters[_trancheNum].underlyingDecimals));
        uint256 normAmount = tbAmount.div(10 ** diffDec);

        address cTokenAddress = trancheAddresses[_trancheNum].cTokenAddress;
        uint256 cTokenBal = getTokenBalance(cTokenAddress); // needed for emergency
        address underTokenAddress = trancheAddresses[_trancheNum].buyerCoinAddress;
        uint256 redeemPerc = uint256(trancheParameters[_trancheNum].redemptionPercentage);
        if (underTokenAddress == address(0)){
            SafeERC20Upgradeable.safeTransfer(IERC20Upgradeable(cTokenAddress), address(ethGateway), cTokenBal);
            // calculate tbETH amount via cETH price
            oldBal = getEthBalance();
            ethGateway.withdrawETH(normAmount, address(this), false, cTokenBal);
            diffBal = getEthBalance().sub(oldBal);
            userAmount = diffBal.mul(redeemPerc).div(PERCENT_DIVIDER);
            TransferETHHelper.safeTransferETH(msg.sender, userAmount);
            if (diffBal != userAmount) {
                // transfer fees to JFeesCollector
                feesAmount = diffBal.sub(userAmount);
                TransferETHHelper.safeTransferETH(feesCollectorAddress, feesAmount);
            }   
        } else {
            // calculate taToken amount via cToken price
            oldBal = getTokenBalance(underTokenAddress);
            require(redeemCErc20Tokens(underTokenAddress, normAmount, false) == 0, "!cTokenAnswer");
            // require(compRetCode == 0, "!cTokenAnswer");
            diffBal = getTokenBalance(underTokenAddress);
            userAmount = diffBal.mul(redeemPerc).div(PERCENT_DIVIDER);
            SafeERC20Upgradeable.safeTransfer(IERC20Upgradeable(underTokenAddress), msg.sender, userAmount);
            if (diffBal != userAmount) {
                // transfer fees to JFeesCollector
                feesAmount = diffBal.sub(userAmount);
                SafeERC20Upgradeable.safeTransfer(IERC20Upgradeable(underTokenAddress), feesCollectorAddress, feesAmount);
            }   
        }

        IJTrancheTokens(bTrancheAddress).burn(_amount);

        lastActivity[msg.sender] = block.number;
        emit TrancheBTokenRedemption(_trancheNum, msg.sender, 0, userAmount, feesAmount);
    }

    /**
     * @dev redeem every cToken amount and send values to fees collector
     * @param _trancheNum tranche number
     * @param _cTokenAmount cToken amount to send to compound protocol
     */
    function redeemCTokenAmount(uint256 _trancheNum, uint256 _cTokenAmount) external onlyAdmins nonReentrant {
        uint256 oldBal;
        uint256 diffBal;
        address underTokenAddress = trancheAddresses[_trancheNum].buyerCoinAddress;
        uint256 cTokenBal = getTokenBalance(trancheAddresses[_trancheNum].cTokenAddress); // needed for emergency
        if (underTokenAddress == address(0)) {
            oldBal = getEthBalance();
            ethGateway.withdrawETH(_cTokenAmount, address(this), true, cTokenBal);
            diffBal = getEthBalance().sub(oldBal);
            TransferETHHelper.safeTransferETH(feesCollectorAddress, diffBal);
        } else {
            // calculate taToken amount via cToken price
            oldBal = getTokenBalance(underTokenAddress);
            require(redeemCErc20Tokens(underTokenAddress, _cTokenAmount, true) == 0, "!cTokenAnswer");
            // address cToken = cTokenContracts[trancheAddresses[_trancheNum].buyerCoinAddress];
            // require(compRetCode == 0, "!cTokenAnswer");
            diffBal = getTokenBalance(underTokenAddress);
            SafeERC20Upgradeable.safeTransfer(IERC20Upgradeable(underTokenAddress), feesCollectorAddress, diffBal);
        }
    }

    /**
     * @dev get every token balance in this contract
     * @param _tokenContract token contract address
     */
    function getTokenBalance(address _tokenContract) public view returns (uint256) {
        return IERC20Upgradeable(_tokenContract).balanceOf(address(this));
    }

    /**
     * @dev get eth balance on this contract
     */
    function getEthBalance() public view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev transfer tokens in this contract to fees collector contract
     * @param _tokenContract token contract address
     * @param _amount token amount to be transferred 
     */
    function transferTokenToFeesCollector(address _tokenContract, uint256 _amount) external onlyAdmins {
        SafeERC20Upgradeable.safeTransfer(IERC20Upgradeable(_tokenContract), feesCollectorAddress, _amount);
    }

    /**
     * @dev transfer ethers in this contract to fees collector contract
     * @param _amount ethers amount to be transferred 
     */
    function withdrawEthToFeesCollector(uint256 _amount) external onlyAdmins {
        TransferETHHelper.safeTransferETH(feesCollectorAddress, _amount);
    }

    /**
     * @dev get total accrued Comp token from all market in comptroller
     * @return comp amount accrued
     */
    function getTotalCompAccrued() public view onlyAdmins returns (uint256) {
        return IComptroller(comptrollerAddress).compAccrued(address(this));
    }

    /**
     * @dev claim total accrued Comp token from all market in comptroller and transfer the amount to a receiver address
     * @param _receiver destination address
     */
    function claimTotalCompAccruedToReceiver(address _receiver) external onlyAdmins nonReentrant {
        uint256 totAccruedAmount = getTotalCompAccrued();
        if (totAccruedAmount > 0) {
            IComptroller(comptrollerAddress).claimComp(address(this));
            uint256 amount = IERC20Upgradeable(compTokenAddress).balanceOf(address(this));
            SafeERC20Upgradeable.safeTransfer(IERC20Upgradeable(compTokenAddress), _receiver, amount);
        }
    }

    /**
     * @dev emergency transfer tokens to a recipient
     * @param _trNum tranche number
     * @param _recipient destination address
     */
    function emergencyMigrateCTokens(uint256 _trNum, address _recipient) external onlyAdmins {
        require(_recipient != address(0), "!Allowed");
        require(_trNum < tranchePairsCounter, "TrTooHi");
        address cTokenAddress = trancheAddresses[_trNum].cTokenAddress;
        uint256 bal = getTokenBalance(cTokenAddress);
        SafeERC20Upgradeable.safeTransfer(IERC20Upgradeable(cTokenAddress), _recipient, bal);
    }

}