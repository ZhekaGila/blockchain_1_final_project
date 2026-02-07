window.AC = window.AC || {};

AC.LS = {
  wallet: "ac_wallet",
  mock: "ac_mock",
  myCourses: "ac_myCourses",
  certs: "ac_certs",
  selectedCourse: "ac_selectedCourse"
};

AC.TESTNETS = { 11155111:"Sepolia", 17000:"Holesky", 31337:"Localhost (Hardhat)" };
AC.isTestnet = (chainId) => Boolean(AC.TESTNETS[Number(chainId)]);
