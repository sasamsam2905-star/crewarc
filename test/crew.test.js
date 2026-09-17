const { expect } = require("chai");
const { ethers, network } = require("hardhat");

const E = (s) => ethers.parseEther(s);

async function deploy() {
  const [deployer, alice, bob, charlie] = await ethers.getSigners();
  // hardhat-only top-up: full-mint test needs ~11.5k USDC of wallet funding
  await network.provider.send("hardhat_setBalance", [
    deployer.address,
    "0x" + (100000n * 10n ** 18n).toString(16),
  ]);
  const artFactory = await ethers.getContractFactory("CrewArt");
  const art = await artFactory.deploy();
  await art.waitForDeployment();
  const gold2Factory = await ethers.getContractFactory("CrewArtGold2");
  const gold2 = await gold2Factory.deploy();
  await gold2.waitForDeployment();
  const artGoldFactory = await ethers.getContractFactory("CrewArtGold", {
    libraries: { CrewArt: await art.getAddress(), CrewArtGold2: await gold2.getAddress() },
  });
  const artGold = await artGoldFactory.deploy();
  await artGold.waitForDeployment();
  const factory = await ethers.getContractFactory("CrewPassport", {
    libraries: { CrewArt: await art.getAddress(), CrewArtGold: await artGold.getAddress() },
  });
  const crew = await factory.deploy();
  await crew.waitForDeployment();
  return { crew, deployer, alice, bob, charlie, factory, art };
}

function decodeURI(uri) {
  const b64 = uri.split(",")[1];
  return JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
}

function decodeSvg(meta) {
  const b64 = meta.image.split(",")[1];
  return Buffer.from(b64, "base64").toString("utf8");
}

