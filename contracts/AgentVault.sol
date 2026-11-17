// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./TestUSDC.sol";
import "./StockToken.sol";
import "./StockMarket.sol";

/// @title AgentVault — copy-trading vault. Deposit tUSDC, the AI agent trades it.
/// @notice Shares are 6 decimals (1 share = $1 at inception). Testnet only, no real value.
contract AgentVault is ERC20, Ownable {
    TestUSDC public immutable tusdc;
    StockMarket public immutable market;
    address public agent;

    event Deposit(address indexed user, uint256 usdcIn, uint256 sharesOut);
    event Withdraw(address indexed user, uint256 sharesIn, uint256 usdcOut);
    event VaultTrade(uint8 indexed id, bool indexed isBuy, uint256 inAmount, uint256 outAmount, uint256 price, string reason);

    constructor(address tusdc_, address market_) ERC20("Yuerta Vault Share", "yVAULT") Ownable(msg.sender) {
        tusdc = TestUSDC(tusdc_);
        market = StockMarket(market_);
        agent = msg.sender;
    }

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function setAgent(address agent_) external onlyOwner {
        agent = agent_;
    }

    /// @notice Total assets in tUSDC units (6dp): cash + stocks at oracle prices.
    function totalAssets() public view returns (uint256) {
        uint256 assets = tusdc.balanceOf(address(this));
        for (uint8 i = 0; i < 8; i++) {
            uint256 bal = market.stocks(i).balanceOf(address(this));
            if (bal > 0) {
                uint256 p = market.price(i);
                // p is 0 if never set
                if (p > 0) assets += (bal * p) / 1e10;
            }
        }
        return assets;
    }

    function navPerShare() public view returns (uint256) {
        if (totalSupply() == 0) return 1e6;
        return (totalAssets() * 1e6) / totalSupply();
    }

    function deposit(uint256 usdcAmount) external {
        require(usdcAmount > 0, "bad amount");
        uint256 shares;
        uint256 supply = totalSupply();
        if (supply == 0) {
            shares = usdcAmount;
        } else {
            uint256 assets = totalAssets();
            require(assets > 0, "no assets");
            shares = (usdcAmount * supply) / assets;
        }
        require(shares > 0, "too small");
        require(tusdc.transferFrom(msg.sender, address(this), usdcAmount), "tUSDC in failed");
        _mint(msg.sender, shares);
        emit Deposit(msg.sender, usdcAmount, shares);
    }

    function withdraw(uint256 shares) external {
        require(shares > 0, "bad amount");
        uint256 supply = totalSupply();
        uint256 assets = totalAssets();
        uint256 usdcOut = (shares * assets) / supply;
        require(usdcOut > 0, "too small");
        _burn(msg.sender, shares);
        require(tusdc.transfer(msg.sender, usdcOut), "tUSDC out failed");
        emit Withdraw(msg.sender, shares, usdcOut);
    }

    function agentBuy(uint8 id, uint256 usdcAmount, string calldata reason) external {
        require(msg.sender == agent, "only agent");
        require(tusdc.approve(address(market), usdcAmount), "approve failed");
        uint256 before = market.stocks(id).balanceOf(address(this));
        market.buy(id, usdcAmount);
        uint256 got = market.stocks(id).balanceOf(address(this)) - before;
        uint256 p = market.price(id);
        emit VaultTrade(id, true, usdcAmount, got, p, reason);
    }

    function agentSell(uint8 id, uint256 stockAmount, string calldata reason) external {
        require(msg.sender == agent, "only agent");
        require(market.stocks(id).approve(address(market), stockAmount), "approve failed");
        uint256 before = tusdc.balanceOf(address(this));
        market.sell(id, stockAmount);
        uint256 got = tusdc.balanceOf(address(this)) - before;
        uint256 p = market.price(id);
        emit VaultTrade(id, false, stockAmount, got, p, reason);
    }
}
