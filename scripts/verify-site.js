// Verifies: website render == on-chain tokenURI (byte-for-byte) for live tokens.
const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");
const art = require("../svg/art");

const RPC = "https://rpc.testnet.arc.io";
const CONTRACT = "0xd5B4a8E5968072dc6D1afE3dde8669d0364875f5";
const CLS_NAMES = ["Builder","Scout","Trader","Diplomat","Guard","Oracle","Pioneer","Auditor"];

async function rpc(method, params) {
  const r = await fetch(RPC, { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({jsonrpc:"2.0",id:1,method,params}) });
  const j = await r.json();
  if (j.error) throw new Error(j.error.message);
  return j.result;
}
const u = (v) => "0x" + BigInt(v).toString(16).padStart(64, "0");
async function ccall(sel, args = []) {
  const data = sel + args.map((a) => a.slice(2)).join("");
  return rpc("eth_call", [{ to: CONTRACT, data }, "latest"]);
}
const du = (h) => (h && h.length > 2 ? BigInt(h) : 0n);
function dstr(hex) {
  const h = hex.slice(2);
  const words = [];
  for (let i = 0; i + 64 <= h.length; i += 64) words.push(h.slice(i, i + 64));
  if (!words.length) return "";
  const off = Number(du("0x" + words[0])) >> 5;
  const len = Number(du("0x" + words[off]));
  const data = words.slice(off + 1, off + 1 + Math.ceil(len / 32)).join("");
  const bytes = Buffer.from(data.padEnd(len * 2, "0").slice(0, len * 2), "hex");
  return bytes.toString("utf8");
}

async function main() {
  // 1. extract tables embedded in the website
  const html = fs.readFileSync(path.join(__dirname, "..", "website", "index.html"), "utf8");
  const cls = html.match(/window\.__CLS__ = "([^"]+)"/)[1];
  const bcd = html.match(/window\.__BCD__ = "([^"]+)"/)[1];
  console.log("tables extracted: CLS", cls.length, "chars, BCD", bcd.length, "chars");

  // 2. syntax-check the embedded scripts
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  scripts.forEach((s, i) => new Function(s.length ? "return 1" : "") // noop placeholder
  );
  fs.writeFileSync("/tmp/s0.js", scripts[0]);
  fs.writeFileSync("/tmp/s1.js", scripts[1]);

  // 3. live on-chain state for token 1 & 2
  for (const id of [1, 2]) {
    const r = await Promise.all([
      ccall("0x4324aa21", [u(id)]), ccall("0x53f96df2", [u(id)]),
      ccall("0x6d5e3032", [u(id)]), ccall("0x00f5e75f", [u(id)]),
      ccall("0x089853b9", [u(id)]), ccall("0x6e47d7f1", [u(id)]),
    ]);
    // fetch tokenURI
    let uriRes;
    try {
      uriRes = await ccall("0xc87b56dd", [u(id)]);
    } catch (e) {
      console.log(`\ntoken #${id}: unminted — skipped`);
      continue;
    }
    const b64 = "0x" ? Buffer.from(uriRes.slice(2), "hex").toString("utf8") : "";
    const meta = JSON.parse(Buffer.from(b64.split(",")[1], "base64").toString("utf8"));
    const onchainSvg = Buffer.from(meta.image.split(",")[1], "base64").toString("utf8");

    const classIdx = Number(du(r[0])), tier = Number(du(r[1])), level = Number(du(r[2])), stamps = Number(du(r[3]));
    const agent = dstr(r[4]);
    const RAR = ["Common","Common","Common","Uncommon","Uncommon","Rare","Rare","Legendary"];
    const bcN = BigInt("0x" + bcd.slice((id - 1) * 16, (id - 1) * 16 + 16));
    const siteSvg = art.passportSvg(id, { className: CLS_NAMES[classIdx], rarityName: RAR[classIdx], bcN, classIdx, tier, level, stamps, agent });

    const match = onchainSvg === siteSvg;
    console.log(`\ntoken #${id}: class=${CLS_NAMES[classIdx]} tier=${tier} level=${level} stamps=${stamps} agent='${agent}'`);
    console.log("  on-chain SVG bytes:", onchainSvg.length, "| site SVG bytes:", siteSvg.length);
    console.log("  CLS table says class", cls[id - 1], "→ match:", Number(cls[id - 1]) === classIdx);
    console.log("  BYTE-FOR-BYTE MATCH:", match ? "✅ YES" : "❌ NO");
    if (!match) {
      for (let i = 0; i < Math.min(onchainSvg.length, siteSvg.length); i++) {
        if (onchainSvg[i] !== siteSvg[i]) { console.log("  first diff at", i, JSON.stringify(onchainSvg.slice(i-40, i+60)), "VS", JSON.stringify(siteSvg.slice(i-40, i+60))); break; }
      }
    }
  }
}
main().catch(e => { console.error("FAIL:", e.message); process.exit(1); });
