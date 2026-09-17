const hre = require("hardhat");

// Usage:
//   CREW_ADDRESS=0x... WALLETS=0xaaa,0xbbb,0xccc npm run scripts/add-wl.js
// (or: node -e "require('./scripts/add-wl.js')" style via hardhat run)
async function main() {
  const address = process.env.CREW_ADDRESS;
  const walletsCsv = process.env.WALLETS;
  if (!address || !walletsCsv) throw new Error("Set CREW_ADDRESS and WALLETS (comma-separated) in .env");
  const wallets = walletsCsv.split(",").map((s) => s.trim()).filter(Boolean);
  const [op] = await hre.ethers.getSigners();
  const crew = await hre.ethers.getContractAt("CrewPassport", address);
  const tx = await crew.setWhitelist(wallets, true);
  await tx.wait();
  console.log(`✅ Whitelisted ${wallets.length} addresses. Tx:`, tx.hash);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
