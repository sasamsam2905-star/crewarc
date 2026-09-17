// scripts/export-opensea.js — builds the full OpenSea upload package for CREW.
//
// Output (opensea/):
//   media/crew-0001.png … crew-2500.png   — passport art, gold skin, 1000×1400
//   metadata.csv                        — name/description/image/external_url + Phase, Class, Rarity
//   collection-image.png                — 1000×1000 collection banner
//   crew-opensea-upload.zip             — media + metadata, ready for bulk upload
//
// Class/BCD tables are recomputed with the SAME seed+caps as website/build.js
// and the on-chain contract, so item art matches the site 1:1.
//
// Phase mapping (OpenSea drop stages are sequential by item index):
//   id 1–500    → GTD    (stage 1: WL presale, $0.50, allowlist)
//   id 501–1500 → FCFS   (stage 2: WL presale, $0.50, allowlist)
//   id 1501–2500→ Public (stage 3: public, $10, max 4/wallet)

const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");
const { Resvg } = require("@resvg/resvg-js");
const ART = require("../svg/art.js");

const SEED = "0xb89ce0a34b7648c584fc21460d9a1a5acb10e28d8011250e0075023bb6d0b730";
const CAPS = [500, 430, 430, 300, 300, 190, 190, 160];
const CLASSES = ["Builder", "Scout", "Trader", "Diplomat", "Guard", "Oracle", "Pioneer", "Auditor"];
const RARITY = ["Common", "Common", "Common", "Uncommon", "Uncommon", "Rare", "Rare", "Legendary"];
const OUT = path.join(__dirname, "..", "opensea");
const MEDIA = path.join(OUT, "media");

// ---------- CLS (identical to build.js / contract _assignClass) ----------
const count = [0, 0, 0, 0, 0, 0, 0, 0];
const CLS = new Array(2500);
for (let id = 1; id <= 2500; id++) {
  const h = ethers.keccak256(
    ethers.concat([SEED, ethers.toUtf8Bytes("class"), ethers.zeroPadValue(ethers.toBeHex(id), 32)])
  );
  let idx = Number(BigInt(h) % 8n);
  for (let g = 0; g < 8; g++) {
    if (count[idx] < CAPS[idx]) break;
    idx = (idx + 1) % 8;
  }
  count[idx]++;
  CLS[id - 1] = idx;
}
if (count.some((c, i) => c !== CAPS[i])) throw new Error("CLS table mismatch: " + count);

// ---------- BCD (identical to build.js / CrewArt.barcode) ----------
const BCD = new Array(2500);
for (let id = 1; id <= 2500; id++) {
  const h = BigInt(
    ethers.keccak256(ethers.concat([ethers.toUtf8Bytes("bc"), ethers.zeroPadValue(ethers.toBeHex(id), 32)]))
  );
  let n = 0n;
  for (let i = 0; i < 32; i++) {
    const w = 2 + Number((h >> BigInt(8 * i)) & 3n);
    n = (n << 2n) | BigInt(w - 2);
  }
  BCD[id - 1] = n.toString(16).padStart(16, "0");
}

// ---------- gold skin (same as website site.js goldSkin, fixed gradient id) ----------
function goldSkin(svg) {
  const id = "gskin";
  const defs =
    `<defs><linearGradient id='${id}' x1='0' y1='0' x2='0' y2='1'>` +
    `<stop offset='0' stop-color='#F7E7AE'/><stop offset='0.55' stop-color='#EBCB74'/>` +
    `<stop offset='1' stop-color='#D9A845'/></linearGradient></defs>`;
  return svg
    .replace("<rect width='600' height='840' fill='#FAF9F6'/>", defs + `<rect width='600' height='840' fill='url(#${id})'/>`)
    .replace(/#C9A227/g, "#8a6d1f");
}

function phaseOf(id) {
  return id <= 500 ? "GTD" : id <= 1500 ? "FCFS" : "Public";
}

function csvEsc(s) {
  return '"' + String(s).replace(/"/g, '""') + '"';
}

function main() {
  // arg: "all" | "N" (render 1..N) | "A-B" (render A..B, appends to metadata.csv)
  const arg = process.argv[2] || "all";
  let start = 1, end = 2500;
  if (arg !== "all") {
    if (arg.includes("-")) {
      [start, end] = arg.split("-").map(Number);
    } else {
      end = Number(arg);
    }
  }
  fs.mkdirSync(MEDIA, { recursive: true });

  const csvPath = path.join(OUT, "metadata.csv");
  const fresh = !fs.existsSync(csvPath) || arg === "all";
  const rows = fresh ? ["name,description,image,external_url,Phase,Class,Rarity"] : [];
  const t0 = Date.now();
  for (let id = start; id <= end; id++) {
    const ci = CLS[id - 1];
    const serial = String(id).padStart(4, "0");
    const svg = goldSkin(
      ART.passportSvg(id, {
        classIdx: ci,
        className: CLASSES[ci],
        rarityName: RARITY[ci],
        tier: 1,
        level: 1,
        stamps: 1,
        bcN: BigInt("0x" + BCD[id - 1]),
      })
    );
    const png = new Resvg(svg, { fitTo: { mode: "width", value: 1000 } }).render().asPng();
    fs.writeFileSync(path.join(MEDIA, `crew-${serial}.png`), png);
    const phase = phaseOf(id);
    const desc =
      `CREW Passport #${serial} — an identity of the agentic economy on Arc. ` +
      `Class: ${CLASSES[ci]} (${RARITY[ci]}). Phase: ${phase}. One of 2,500, Level 1 of 100. ` +
      `Holders receive 10,000 $CREW airdrop after the mint. crewarc.xyz`;
    rows.push(
      [csvEsc(`CREW #${serial}`), csvEsc(desc), csvEsc(`crew-${serial}.png`), csvEsc("https://www.crewarc.xyz/"), phase, CLASSES[ci], RARITY[ci]].join(",")
    );
    if (id % 250 === 0) console.log(`  ${id}/2500 rendered (${Date.now() - t0} ms)`);
  }
  if (fresh) fs.writeFileSync(path.join(OUT, "metadata.csv"), rows.join("\n") + "\n");
  else fs.appendFileSync(path.join(OUT, "metadata.csv"), rows.join("\n") + "\n");
  const n = fs.readdirSync(MEDIA).filter((f) => f.endsWith(".png")).length;
  const sample = fs.statSync(path.join(MEDIA, "crew-0001.png")).size;
  console.log(`done: ${n} png files, metadata.csv rows=${rows.length - 1}, sample crew-0001.png=${(sample / 1024).toFixed(0)} KB, elapsed=${Date.now() - t0} ms`);
}

main();
