// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title StockToken — a TESTNET stand-in for a tokenized stock (e.g. sAAPL mirrors AAPL).
/// @notice NOT a real security. No rights in any underlying company. Mintable only by the StockMarket.
contract StockToken is ERC20, Ownable {
    address public market;

    event MarketSet(address indexed market);

    constructor(string memory name_, string memory symbol_) ERC20(name_, symbol_) Ownable(msg.sender) {}

    function decimals() public pure override returns (uint8) {
        return 8;
    }

    function setMarket(address market_) external onlyOwner {
        market = market_;
        emit MarketSet(market_);
    }

    function mint(address to, uint256 amount) external {
        require(msg.sender == market, "only market");
        _mint(to, amount);
    }

    function burn(address from, uint256 amount) external {
        require(msg.sender == market, "only market");
        _burn(from, amount);
    }
}