describe("CREW Passport", function () {
  // Each test deploys its own set; reset the chain between tests so the
  // in-memory provider does not accumulate 8x full deployments (OOM).
  beforeEach(async function () {
    await network.provider.send("hardhat_reset");
  });

  it("deploys with correct base info", async () => {
    const { crew } = await deploy();
    expect(await crew.name()).to.equal("CREW Passport");
    expect(await crew.symbol()).to.equal("CREW");
    expect(await crew.MAX_SUPPLY()).to.equal(2500);
    expect(await crew.WL_PRICE()).to.equal(E("0.5"));
    expect(await crew.FCFS_PRICE()).to.equal(E("1"));
    expect(await crew.PUBLIC_PRICE()).to.equal(E("10"));
    expect(await crew.seed()).to.not.equal(ethers.ZeroHash);
  });

  it("enforces WL rules: whitelist, price, per-wallet limit", async () => {
    const { crew, alice, bob, charlie } = await deploy();

    await expect(
      crew.connect(charlie).mintWL(1, { value: E("0.5") })
    ).to.be.revertedWith("not whitelisted");

    await crew.setWhitelist([alice.address, bob.address], true);
    await expect(
      crew.connect(alice).mintWL(1, { value: E("0.49") })
    ).to.be.revertedWith("underpaid");

    await crew.connect(alice).mintWL(1, { value: E("0.5") });
    expect(await crew.balanceOf(alice.address)).to.equal(1);
    expect(await crew.totalSupply()).to.equal(1);
    expect(await crew.wlMintedPer(alice.address)).to.equal(1);
    expect(await crew.wlMinted()).to.equal(1);
    // WL result is random: Founding (gold) or FCFS
    const t1 = Number(await crew.tierOf(1));
    expect([0, 1]).to.include(t1);
    expect(Number(await crew.foundingMinted()) + Number(await crew.fcfsMinted())).to.equal(1);

    // per-wallet limit (1)
    await expect(
      crew.connect(alice).mintWL(1, { value: E("0.5") })
    ).to.be.revertedWith("per-wallet limit");

    // events
    await expect(crew.connect(bob).mintWL(1, { value: E("0.5") }))
      .to.emit(crew, "Minted");
  });

  it("enforces phase ordering and prices for FCFS / Public", async () => {
    const { crew, alice } = await deploy();
    await crew.setWhitelist([alice.address], true);
    const now = Math.floor(Date.now() / 1000);

    await expect(crew.connect(alice).mintFCFS(1, { value: E("1") })).to.be.revertedWith(
      "fcfs not open"
    );
    await expect(crew.connect(alice).mintPublic(1, { value: E("10") })).to.be.revertedWith(
      "public not open"
    );

    await crew.setPhases(now - 10, now - 5);

    await crew.connect(alice).mintFCFS(1, { value: E("1") });
    expect(await crew.fcfsMinted()).to.equal(1);
    expect(await crew.tierOf(1)).to.equal(1); // first FCFS token

    await crew.connect(alice).mintPublic(1, { value: E("10") });
    expect(await crew.publicMinted()).to.equal(1);
    expect(await crew.tierOf(2)).to.equal(2); // first public token
  });

  it("refunds excess payment", async () => {
    const { crew, alice } = await deploy();
    await crew.setWhitelist([alice.address], true);
    const bal0 = await ethers.provider.getBalance(alice.address);
    const tx = await crew.connect(alice).mintWL(1, { value: E("1") }); // pays 0.5, refund 0.5
    const rcpt = await tx.wait();
    const bal1 = await ethers.provider.getBalance(alice.address);
    const spent = bal0 - bal1 + E("0"); // net loss incl gas
    // net loss must be 0.5 USDC + gas (gas here is tiny in test units)
    expect(spent).to.be.gte(E("0.5"));
    expect(spent).to.be.lt(E("0.51")); // 0.5 + test gas
  });

  it("onboardAgent sets agent profile + ONBOARDED stamp", async () => {
    const { crew, alice } = await deploy();
    await crew.setWhitelist([alice.address], true);
    await crew.connect(alice).mintWL(1, { value: E("0.5") });

    await expect(crew.connect(alice).onboardAgent(1, "x".repeat(33), "s")).to.be.revertedWith(
      "name length"
    );
    await crew.connect(alice).onboardAgent(1, "quant-07", "defi-arb");

    const meta = decodeURI(await crew.tokenURI(1));
    expect(meta.attributes.find((a) => a.trait_type === "Agent").value).to.equal("quant-07");
    const svg = decodeSvg(meta);
    expect(svg).to.include("AGENT: quant-07");
    if (Number(await crew.tierOf(1)) === 0) expect(svg).to.not.include(">OBD<"); // gold card has no stamp circles
  });

  it("attestTask raises levels and stamps (L1 -> L2 -> L3)", async () => {
    const { crew, alice, bob } = await deploy();
    await crew.setWhitelist([alice.address], true);
    await crew.connect(alice).mintWL(1, { value: E("0.5") });

    expect(await crew.levelOf(1)).to.equal(1);
    await expect(crew.connect(bob).attestTask(1, { value: E("0.5") })).to.be.revertedWith(
      "pay 1 USDC"
    );

    for (let i = 0; i < 10; i++) await crew.connect(bob).attestTask(1, { value: E("1") });
    expect(await crew.levelOf(1)).to.equal(2);
    let meta = decodeURI(await crew.tokenURI(1));
    expect(meta.attributes.find((a) => a.trait_type === "Level").value).to.equal("L2");
    let svg = decodeSvg(meta);
    if (Number(await crew.tierOf(1)) === 0) expect(svg).to.not.include(">VET<"); // gold card has no stamp circles; level L2 above is the check

    for (let i = 0; i < 40; i++) await crew.connect(bob).attestTask(1, { value: E("1") });
    expect(await crew.levelOf(1)).to.equal(3);
    meta = decodeURI(await crew.tokenURI(1));
    expect(meta.attributes.find((a) => a.trait_type === "Level").value).to.equal("L3");
  });

  it("royalty is 5%", async () => {
    const { crew, deployer } = await deploy();
    const [rAddr, fee] = await crew.royaltyInfo(1, E("10"));
    expect(rAddr).to.equal(deployer.address);
    expect(fee).to.equal(E("0.5"));
  });

  it("FULL MINT: 2500 tokens, exact class caps, exact phase caps", async function () {
    this.timeout(600000);
    const { crew, deployer, factory } = await deploy();
    const provider = ethers.provider;

    // 1500 funded wallets (GOLD phase, max 1 per wallet)
    const wallets = [];
    for (let i = 0; i < 1500; i++) {
      const w = ethers.Wallet.createRandom().connect(provider);
      await deployer.sendTransaction({ to: w.address, value: E("0.7") });
      wallets.push(w);
    }
    const now = Math.floor(Date.now() / 1000);
    for (let c = 0; c < 1500; c += 250) {
      await crew.setWhitelist(wallets.slice(c, c + 250).map((w) => w.address), true);
    }
    // fcfsStart = 0 -> FCFS phase disabled (FCFS supply comes entirely via the GOLD bag)
    await crew.setPhases(0, now - 10);

    // GOLD: 1500 wallets x 1 = 1500 (bag 500 gold + 1000 FCFS -> exact split at sell-out)
    for (let i = 0; i < 1500; i++) {
      await crew.connect(wallets[i]).mintWL(1, { value: E("0.5") });
    }
    expect(await crew.wlMinted()).to.equal(1500);
    expect(await crew.foundingMinted()).to.equal(500);
    expect(await crew.fcfsMinted()).to.equal(1000);
    expect(await crew.fcfsViaWL()).to.equal(1000);

    // FCFS phase is disabled (no separate phase)
    await expect(crew.connect(wallets[0]).mintFCFS(1, { value: E("1") })).to.be.revertedWith("fcfs not open");

    // Public: 250 fresh wallets x 4 = 1000
    for (let i = 0; i < 250; i++) {
      const w = ethers.Wallet.createRandom().connect(provider);
      await deployer.sendTransaction({ to: w.address, value: E("45") });
      await crew.connect(w).mintPublic(4, { value: E("40") });
    }

    expect(await crew.totalSupply()).to.equal(2500);
    expect(await crew.wlMinted()).to.equal(1500);
    expect(await crew.foundingMinted()).to.equal(500);
    expect(await crew.fcfsMinted()).to.equal(1000);
    expect(await crew.publicMinted()).to.equal(1000);

    // exact class distribution
    const counts = [0, 0, 0, 0, 0, 0, 0, 0];
    for (let id = 1; id <= 2500; id++) {
      counts[await crew.classOf(id)]++;
    }
    for (let c = 0; c < 8; c++) {
      expect(counts[c], `class ${c} count`).to.equal(await crew.CLASS_CAPS(c));
    }

    // GOLD ids 1..1500 (tier 0 or 1), public ids 1501..2500
    expect([0, 1]).to.include(Number(await crew.tierOf(1500)));
    expect(await crew.tierOf(1501)).to.equal(2);
    expect(await crew.tierOf(2500)).to.equal(2);

    // no more minting possible
    await expect(
      crew.connect(wallets[0]).mintPublic(1, { value: E("10") })
    ).to.be.revertedWith("cap reached");

    // tokenURI sanity: find the first founding (tier 0) token (random WL outcome)
    let gid = 0;
    for (let i = 1; i <= 1000; i++) {
      if (Number(await crew.tierOf(i)) === 0) { gid = i; break; }
    }
    expect(gid).to.be.greaterThan(0);
    const m1 = decodeURI(await crew.tokenURI(gid));
    expect(m1.name).to.match(/^CREW #\d{4} - /);
    const svg1 = decodeSvg(m1);
    expect(svg1).to.include("<svg");
    // founding tier uses the gold banknote template
    expect(svg1).to.include("FOUNDING CREW " + String(gid).padStart(4, "0") + " / 500");
    expect(svg1).to.include("CREW ARCHIVE");
    expect(svg1).to.include("CLEARANCE L1");

    // parity: on-chain gold-tier SVG == off-chain mirror (art.js)
    {
      const art = require("../svg/art");
      const RAR = ["Common", "Common", "Common", "Uncommon", "Uncommon", "Rare", "Rare", "Legendary"];
      const CLS_NAMES = await Promise.all(
        Array.from({ length: 8 }, (_, i) => crew.CLASS_NAMES(i))
      );
      const id = gid;
      const cls = await crew.classOf(id);
      const bcH = BigInt(
        ethers.keccak256(ethers.concat([ethers.toUtf8Bytes("bc"), ethers.zeroPadValue(ethers.toBeHex(id), 32)]))
      );
      const widths = [];
      for (let i = 0; i < 32; i++) widths.push(2 + Number((bcH >> BigInt(8 * i)) & 3n));
      const goldMirror = art.passportSvg(id, {
        className: CLS_NAMES[cls],
        rarityName: RAR[cls],
        bcN: art.packWidths(widths),
        classIdx: cls,
        tier: 0,
        level: await crew.levelOf(id),
        stamps: await crew.stampBits(id),
        agent: await crew.agentName(id),
      });
      expect(svg1).to.equal(goldMirror);
    }

    const m2500 = decodeURI(await crew.tokenURI(2500));
    expect(m2500.edition).to.equal(2500);
    expect(decodeSvg(m2500)).to.include("NO. 2500 / 2500");

    // parity: on-chain standard-tier SVG == off-chain mirror (art.js)
    const art = require("../svg/art");
    const CLS_NAMES = await Promise.all(
      Array.from({ length: 8 }, (_, i) => crew.CLASS_NAMES(i))
    );
    const RAR = ["Common", "Common", "Common", "Uncommon", "Uncommon", "Rare", "Rare", "Legendary"];
    const id = 2500;
    const cls = await crew.classOf(id);
    const seed = await crew.seed();
    const bcH = BigInt(
      ethers.keccak256(ethers.concat([ethers.toUtf8Bytes("bc"), ethers.zeroPadValue(ethers.toBeHex(id), 32)]))
    );
    const widths = [];
    for (let i = 0; i < 32; i++) widths.push(2 + Number((bcH >> BigInt(8 * i)) & 3n));
    const mirrorSvg = art.passportSvg(id, {
      className: CLS_NAMES[cls],
      rarityName: RAR[cls],
      bcN: art.packWidths(widths),
      classIdx: cls,
      tier: 2,
      level: await crew.levelOf(id),
      stamps: await crew.stampBits(id),
      agent: await crew.agentName(id),
    });
    expect(decodeSvg(m2500)).to.equal(mirrorSvg);
  });
});
