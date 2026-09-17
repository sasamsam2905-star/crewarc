// CREW passport preview renderer (off-chain mirror of CrewArt.sol via art.js).
// Usage:
//   node svg/render.js [--seed 0x...] [--out preview/gallery.html]
const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");
const art = require("./art");

const CAPS = [400, 350, 350, 250, 250, 150, 150, 100];
const CLASSES = ["Builder", "Scout", "Trader", "Diplomat", "Guard", "Oracle", "Pioneer", "Auditor"];
const RARITY = ["Common", "Common", "Common", "Uncommon", "Uncommon", "Rare", "Rare", "Legendary"];

const argOf = (flag, def) => {
  const i = process.argv.indexOf(flag);
  return i > -1 ? process.argv[i + 1] : def;
};
const SEED = argOf("--seed", "0x" + "ab".repeat(32));
const OUT = argOf("--out", path.join(__dirname, "..", "preview", "gallery.html"));

// ---- same assignment as contract (_assignClass with cap fallback) ----
const count = [0, 0, 0, 0, 0, 0, 0, 0];
function classOf(id) {
  const packed = ethers.concat([
    SEED,
    ethers.toUtf8Bytes("class"),
    ethers.zeroPadValue(ethers.toBeHex(id), 32),
  ]);
  let idx = Number(BigInt(ethers.keccak256(packed)) % 8n);
  for (let g = 0; g < 8; g++) {
    if (count[idx] < CAPS[idx]) break;
    idx = (idx + 1) % 8;
  }
  count[idx]++;
  return idx;
}
function barcodeN(id) {
  const h = BigInt(
    ethers.keccak256(ethers.concat([ethers.toUtf8Bytes("bc"), ethers.zeroPadValue(ethers.toBeHex(id), 32)]))
  );
  const widths = [];
  for (let i = 0; i < 32; i++) widths.push(2 + Number((h >> BigInt(8 * i)) & 3n));
  return art.packWidths(widths);
}
function passport(id, opts) {
  return art.passportSvg(id, {
    className: CLASSES[opts.classIdx],
    rarityName: RARITY[opts.classIdx],
    bcN: barcodeN(id),
    ...opts,
  });
}

function main() {
  // find one example token id per class (with real cap fallback, like the contract)
  const examples = {};
  for (let id = 1; id <= 2000; id++) {
    const c = classOf(id);
    if (!examples[c]) examples[c] = id;
  }
  const cards = [];
  for (let c = 0; c < 8; c++) {
    cards.push({
      id: examples[c],
      opts: { classIdx: c, tier: 1, level: 1, stamps: 1 },
      caption: `${CLASSES[c]} — ${RARITY[c]} · FCFS · L1 · fresh mint`,
    });
  }
  cards.push({
    id: examples[7],
    opts: { classIdx: 7, tier: 0, level: 5, stamps: 15, agent: "arc-sentinel" },
    caption: "Auditor — Legendary · FOUNDING CREW (gold) · L5 · all stamps · onboarded",
  });
  cards.push({
    id: examples[6],
    opts: { classIdx: 6, tier: 0, level: 4, stamps: 11, agent: "trail-runner" },
    caption: "Pioneer — Rare · Founding Crew · L4 (MASTER) · ENL+OBD+VET",
  });
  cards.push({
    id: examples[2],
    opts: { classIdx: 2, tier: 1, level: 3, stamps: 5, agent: "fx-runner" },
    caption: "Trader — Common · FCFS · L3 · ENL+OBD+VET",
  });
  cards.push({
    id: examples[0],
    opts: { classIdx: 0, tier: 1, level: 2, stamps: 3, agent: "builder-01" },
    caption: "Builder — Common · FCFS · L2 · ENL+OBD",
  });

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8"/>
<title>CREW — Passport Preview</title>
<style>
  body { margin:0; padding:32px; background:#0e1013; color:#e8e6e0; font-family:Arial, Helvetica, sans-serif; }
  h1 { font-size:26px; letter-spacing:2px; margin:0 0 6px; }
  .sub { color:#9a978f; font-size:13px; margin-bottom:28px; }
  .grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(250px, 1fr)); gap:24px; }
  .card { background:#171a1f; border:1px solid #262b33; border-radius:10px; overflow:hidden; }
  .card svg { display:block; width:100%; height:auto; }
  .cap { padding:10px 12px; font-size:12px; color:#bdb9ae; font-family:ui-monospace,monospace; }
</style>
</head>
<body>
<h1>CREW — AGENT PASSPORT PREVIEW</h1>
<div class="sub">On-chain SVG renderer (off-chain mirror) · seed ${SEED.slice(0, 10)}… · 2000 supply: WL 500 @ $0.5 → FCFS 1000 @ $1 → Public 500 @ $10</div>
<div class="grid">
${cards
  .map(
    (c) =>
      `<div class="card">${passport(c.id, c.opts)}<div class="cap">#${art.pad4(c.id)} — ${c.caption}</div></div>`
  )
  .join("\n")}
</div>
</body>
</html>`;

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, html);
  console.log("✅ Gallery written to", OUT, `(${cards.length} cards, seed ${SEED.slice(0, 10)}…)`);
}

main();
