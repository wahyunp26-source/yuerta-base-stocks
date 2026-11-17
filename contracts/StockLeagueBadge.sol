// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/// @title StockLeagueBadge — weekly winner badge for the Yuerta Stock League.
/// @notice Awarded by the league operator (owner) to weekly leaderboard winners. Testnet only.
contract StockLeagueBadge is ERC721, Ownable {
    using Strings for uint256;

    uint256 public nextId;
    mapping(uint256 => uint256) public seasonOf;
    mapping(uint256 => uint256) public rankOf;

    event Awarded(address indexed to, uint256 indexed tokenId, uint256 season, uint256 rank);

    constructor() ERC721("Yuerta Stock League Badge", "yBADGE") Ownable(msg.sender) {}

    function award(address to, uint256 season, uint256 rank) external onlyOwner returns (uint256) {
        uint256 tokenId = nextId++;
        seasonOf[tokenId] = season;
        rankOf[tokenId] = rank;
        _safeMint(to, tokenId);
        emit Awarded(to, tokenId, season, rank);
        return tokenId;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "no such token");
        string memory json = string(
            abi.encodePacked(
                '{"name":"Yuerta Stock League - Season ',
                seasonOf[tokenId].toString(),
                ' Rank #',
                rankOf[tokenId].toString(),
                '","description":"Weekly winner badge of the Yuerta Stock League on Base Sepolia. Testnet only, no monetary value.","attributes":[{"trait_type":"Season","value":',
                seasonOf[tokenId].toString(),
                '},{"trait_type":"Rank","value":',
                rankOf[tokenId].toString(),
                '}]}'
            )
        );
        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(bytes(json))));
    }
}
