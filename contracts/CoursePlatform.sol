// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./BonusToken.sol";
import "./CertificateNFT.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CoursePlatform is Ownable {
    BonusToken public bonusToken;
    CertificateNFT public certificateNFT;

    // адрес : имя
    mapping(address => string) public nameOf;

    // courseId -> цена (wei)
    mapping(bytes32 => uint256) public coursePrice;

    // purchased[user][courseId]  купленные курсы
    mapping(address => mapping(bytes32 => bool)) public purchased;

    // completed[user][courseId] пройденныей курсы
    mapping(address => mapping(bytes32 => bool)) public completed;
    
    // certificateMinted[user][courseId] созданные nftштки сертификаты
    mapping(address => mapping(bytes32 => bool)) public certificateMinted;

    // Бонус токены: сколько bnst за 1 ETH 
    uint256 public bonusPerEth = 1000e18; // пока 1000 BNST за 1 ETH

    event UserRegistered(address indexed user, string name);
    event CoursePriceSet(bytes32 indexed courseId, uint256 priceWei);
    event CoursePurchased(address indexed user, bytes32 indexed courseId, uint256 paidWei);
    event CourseCompleted(address indexed user, bytes32 indexed courseId);
    event BonusMinted(address indexed user, uint256 amount);
    event CertificateMinted(address indexed user, bytes32 indexed courseId, uint256 tokenId);

    constructor(address _bonusToken, address _certificateNFT) Ownable(msg.sender) {
        bonusToken = BonusToken(_bonusToken);
        certificateNFT = CertificateNFT(_certificateNFT);
    }

    function setName(string calldata name) external {
        require(bytes(name).length > 0, "Empty name");
        nameOf[msg.sender] = name;
        emit UserRegistered(msg.sender, name);
    }

    function setCoursePrice(bytes32 courseId, uint256 priceWei) external onlyOwner {
        require(priceWei > 0, "Price=0");
        coursePrice[courseId] = priceWei;
        emit CoursePriceSet(courseId, priceWei);
    }

    function buyCourse(bytes32 courseId) external payable {
        uint256 price = coursePrice[courseId];
        require(price > 0, "Unknown course");
        require(msg.value == price, "Wrong ETH amount");
        require(!purchased[msg.sender][courseId], "Already purchased");

        purchased[msg.sender][courseId] = true;
        emit CoursePurchased(msg.sender, courseId, msg.value);
    }

    function completeCourse(bytes32 courseId) external {
        require(purchased[msg.sender][courseId], "Not purchased");
        require(!completed[msg.sender][courseId], "Already completed");

        completed[msg.sender][courseId] = true;
        emit CourseCompleted(msg.sender, courseId);

    // Чиканка награды
        uint256 price = coursePrice[courseId];
        uint256 bonusAmount = (price * bonusPerEth) / 1e18; // цена
        bonusToken.mint(msg.sender, bonusAmount);
        emit BonusMinted(msg.sender, bonusAmount);
    }

    function mintCertificate(bytes32 courseId) external returns (uint256) {
        require(completed[msg.sender][courseId], "Not completed");
        require(!certificateMinted[msg.sender][courseId], "Already minted");

        certificateMinted[msg.sender][courseId] = true;

        string memory studentName = nameOf[msg.sender];
        if (bytes(studentName).length == 0) {
            studentName = "Anonymous";
        }

        uint256 tokenId = certificateNFT.mint(msg.sender, courseId, studentName);
        emit CertificateMinted(msg.sender, courseId, tokenId);
        return tokenId;
    }

    function withdraw(address payable to) external onlyOwner {
        require(to != address(0), "Zero addr");

        (bool ok, ) = to.call{value: address(this).balance}("");
        require(ok, "Withdraw failed");
    }

}
