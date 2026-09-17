const hre = require("hardhat");

async function main() {
  const [w] = await hre.ethers.getSigners();
  const crew = await hre.ethers.getContractAt("CrewPassport", process.env.CREW_ADDRESS);
  const E = (s) => hre.ethers.parseEther(s);

  console.log("1) Whitelist deployer...");
  let tx = await crew.setWhitelist([w.address], true);
  await tx.wait(); console.log("   ok:", tx.hash.slice(0, 18));

  console.log("2) Mint 2 WL @ 0.5 USDC (1.0 total)...");
  tx = await crew.mintWL(2, { value: E("1") });
  await tx.wait(); console.log("   ok:", tx.hash.slice(0, 18));

  console.log("3) Onboard agent on token #1...");
  tx = await crew.onboardAgent(1, "testnet-scout", "e2e-verify");
  await tx.wait(); console.log("   ok:", tx.hash.slice(0, 18));

  console.log("4) Attest 2 tasks @ 1 USDC...");
  tx = await crew.attestTask(1, { value: E("1") }); await tx.wait();
  tx = await crew.attestTask(1, { value: E("1") }); await tx.wait();
  console.log("   ok x2");

  console.log("5) Verify on-chain state...");
  console.log("   totalSupply :", (await crew.totalSupply()).toString());
  console.log("   token1 class:", (await crew.classOf(1)).toString(), "tier:", (await crew.tierOf(1)).toString());
  console.log("   token2 class:", (await crew.classOf(2)).toString(), "tier:", (await crew.tierOf(2)).toString());
  console.log("   level(#1)   :", (await crew.levelOf(1)).toString(), "| stamps:", (await crew.stampBits(1)).toString());

  console.log("6) tokenURI(#1) size check...");
  const uri = await crew.tokenURI(1);
  const b64 = uri.split(",")[1];
  const json = JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
  const svg = Buffer.from(json.image.split(",")[1], "base64").toString("utf8");
  console.log("   JSON bytes  :", (json.name + JSON.stringify(json.attributes)).length, "| SVG bytes:", svg.length);
  console.log("   name        :", json.name);
  console.log("   attrs       :", JSON.stringify(json.attributes));
  console.log("   SVG head    :", svg.slice(0, 80));
  console.log("   SVG has NO. :", svg.includes("NO. 0001 / 2000"));
  console.log("   SVG has OBD:", svg.includes(">OBD<"));
  console.log("\n✅ E2E TESTNET OK — remaining balance:", (Number(await hre.ethers.provider.getBalance(w.address)) / 1e18).toFixed(4), "USDC");
}
main().catch((e) => { console.error("FAILED:", e.message); process.exit(1); });
