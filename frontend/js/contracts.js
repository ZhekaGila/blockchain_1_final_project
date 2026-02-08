window.AC = window.AC || {};

AC.courseIdToBytes32 = (id) => ethers.id(id);

AC.initContracts = async () => {

  // signer должен будет уже сделать connectWallet
  
  if (!AC.state?.signer) return;

  const platformAbi = [
    "function setName(string name)",
    "function buyCourse(bytes32 courseId) payable",
    "function completeCourse(bytes32 courseId)",
    "function mintCertificate(bytes32 courseId) returns (uint256)",
    "function purchased(address user, bytes32 courseId) view returns (bool)",
    "function completed(address user, bytes32 courseId) view returns (bool)",
    "event CoursePurchased(address indexed user, bytes32 indexed courseId, uint256 paidWei)",
    "event CourseCompleted(address indexed user, bytes32 indexed courseId)",
    "event CertificateMinted(address indexed user, bytes32 indexed courseId, uint256 tokenId)",
    "function buyCourseWithBonus(bytes32 courseId)",
    "function bonusPrice(bytes32 courseId) view returns (uint256)",
    "event CoursePurchasedWithBonus(address indexed user, bytes32 indexed courseId, uint256 paidBonus)"
  ];

  const erc20Abi = [
    "function balanceOf(address) view returns (uint256)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)"
  ];

  AC.contracts = AC.contracts || {};
  AC.contracts.platform = new ethers.Contract(AC.CONTRACTS.platform, platformAbi, AC.state.signer);
  AC.contracts.bonusToken = new ethers.Contract(AC.CONTRACTS.bonusToken, erc20Abi, AC.state.signer);
};
