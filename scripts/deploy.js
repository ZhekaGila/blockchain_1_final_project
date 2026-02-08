const { ethers } = require("hardhat");

function courseId(str) {
  return ethers.id(str); 
}

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const BonusToken = await ethers.getContractFactory("BonusToken");
  const bonus = await BonusToken.deploy();
  await bonus.waitForDeployment();

  const CertificateNFT = await ethers.getContractFactory("CertificateNFT");
  const cert = await CertificateNFT.deploy();
  await cert.waitForDeployment();

  const CoursePlatform = await ethers.getContractFactory("CoursePlatform");
  const platform = await CoursePlatform.deploy(await bonus.getAddress(), await cert.getAddress());
  await platform.waitForDeployment();

  
  await (await bonus.setMinter(await platform.getAddress())).wait();
  await (await cert.setMinter(await platform.getAddress())).wait();

  // цены для демо курсов
  await (await platform.setCoursePrice(courseId("bc101"), ethers.parseEther("0.001"))).wait();
  await (await platform.setCoursePrice(courseId("web3ui"), ethers.parseEther("0.001"))).wait();
  await (await platform.setCoursePrice(courseId("nftcert"), ethers.parseEther("0.001"))).wait();
  await (await platform.setCourseBonusPrice(courseId("bc101"), ethers.parseUnits("50", 18))).wait();
  await (await platform.setCourseBonusPrice(courseId("web3ui"), ethers.parseUnits("50", 18))).wait();
  await (await platform.setCourseBonusPrice(courseId("nftcert"), ethers.parseUnits("50", 18))).wait();


  console.log("BonusToken:", await bonus.getAddress());
  console.log("CertificateNFT:", await cert.getAddress());
  console.log("CoursePlatform:", await platform.getAddress());
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
