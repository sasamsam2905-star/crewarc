const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  if (!deployer) {
    throw new Error("No deployer. Set PRIVATE_KEY in crew/.env (fund via https://faucet.circle.com)");
  }
  const bal = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Network      :", hre.network.name, "(chainId", await hre.network.provider.send("eth_chainId"), ")");
  console.log("Deployer     :", deployer.address);
  console.log("Balance      :", hre.ethers.formatEther(bal), "USDC (native, 18-dec interpretation)");
  if (hre.ethers.formatEther(bal).startsWith("0") && bal === 0n) {
    throw new Error("Deployer has no USDC. Claim testnet USDC at https://faucet.circle.com");
  }

  const artFactory = await hre.ethers.getContractFactory("CrewArt");
  const art = await artFactory.deploy();
  await art.waitForDeployment();
  console.log("CrewArt (library):", await art.getAddress());

  const gold2Factory = await hre.ethers.getContractFactory("CrewArtGold2");
  const gold2 = await gold2Factory.deploy();
  await gold2.waitForDeployment();
  console.log("CrewArtGold2 (library):", await gold2.getAddress());

  const artGoldFactory = await hre.ethers.getContractFactory("CrewArtGold", {
    libraries: { CrewArt: await art.getAddress(), CrewArtGold2: await gold2.getAddress() },
  });
  const artGold = await artGoldFactory.deploy();
  await artGold.waitForDeployment();
  console.log("CrewArtGold (library):", await artGold.getAddress());

  const factory = await hre.ethers.getContractFactory("CrewPassport", {
    libraries: { CrewArt: await art.getAddress(), CrewArtGold: await artGold.getAddress() },
  });
  const crew = await factory.deploy();
  await crew.waitForDeployment();

  const addr = await crew.getAddress();
  console.log("\n✅ CrewPassport deployed:", addr);
  console.log("Seed               :", await crew.seed());
  console.log("Max supply         :", (await crew.MAX_SUPPLY()).toString());
  console.log("Prices (WL/FCFS/PUB):", "0.5 / 1 / 10 USDC");
  console.log("\nNext steps:");
  console.log("  1) export CREW_ADDRESS=" + addr + " in .env");
  console.log("  2) npm run phases  -> sets FCFS (T+24h) & Public (T+72h) open times");
  console.log("  3) Add whitelist:  scripts/add-wl.js (see README)");
  console.log("  4) Test mint from a 2nd faucet-funded wallet (must be whitelisted for WL)");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
