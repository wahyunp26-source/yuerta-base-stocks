// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title TestUSDC — free testnet USDC for the Yuerta Stock Agent league.
/// @notice Anyone can claim 10,000 tUSDC once per 24h. No real value. Base Sepolia only.
contract TestUSDC is ERC20, Ownable {
    uint256 public constant CLAIM_AMOUNT = 10_000 * 1e6;
    uint256 public constant CLAIM_COOLDOWN = 24 hours;

    mapping(address => uint256) public lastClaim;

    event Claim(address indexed user, uint256 amount);

    constructor() ERC20("Test USDC", "tUSDC") Ownable(msg.sender) {}

    function decimals() public pure override returns (uint8) {
        return 6;
    }

    function claim() external {
        require(block.timestamp - lastClaim[msg.sender] >= CLAIM_COOLDOWN, "claim cooldown");
        lastClaim[msg.sender] = block.timestamp;
        _mint(msg.sender, CLAIM_AMOUNT);
        emit Claim(msg.sender, CLAIM_AMOUNT);
    }

    /// @notice Owner-only emergency mint (e.g. seeding market liquidity). Not a user path.
    function ownerMint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
}
