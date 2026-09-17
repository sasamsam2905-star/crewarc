const hre = require("hardhat");
(async () => {
  const crew = await hre.ethers.getContractAt("CrewPassport", process.env.CREW_ADDRESS);
  console.log("seed:", await crew.seed());
})();
