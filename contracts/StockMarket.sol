// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./TestUSDC.sol";
import "./StockToken.sol";

/// @title StockMarket — on-chain vault market maker for testnet tokenized stocks.
/// @notice Prices are set by an off-chain oracle (the Yuerta agent bot) from public
///         stock market data. 0.3% fee per trade accrues to the market. Testnet only.
contract StockMarket is Ownable {
    TestUSDC public immutable tusdc;
    StockToken[8] public stocks;
    // stock id: 0 AAPL, 1 NVDA, 2 MSFT, 3 TSLA, 4 AMZN, 5 GOOGL, 6 META, 7 AMD
    string[8] public symbols;

    uint256 public constant FEE_BPS = 30; // 0.3%
    uint256 public constant MAX_PRICE_AGE = 48 hours;

    address public oracle;
    address public agent;

    mapping(uint8 => uint256) public price; // USD, 8 decimals
    mapping(uint8 => uint256) public priceUpdatedAt;

    uint256 public totalVolumeUsd; // 6 decimals (tUSDC units)
    uint256 public tradeCount;

    event PriceUpdated(uint8 indexed id, uint256 price, uint256 updatedAt);
    event Trade(address indexed user, uint8 indexed id, bool indexed isBuy, uint256 inAmount, uint256 outAmount, uint256 price);
    event AgentTrade(uint8 indexed id, bool indexed isBuy, uint256 inAmount, uint256 outAmount, uint256 price, string reason);

    constructor(address tusdc_, address[8] memory stockAddrs_, string[8] memory symbols_) Ownable(msg.sender) {
        tusdc = TestUSDC(tusdc_);
        for (uint8 i = 0; i < 8; i++) {
            stocks[i] = StockToken(stockAddrs_[i]);
            symbols[i] = symbols_[i];
        }
        oracle = msg.sender;
        agent = msg.sender;
    }

    function setOracle(address oracle_) external onlyOwner {
        oracle = oracle_;
    }

    function setAgent(address agent_) external onlyOwner {
        agent = agent_;
    }

    function setPrice(uint8 id, uint256 priceUsd) external {
        require(msg.sender == oracle, "only oracle");
        require(id < 8, "bad id");
        require(priceUsd > 0, "bad price");
        price[id] = priceUsd;
        priceUpdatedAt[id] = block.timestamp;
        emit PriceUpdated(id, priceUsd, block.timestamp);
    }

    function setPrices(uint8[] calldata ids, uint256[] calldata prices) external {
        require(msg.sender == oracle, "only oracle");
        require(ids.length == prices.length, "length mismatch");
        for (uint256 i = 0; i < ids.length; i++) {
            require(ids[i] < 8 && prices[i] > 0, "bad input");
            price[ids[i]] = prices[i];
            priceUpdatedAt[ids[i]] = block.timestamp;
            emit PriceUpdated(ids[i], prices[i], block.timestamp);
        }
    }

    function _fresh(uint8 id) internal view {
        require(price[id] > 0, "no price");
        require(block.timestamp - priceUpdatedAt[id] <= MAX_PRICE_AGE, "stale price");
    }

    /// @notice Buy stock tokens with tUSDC. Caller must approve tUSDC first.
    function buy(uint8 id, uint256 usdcAmount) external {
        require(id < 8, "bad id");
        _fresh(id);
        require(usdcAmount > 0, "bad amount");
        uint256 p = price[id];
        // stockOut (8dp) = usdcAmount(6dp) * 1e10 / price(8dp), minus fee
        uint256 stockOut = (usdcAmount * 1e10 / p) * (10000 - FEE_BPS) / 10000;
        require(stockOut > 0, "too small");
        require(tusdc.transferFrom(msg.sender, address(this), usdcAmount), "tUSDC in failed");
        stocks[id].mint(msg.sender, stockOut);
        totalVolumeUsd += usdcAmount;
        tradeCount++;
        emit Trade(msg.sender, id, true, usdcAmount, stockOut, p);
    }

    /// @notice Sell stock tokens for tUSDC. Caller must approve stock tokens first.
    function sell(uint8 id, uint256 stockAmount) external {
        require(id < 8, "bad id");
        _fresh(id);
        require(stockAmount > 0, "bad amount");
        uint256 p = price[id];
        // usdcOut (6dp) = stockAmount(8dp) * price(8dp) / 1e10, minus fee
        uint256 usdcOut = (stockAmount * p / 1e10) * (10000 - FEE_BPS) / 10000;
        require(usdcOut > 0, "too small");
        require(tusdc.balanceOf(address(this)) >= usdcOut, "market low on tUSDC");
        stocks[id].burn(msg.sender, stockAmount);
        require(tusdc.transfer(msg.sender, usdcOut), "tUSDC out failed");
        totalVolumeUsd += usdcOut;
        tradeCount++;
        emit Trade(msg.sender, id, false, stockAmount, usdcOut, p);
    }

    /// @notice The AI agent's own trade, with its reasoning published on-chain.
    function agentTrade(uint8 id, bool isBuy, uint256 amount, string calldata reason) external {
        require(msg.sender == agent, "only agent");
        require(id < 8, "bad id");
        _fresh(id);
        uint256 p = price[id];
        if (isBuy) {
            uint256 stockOut = (amount * 1e10 / p) * (10000 - FEE_BPS) / 10000;
            require(stockOut > 0, "too small");
            require(tusdc.transferFrom(msg.sender, address(this), amount), "tUSDC in failed");
            stocks[id].mint(msg.sender, stockOut);
            totalVolumeUsd += amount;
            tradeCount++;
            emit AgentTrade(id, true, amount, stockOut, p, reason);
        } else {
            uint256 usdcOut = (amount * p / 1e10) * (10000 - FEE_BPS) / 10000;
            require(usdcOut > 0, "too small");
            require(tusdc.balanceOf(address(this)) >= usdcOut, "market low on tUSDC");
            stocks[id].burn(msg.sender, amount);
            require(tusdc.transfer(msg.sender, usdcOut), "tUSDC out failed");
            totalVolumeUsd += usdcOut;
            tradeCount++;
            emit AgentTrade(id, false, amount, usdcOut, p, reason);
        }
    }
}
