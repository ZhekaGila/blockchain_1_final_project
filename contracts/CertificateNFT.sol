// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CertificateNFT is ERC721, Ownable {
    address public minter;
    uint256 public nextTokenId;

    // tokenId : courseId
    mapping(uint256 => bytes32) public tokenCourse;
    
    // tokenId : имя или мб ник студента 
    mapping(uint256 => string) public tokenName;

    constructor() ERC721("Course Certificate", "CERT") Ownable(msg.sender) {}

    function setMinter(address _minter) external onlyOwner {
        minter = _minter;
    }

    function mint(address to, bytes32 courseId, string calldata studentName) external returns (uint256) {
        require(msg.sender == minter, "Not minter");
        uint256 tokenId = ++nextTokenId;
        _safeMint(to, tokenId);
        tokenCourse[tokenId] = courseId;
        tokenName[tokenId] = studentName;
        return tokenId;
    }
}
