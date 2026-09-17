const hre = require("hardhat");

// Usage:
//   CREW_ADDRESS=0x... npm run phases [fcfsOffsetHours] [publicOffsetHours]
// Defaults: FCFS opens T+24h, Public opens T+72h (from now).
async function main() {
  const address = process.env.CREW_ADDRESS;
  if (!address) throw new Error("Set CREW_ADDRESS in .env");
  const [op] = await hre.ethers.getSigners();
  if (!op) throw new Error("No operator. Set PRIVATE_KEY in .env");

  const fcfsOffset = (process.argv[3] || 24) * 3600;
  const pubOffset = (process.argv[4] || 72) * 3600;
  const now = Math.floor(Date.now() / 1000);

  const crew = await hre.ethers.getContractAt("CrewPassport", address);
  console.log("Crew contract:", address, "| operator:", op.address);
  console.log("Setting FCFS  open at:", new Date((now + fcfsOffset) * 1000).toISOString());
  console.log("Setting Public open at:", new Date((now + pubOffset) * 1000).toISOString());

  const tx = await crew.setPhases(now + fcfsOffset, now + pubOffset);
  await tx.wait();
  console.log("✅ Phases set. Tx:", tx.hash);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
