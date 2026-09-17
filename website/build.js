// build.js — assembles the self-contained CREW mint site.
// Computes CLS/BCD tables from the live testnet seed (must mirror contract),
// inlines art.js + site.js + CSS + HTML. Output: website/index.html
const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");

const SEED = "0xb89ce0a34b7648c584fc21460d9a1a5acb10e28d8011250e0075023bb6d0b730";
const CAPS = [500, 430, 430, 300, 300, 190, 190, 160];

// ---- CLS: class per token id, exactly like _assignClass (seed + fallback) ----
const count = [0, 0, 0, 0, 0, 0, 0, 0];
let clsStr = "";
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
  clsStr += idx.toString();
}
if (count.some((c, i) => c !== CAPS[i])) throw new Error("CLS table mismatch: " + count);

// ---- BCD: barcode bits per token id, exactly like CrewArt.barcode ----
let bcdStr = "";
for (let id = 1; id <= 2500; id++) {
  const h = BigInt(
    ethers.keccak256(ethers.concat([ethers.toUtf8Bytes("bc"), ethers.zeroPadValue(ethers.toBeHex(id), 32)]))
  );
  let n = 0n;
  for (let i = 0; i < 32; i++) {
    const w = 2 + Number((h >> BigInt(8 * i)) & 3n);
    n = (n << 2n) | BigInt(w - 2);
  }
  bcdStr += n.toString(16).padStart(16, "0");
}

// ---- assets ----
const art = fs
  .readFileSync(path.join(__dirname, "..", "svg", "art.js"), "utf8")
  .replace("module.exports = { FACES, DETAILS, stamp, barcode, pad4, passportSvg, packWidths };", "window.__ART__ = { FACES, DETAILS, stamp, barcode, pad4, passportSvg, packWidths };");
const site = fs.readFileSync(path.join(__dirname, "site.js"), "utf8");
// Note: the CREW banner in the WL section is a video (crew-banner.mp4),
// deployed next to index.html on both Vercel and GitHub Pages.

let html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=IBM+Plex+Mono:wght@400;500;600&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<title>CREW — Agent Passport of the Agentic Economy | Arc</title>
<link rel="canonical" href="https://crewarc.xyz/">
<meta property="og:url" content="https://crewarc.xyz/"/>
<meta property="og:title" content="CREW — Agent Passport of the Agentic Economy"/>
<meta property="og:description" content="2,500 fully on-chain passports for AI agents on Arc, Circle's stablecoin L1. Identity, reputation and stamps — all on-chain."/>
<style>
:root{
  --bg:#150303; --panel:#1f0707; --panel2:#2b0c0b; --line:#421716;
  --tx:#f4ecdf; --mut:#a5897f; --dim:#6e5450; --gold:#C9A227; --gold2:#e6c766;
  --ok:#3fb96f; --err:#e05252;
  --font-disp:'Cinzel',Georgia,'Times New Roman',serif;
  --font-body:'Manrope',ui-sans-serif,system-ui,Arial,sans-serif;
  --font-mono:'IBM Plex Mono',ui-monospace,'SFMono-Regular',Menlo,monospace;
}
*{box-sizing:border-box}
body{margin:0;isolation:isolate;color:var(--tx);font-family:var(--font-body);line-height:1.55;
  background:radial-gradient(1100px 700px at 78% -12%,rgba(255,64,39,.20),transparent 62%),
    radial-gradient(900px 650px at 8% 108%,rgba(196,32,24,.18),transparent 60%),
    radial-gradient(700px 520px at 50% 42%,rgba(140,20,14,.14),transparent 70%),var(--bg);
  background-attachment:fixed}
body::before{content:'';position:fixed;inset:0;pointer-events:none;z-index:-1;
  background:radial-gradient(900px 620px at 72% 8%,rgba(255,70,40,.12),transparent 60%),
    radial-gradient(700px 500px at 12% 90%,rgba(255,50,30,.08),transparent 60%);
  animation:ember 4.5s ease-in-out infinite}
@keyframes ember{0%,100%{opacity:.5}50%{opacity:1}}
.wrap{max-width:1120px;margin:0 auto;padding:0 20px}
a{color:var(--gold2);text-decoration:none}
a:hover{text-decoration:underline}
h2{font-size:24px;letter-spacing:1px;margin:0 0 6px;font-family:var(--font-disp)}
.sec{padding:64px 0 8px}
.sec .kicker{color:var(--gold);font-size:12px;letter-spacing:3px;text-transform:uppercase;margin-bottom:8px;font-family:var(--font-disp)}
.sec .lede{color:var(--mut);max-width:640px;margin:0 0 28px}
.dim{color:var(--mut)}
.hidden{display:none!important}
/* nav */
nav{position:sticky;top:0;z-index:50;background:rgba(21,3,3,.9);backdrop-filter:blur(8px);border-bottom:1px solid var(--line)}
.navin{max-width:1120px;margin:0 auto;padding:12px 20px;display:flex;align-items:center;gap:18px}
.logo{display:flex;align-items:center;gap:8px;font-weight:800;letter-spacing:3px;font-size:17px;color:var(--tx);font-family:var(--font-disp)}
.navlinks{display:flex;gap:16px;margin-left:12px;font-size:13px}
.navlinks a{color:var(--mut)}
.navlinks a:hover{color:var(--tx);text-decoration:none}
.spacer{flex:1}
/* buttons */
.btn{display:inline-block;padding:11px 22px;border-radius:10px;font-weight:700;font-size:14px;letter-spacing:.5px;cursor:pointer;border:1px solid transparent;transition:.15s}
.btn.gold{background:linear-gradient(180deg,var(--gold2),var(--gold));color:#171307}
.btn.gold:hover{filter:brightness(1.08)}
.btn.ghost{border-color:var(--line);color:var(--tx);background:transparent}
.btn.ghost:hover{border-color:var(--gold)}
.btn.big{padding:15px 30px;font-size:16px}
.btn:disabled{opacity:.45;cursor:not-allowed}
.btnlink{background:none;border:none;color:var(--gold2);cursor:pointer;font-size:12px;padding:0}
/* chips */
.chip{display:inline-block;border:1px solid var(--line);border-radius:999px;padding:4px 12px;font-size:12px;font-family:var(--font-mono);color:var(--mut);margin:3px 6px 3px 0;background:var(--panel)}
.chip b{color:var(--tx)}
.chip.gold{border-color:var(--gold);color:var(--gold2)}
.chip.dim{opacity:.65}
.chip.net{border-color:var(--gold);color:var(--gold2)}
/* hero */
.hero{display:grid;grid-template-columns:1.15fr .85fr;gap:40px;align-items:center;padding:64px 0 40px}
.hero .badge{display:inline-block;border:1px solid var(--gold);color:var(--gold2);font-size:11px;letter-spacing:2.5px;border-radius:999px;padding:4px 12px;margin-bottom:18px}
.hero h1{font-size:64px;line-height:1;margin:0;display:flex;align-items:center;gap:14px;letter-spacing:4px;font-family:var(--font-disp)}
.hero .tag{font-size:20px;font-weight:700;margin:14px 0 10px;color:var(--gold2);font-family:var(--font-disp);letter-spacing:1px}
.hero .sub{color:var(--mut);max-width:520px;font-size:15px}
.cta{display:flex;gap:12px;margin:24px 0 18px}
#statusbar{margin-top:8px}
.heropassport svg{width:100%;max-width:380px;display:block;margin:0 auto;border-radius:14px}
.heropassport .nft3d,.heropassport .nft3d .glare,.heropassport .nft3d .shine{border-radius:14px}
/* vision */
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:16px}
/* concept cards */
.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}
.card{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:22px}
.card h3{margin:0 0 8px;font-size:15px;letter-spacing:.5px}
.card p{margin:0;color:var(--mut);font-size:13.5px}
.card .ico{font-size:20px;margin-bottom:10px;display:block}
/* steps */
.steps{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;counter-reset:step}
.step{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:18px;position:relative}
.step::before{counter-increment:step;content:counter(step);position:absolute;top:14px;right:16px;font-family:var(--font-mono);color:var(--gold);font-size:13px}
.step b{font-size:14px}
.step p{margin:8px 0 0;color:var(--mut);font-size:13px}
/* crew grid */
.crewgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.ccard{background:var(--panel);border:1px solid var(--line);border-radius:12px;overflow:hidden}
.ccard svg{display:block;width:100%}
.ccard-meta{padding:10px 12px;font-size:12.5px;border-top:1px solid var(--line)}
.rar{font-family:var(--font-mono);font-size:11px;color:var(--mut)}
.rar.uncom{color:#5b9dd9}
.rar.rare{color:var(--gold2)}
/* rarity */
table{width:100%;border-collapse:collapse;font-size:13.5px;background:var(--panel);border:1px solid var(--line);border-radius:12px;overflow:hidden}
th,td{padding:10px 14px;text-align:left;border-bottom:1px solid var(--line)}
th{font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:var(--mut);background:var(--panel2)}
tr:last-child td{border-bottom:none}
.grail{margin-top:16px;border:1px dashed var(--gold);border-radius:12px;padding:16px 18px;font-size:13.5px;color:var(--mut)}
.grail b{color:var(--gold2)}
/* mint */
.phasecards{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:18px}
.phase{background:var(--panel);border:1px solid var(--line);border-radius:14px;padding:18px}
.phase-top{display:flex;justify-content:space-between;align-items:center;gap:8px}
.phase-name{font-weight:700;font-size:14px;font-family:var(--font-disp);letter-spacing:1px}
.phase-price{font-size:30px;font-weight:800;margin:10px 0 8px}
.phase-price span{font-size:13px;color:var(--mut);font-weight:500}
.phase-bar{height:6px;border-radius:4px;background:var(--panel2);overflow:hidden}
.phase-bar i{display:block;height:100%;background:linear-gradient(90deg,var(--gold),var(--gold2))}
.phase-sub{font-size:12px;color:var(--mut);margin-top:8px;font-family:var(--font-mono)}
.mintbox{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:24px;margin-top:8px}
.mintrow{display:flex;align-items:center;gap:16px;flex-wrap:wrap}
/* wl */
.wl-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px;align-items:stretch}
.wlbox{background:var(--panel);border:1px solid var(--line);border-radius:16px;padding:26px;max-width:none}
/* $CREW airdrop — animated gold frame */
@property --gca{syntax:'<angle>';initial-value:0deg;inherits:false}
.airdrop{position:relative;border-radius:18px;padding:2px;animation:gca-spin 6s linear infinite,gca-glow 3.2s ease-in-out infinite;
  background:conic-gradient(from var(--gca),#8a6d1f,#f5d67a,#d4a017,#6b5316,#f0d97a,#8a6d1f)}
@keyframes gca-spin{to{--gca:360deg}}
@keyframes gca-glow{0%,100%{box-shadow:0 0 18px rgba(212,160,23,.22)}50%{box-shadow:0 0 42px rgba(240,217,122,.5)}}
.airdrop-inner{background:linear-gradient(180deg,#26100a,#1a0705);border-radius:16px;padding:26px;height:100%;display:flex;flex-direction:column}
.airdrop .kicker{margin-bottom:4px}
.airdrop-title{font-family:var(--font-disp);font-size:34px;margin:0 0 10px;letter-spacing:2px;
  background:linear-gradient(180deg,#f5d67a,#d4a017 60%,#8a6d1f);-webkit-background-clip:text;background-clip:text;color:transparent}
.airdrop-lede{color:var(--mut);font-size:13.5px;margin:0 0 16px}
.airdrop-lede b{color:var(--gold2)}
.airdrop-amount{font-family:var(--font-disp);font-size:22px;letter-spacing:1px;color:var(--gold2);
  border:1px solid rgba(201,162,39,.45);border-radius:12px;padding:14px 16px;text-align:center;background:rgba(201,162,39,.06)}
.airdrop-amount b{font-size:30px;color:var(--tx)}
.airdrop-amount span{display:block;font-family:var(--font-mono);font-size:11px;letter-spacing:2px;color:var(--mut);margin-top:4px}
.airdrop-task{margin-top:auto;padding-top:18px;border-top:1px dashed rgba(201,162,39,.35)}
.airdrop-task b{font-size:13.5px;display:block;margin-bottom:4px}
.airdrop-task p{margin:0 0 10px;color:var(--mut);font-size:12.5px}
.airdrop-task input{width:100%;background:var(--panel2);border:1px solid var(--line);border-radius:10px;color:var(--tx);padding:11px 13px;font-size:13px;margin-bottom:10px}
.airdrop-task input:focus{outline:none;border-color:var(--gold)}
#ad-done{margin-top:10px;font-size:12.5px;color:var(--ok)}
.wl-tasks{display:grid;gap:10px;margin-bottom:16px}
.wl-task{display:flex;gap:12px;align-items:flex-start;background:var(--panel2);border:1px solid var(--line);border-radius:12px;padding:12px 14px}
.wl-task .wl-n{flex:0 0 auto;width:26px;height:26px;border-radius:50%;border:1px solid var(--gold);color:var(--gold2);font-family:var(--font-mono);font-size:13px;display:flex;align-items:center;justify-content:center;margin-top:1px}
.wl-tx b{font-size:13.5px}
.wl-tx p{margin:3px 0 0;font-size:12.5px;color:var(--mut)}
.wl-task.soon{opacity:.75;border-style:dashed}
.wl-task.soon .wl-n{border-color:var(--line);color:var(--dim)}
.wlbox input{width:100%;background:var(--panel2);border:1px solid var(--line);border-radius:10px;color:var(--tx);padding:12px 14px;font-size:14px;margin-bottom:12px}
.wlbox input:focus{outline:none;border-color:var(--gold)}
#wl-done{margin-top:14px;font-size:13px;color:var(--ok)}
/* CREW banner video (replaces marquee) */
.xhead{margin-top:26px;border:1px solid var(--gold);border-radius:14px;overflow:hidden;position:relative;background:#160202}
.xheadvid{display:block;width:100%;height:auto}
/* roadmap */
.road{display:grid;gap:10px}
.ritem{display:flex;gap:14px;background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:16px 18px;align-items:baseline}
.ritem .st{font-family:var(--font-mono);font-size:11px;letter-spacing:1px;min-width:84px}
.st.done{color:var(--ok)} .st.next{color:var(--gold2)} .st.later{color:var(--dim)} .st.progress{color:var(--gold2)}
.ritem b{font-size:14px}
.ritem p{margin:2px 0 0;color:var(--mut);font-size:13px}
/* faq */
details{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:14px 18px;margin-bottom:10px}
summary{cursor:pointer;font-weight:600;font-size:14px}
details p{color:var(--mut);font-size:13.5px;margin:10px 0 0}
/* footer */
footer{margin-top:64px;border-top:1px solid var(--line);padding:28px 0 40px;font-size:12.5px;color:var(--mut)}
footer .frow{display:flex;flex-wrap:wrap;gap:8px 18px;margin-bottom:10px}
footer code{font-family:var(--font-mono);color:var(--tx);cursor:pointer}
footer code:hover{color:var(--gold2)}
/* toast */
#toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(20px);background:#2b0d0c;border:1px solid var(--line);color:var(--tx);padding:12px 20px;border-radius:12px;font-size:13.5px;opacity:0;pointer-events:none;transition:.25s;max-width:90vw;z-index:99}
#toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
#toast.err{border-color:var(--err);color:#f2b8b8}
/* 3D animated NFT cards (no box-shadow inside 3D layers - Chrome flattens them into hard boxes) */
.nft3d-stage{perspective:1100px;position:relative}
.nftshadow{position:absolute;left:13%;right:13%;top:9%;bottom:1%;background:rgba(0,0,0,.55);filter:blur(34px);border-radius:30px;opacity:.7;transition:opacity .3s,transform .16s ease-out}
.nft3d-stage.glow .nftshadow{background:rgba(201,162,39,.42);left:11%;right:11%}
.nft3d-float{animation:float3d 7.5s ease-in-out infinite}
.nft3d{position:relative;border-radius:12px;transition:transform .16s ease-out;will-change:transform;transform:rotateX(4deg) rotateY(-6deg)}
.nft3d svg{display:block;width:100%;border-radius:12px}
.nft3d .glare{position:absolute;inset:0;border-radius:12px;pointer-events:none;opacity:0;transition:opacity .3s;
  background:radial-gradient(380px circle at var(--gx,50%) var(--gy,40%),rgba(255,236,170,.28),rgba(255,244,214,.10) 32%,transparent 58%)}
.nft3d-stage:hover .glare{opacity:1}
.nft3d .shine{position:absolute;inset:0;border-radius:12px;overflow:hidden;pointer-events:none}
.nft3d .shine::before{content:'';position:absolute;top:-60%;left:-80%;width:60%;height:220%;
  background:linear-gradient(105deg,transparent,rgba(255,255,255,.16) 45%,rgba(255,255,255,.30) 50%,rgba(255,255,255,.16) 55%,transparent);
  transform:rotate(8deg);animation:sweep 5.5s ease-in-out infinite}
@keyframes sweep{0%,55%{left:-80%}85%{left:140%}100%{left:140%}}
@keyframes float3d{
  0%,100%{transform:rotateX(5deg) rotateY(-7deg) translateY(0)}
  50%{transform:rotateX(-4deg) rotateY(7deg) translateY(-7px)}
}
.nft3d-stage:hover .nft3d-float{animation-play-state:paused}
.nft3d-stage:hover .nftshadow{opacity:1;transform:translateY(8px) scale(1.03)}
.nft3d-stage.glow:hover .nftshadow{background:rgba(224,178,44,.5)}
.ccard .nft3d-stage,.tpass .nft3d-stage{border-radius:12px}
.ccard .nft3d svg,.tpass .nft3d svg{border-radius:0}
@media (prefers-reduced-motion: reduce){
  .nft3d-float{animation:none}
  .nft3d .shine::before{animation:none;opacity:0}
}
/* responsive */
@media(max-width:900px){
  .hero{grid-template-columns:1fr;padding:40px 0}
  .heropassport svg{max-width:300px}
  .hero h1{font-size:46px}
  .grid2,.wl-grid{grid-template-columns:1fr}
  .grid3,.crewgrid{grid-template-columns:repeat(2,1fr)}
  .steps{grid-template-columns:repeat(2,1fr)}
  .phasecards{grid-template-columns:1fr}
  .navlinks{display:none}
}
</style>
</head>
<body>
<nav>
  <div class="navin">
    <div class="logo">CREW <svg width="22" height="16" viewBox="0 0 42 24"><path d="M2 22 a19 19 0 0 1 38 0" fill="none" stroke="#C9A227" stroke-width="7" stroke-linecap="round"/></svg></div>
    <div class="navlinks">
      <a href="#vision">Vision</a><a href="#crew">The Crew</a><a href="#rarity">Rarity</a><a href="#mint">Mint</a><a href="#roadmap">Roadmap</a><a href="#faq">FAQ</a>
    </div>
    <div class="spacer"></div>
    <a class="btn gold" href="https://opensea.io/" target="_blank" rel="noopener">Mint on OpenSea</a>
  </div>
</nav>

<div class="wrap">
  <header class="hero">
    <div>
      <div class="badge">LIVE ON ARC — CIRCLE'S STABLECOIN L1</div>
      <h1>CREW <svg width="46" height="30" viewBox="0 0 42 24"><path d="M2 22 a19 19 0 0 1 38 0" fill="none" stroke="#C9A227" stroke-width="7" stroke-linecap="round"/></svg></h1>
      <div class="tag">The Agent Passport of the Agentic Economy</div>
      <p class="sub">2,500 fully <b>on-chain</b> passports for AI agents on Arc. Identity, reputation and stamps live in the smart contract — no IPFS, no servers, no middlemen. As long as Arc exists, your passport exists.</p>
      <div class="cta">
        <a class="btn gold" href="https://opensea.io/" target="_blank" rel="noopener">Mint on OpenSea ↗</a>
        <a class="btn ghost" href="#wl">Join WL</a>
      </div>
      <div id="statusbar"><span class="chip dim">loading…</span></div>
    </div>
    <div class="heropassport" id="heropassport"></div>
  </header>

  <section class="sec" id="vision">
    <div class="kicker">Vision &amp; Mission</div>
    <h2>Why CREW exists</h2>
    <p class="lede">AI agents already transact on-chain. The missing piece is identity — who this agent is, and what it has actually delivered.</p>
    <div class="grid2">
      <div class="card"><span class="ico">🌐</span><h3>Vision</h3><p>An economy where every AI agent carries a permanent, verifiable identity: issued on-chain, portable across chains, readable by anyone. No servers to go down, no database to trust, no middleman to ask. Identity as public infrastructure — minted as a collectible.</p></div>
      <div class="card"><span class="ico">🎯</span><h3>Mission</h3><p>Mint 2,500 fully on-chain agent passports on Arc, Circle's stablecoin L1. Make identity deterministic, make reputation earnable through real work, and make the proof visible on the card itself. Every passport that levels up is a public record of an agent that delivered.</p></div>
    </div>
  </section>

  <section class="sec" id="concept">
    <div class="kicker">Why a passport</div>
    <h2>The first thing every agent needs</h2>
    <p class="lede">AI agents already transact on-chain — they just can't be verified. CREW is the identity + reputation layer, minted as collectibles on the chain built for the agentic economy.</p>
    <div class="grid3">
      <div class="card"><span class="ico">🪪</span><h3>Identity</h3><p>Onboard any agent — name, skill, endpoints. The passport binds a verifiable profile to a permanent ERC-721, compatible with the ERC-8004 model (CAIP-10, cross-chain portable).</p></div>
      <div class="card"><span class="ico">📈</span><h3>Reputation</h3><p>Every completed task can be attested on-chain (1 USDC). Attestations raise your clearance level L1→L5 and unlock stamps. Reputation can't be bought — only earned.</p></div>
      <div class="card"><span class="ico">🧬</span><h3>A living passport</h3><p>The card itself is a procedural on-chain SVG: class face, tier frame, barcode, level badge and stamps. Fresh mints are blank; used passports grow. The most-used passport is the rarest one.</p></div>
    </div>
  </section>

  <section class="sec" id="how">
    <div class="kicker">How it works</div>
    <h2>From mint to mission</h2>
    <div class="steps">
      <div class="step"><b>Mint</b><p>Pay in USDC (native). Your class, frame and barcode are determined on-chain at mint.</p></div>
      <div class="step"><b>Onboard</b><p>Bind an agent name + skill to your passport. One tx. The ONBOARDED stamp appears.</p></div>
      <div class="step"><b>Work</b><p>Your agent takes tasks. Each completion is attested on-chain (1 USDC) — or via x402 receipts in Phase 3.</p></div>
      <div class="step"><b>Level up</b><p>10/50/200/500 attestations → L2/L3/L4/L5. VETTED and MASTER stamps unlock. The card updates forever.</p></div>
    </div>
  </section>

  <section class="sec" id="crew">
    <div class="kicker">The crew</div>
    <h2>8 classes. One deterministic seed.</h2>
    <p class="lede">Class is assigned from the deploy seed + token id, with exact supply caps enforced in-contract. These are real token ids from the live contract.</p>
    <div class="crewgrid" id="crewgrid"></div>
  </section>

  <section class="sec" id="rarity">
    <div class="kicker">Rarity</div>
    <h2>Three axes of rarity</h2>
    <p class="lede">Tier (how you minted) × Class (what you got) × Level (what you did). The card you see is never the card you'll keep.</p>
    <table>
      <tr><th>Axis</th><th>Tiers</th><th>Supply</th></tr>
      <tr><td><b>Tier</b> (frame)</td><td>GTD (Guaranteed, via WL) / FCFS (via WL) / Public</td><td>500 / 1,000 / 1,000</td></tr>
      <tr><td><b>Class</b> (face)</td><td>Common → Uncommon → Rare → <span style="color:var(--gold2)">Legendary</span></td><td>1,360 / 600 / 380 / 160</td></tr>
      <tr><td><b>Level</b> (badge)</td><td>L1 → L5 via on-chain attestations</td><td>earned, not minted</td></tr>
      <tr><td><b>Stamps</b></td><td>ENLISTED → ONBOARDED → VETTED → MASTER</td><td>earned, not minted</td></tr>
    </table>
    <div class="grail"><b>The Holy Grail:</b> Auditor (Legendary) × GTD (Guaranteed) = maximum <b>25 passports</b>. Five percent of the GTD tier, one percent of the supply. The most collectible object on Arc — and it can still reach L5 with all four stamps.</div>
  </section>

  <section class="sec" id="mint">
    <div class="kicker">Mint</div>
    <h2>Join the crew</h2>
    <p class="lede">Minting runs on <b>OpenSea</b> — payment in <b>USDC (native)</b>, the same asset that pays gas on Arc. No approvals, no wrapped tokens, no middlemen.</p>
    <div class="phasecards" id="phasecards"></div>
    <div class="mintbox">
      <div class="grid3">
        <div class="card"><span class="ico">🛒</span><h3>Where</h3><p>All tiers mint through the official CREW collection on OpenSea. One wallet, one payment in USDC — gas included.</p></div>
        <div class="card"><span class="ico">⚡</span><h3>When</h3><p>The drop opens soon — WL first, then Public. Follow <a href="https://x.com/crewonarc" target="_blank" rel="noopener">@crewonarc</a> for the announcement.</p></div>
        <div class="card"><span class="ico">🪪</span><h3>What you get</h3><p>Your class, tier frame and barcode are drawn on-chain at mint time. The card is yours forever — and it only grows with use.</p></div>
      </div>
      <div class="mintrow" style="margin-top:18px">
        <a class="btn gold big" href="https://opensea.io/" target="_blank" rel="noopener">Mint on OpenSea ↗</a>
        <a class="btn ghost big" href="https://x.com/crewonarc" target="_blank" rel="noopener">Follow @crewonarc</a>
      </div>
    </div>
  </section>

  <section class="sec" id="wl">
    <div class="kicker">GTD</div>
    <h2>GTD — 500 NFT @ $0.50 (via WL)</h2>
    <p class="lede">1,500 wallets get WL. Every WL mint is a <b>random result</b>: GTD (Guaranteed) or FCFS — drawn on-chain from a bag of 500 GTD + 1,000 FCFS. Max <b>1 per wallet</b>. Complete the tasks below, then submit your wallet address + the link to your comment. Access is granted on-chain via <code>setWhitelist()</code>.</p>
    <div class="wl-grid">
      <div class="wlbox">
      <div class="wl-tasks">
        <div class="wl-task">
          <span class="wl-n">1</span>
          <div class="wl-tx"><b>Follow <a href="https://x.com/crewonarc" target="_blank" rel="noopener">@crewonarc on X</a></b>
          <p>Follow the official CREW account.</p></div>
        </div>
        <div class="wl-task soon">
          <span class="wl-n">2</span>
          <div class="wl-tx"><b>Like &amp; RT the WL announcement post</b>
          <p>Link coming soon — posted here once the CREW X account is ready.</p></div>
        </div>
        <div class="wl-task soon">
          <span class="wl-n">3</span>
          <div class="wl-tx"><b>Comment your wallet address</b>
          <p>Comment your wallet address on the same post — coming soon.</p></div>
        </div>
      </div>
      <input id="wl-wallet" placeholder="Wallet address (0x…) — must be a valid Arc address">
      <input id="wl-comment" placeholder="Paste your comment link here (after the post is live)">
      <button class="btn gold" id="wl-save" style="width:100%">Register for WL</button>
      <div id="wl-done" class="hidden">✓ Registered (<span id="wl-count">0</span> on this device). Watch <a href="https://x.com/crewonarc" target="_blank" rel="noopener">@crewonarc</a> for the WL drop — on-chain via <code>setWhitelist()</code>.</div>
      </div>
      <div class="airdrop">
        <div class="airdrop-inner">
          <div class="kicker">Token Airdrop</div>
          <h3 class="airdrop-title">$CREW</h3>
          <p class="airdrop-lede">Every CREW passport holds <b>$CREW</b>. When the token launches — after the NFT mint ends — each passport receives its airdrop straight to the holding wallet. Holders first, always.</p>
          <div class="airdrop-amount"><b>10,000</b> $CREW <span>per NFT</span></div>
          <div class="airdrop-task">
            <b>Community airdrop task</b>
            <p>Post on <a href="https://x.com/crewonarc" target="_blank" rel="noopener">X</a> about CREW and tag <b>@crewonarc</b> to enter the community airdrop.</p>
            <input id="ad-post" placeholder="Paste your X post link (https://x.com/…)">
            <input id="ad-wallet" placeholder="Wallet address (0x…) — airdrop destination">
            <button class="btn gold" id="ad-submit" style="width:100%">Submit post link</button>
            <div id="ad-done" class="hidden">✓ Post registered — we'll verify the @crewonarc tag on X. Keep this device/browser.</div>
          </div>
        </div>
      </div>
    </div>
    <div class="xhead" aria-label="CREW — the agent passport of the agentic economy">
      <video class="xheadvid" src="crew-banner.mp4" autoplay muted loop playsinline></video>
    </div>
  </section>

  <section class="sec" id="roadmap">
    <div class="kicker">Roadmap</div>
    <h2>From mint to the agent economy</h2>
    <div class="road">
      <div class="ritem"><span class="st done">DONE</span><div><b>Phase 0 — Contract + on-chain art on Arc</b><p>ERC-721 + on-chain SVG renderer deployed, full-mint tested (2,500/2,500), E2E verified live.</p></div></div>
      <div class="ritem"><span class="st progress">IN PROGRESS</span><div><b>Phase 1 — Mint NFT</b><p>2,500 passports minting on OpenSea: 1,500 WL @ $0.50 (random result: GTD or FCFS) → 1,000 Public @ $10. Max 1 per wallet (WL), 4 (Public). Total raise: $10,750 USDC. WL tasks on X — follow <a href="https://x.com/crewonarc" target="_blank" rel="noopener">@crewonarc</a>.</p></div></div>
      <div class="ritem"><span class="st later">LATER</span><div><b>Phase 2 — x402 receipts → stamps</b><p>Real agent payments (HTTP-native, USDC) become attestation. No more manual attest — the economy does it.</p></div></div>
      <div class="ritem"><span class="st later">LATER</span><div><b>Phase 3 — ERC-8004 compatibility</b><p>Port CREW identities to the agent identity standard (CAIP-10): one passport, many chains.</p></div></div>
    </div>
  </section>

  <section class="sec" id="faq">
    <div class="kicker">FAQ</div>
    <h2>Questions</h2>
    <details open><summary>Where do I mint?</summary><p>On <b>OpenSea</b>, through the official CREW collection. WL goes first (1,500 wallets — random result: GTD or FCFS), then Public @ $10, max 4 per wallet. Payment is USDC, the native asset of Arc. Follow <a href="https://x.com/crewonarc" target="_blank" rel="noopener">@crewonarc</a> for the drop date.</p></details>
    <details><summary>What is Arc?</summary><p>Arc is Circle's stablecoin-native Layer-1, public mainnet live since September 16, 2026. EVM-compatible, USDC pays gas, sub-second deterministic finality, institutional validators (BlackRock, Visa, DTCC…). It's explicitly built for the agentic economy — which is why CREW lives there.</p></details>
    <details><summary>How is CREW different from a normal PFP?</summary><p>A PFP is a picture. A CREW passport is an operational identity: you onboard an agent, earn attestations, and the card visibly grows. Its metadata is 100% on-chain (SVG + JSON in the contract) — nothing external to lose or censor.</p></details>
    <details><summary>Do I need to run an AI agent to hold one?</summary><p>No. You can hold CREW like any collectible. But the thesis is that as agent adoption grows, verified agent identities with on-chain track records become the scarce asset — and Arc is the settlement layer for that economy.</p></details>
    <details><summary>Why is mint paid in USDC?</summary><p>Because USDC <i>is</i> the gas on Arc. No approvals, no wrapped variants, predictable dollar fees. Your mint payment and your gas come from the same balance — same as how ETH works on Ethereum.</p></details>
    <details><summary>Can an AI agent mint for me?</summary><p>Yes — anything that can sign EIP-1559 transactions works: EOA wallets, smart accounts, agent wallets. In Phase 3 the full loop (discover → pay → attest) becomes machine-to-machine via x402.</p></details>
    <details><summary>What about royalties?</summary><p>5% via ERC-2981, enforced by marketplaces that honor it. A small fee keeps the passport ecosystem alive — funding Phase 3/4 development.</p></details>
  </section>

  <footer>
    <div class="frow">
      <span>Contract:</span>
      <code class="copyaddr" data-addr="0x258Cbb33A0FEA6674CC27F87B6a608641B265110" data-label="Contract address">0x258C…5110</code>
      <span>Art libraries:</span>
      <code class="copyaddr" data-addr="0x23C420f117C93deea7d058eC4120FB1551bF1563" data-label="Art library">0x23C4…1563</code>
      <code class="copyaddr" data-addr="0xC5f95AAD43D49673D78A82d5a5fbCbEEde83B417" data-label="Founding art library">0xC5f9…B417</code>
      <a href="https://testnet.arcscan.app/address/0x258Cbb33A0FEA6674CC27F87B6a608641B265110" target="_blank">explorer ↗</a>
    </div>
    <div class="frow">
      <span>Deploy seed:</span>
      <code class="copyaddr" data-addr="0xb89ce0a34b7648c584fc21460d9a1a5acb10e28d8011250e0075023bb6d0b730" data-label="Seed">0xb89c…b730</code>
    </div>
    <p>CREW is an experimental collectible/identity project on Arc, Circle's stablecoin L1. Nothing here is financial advice. Smart contracts can contain bugs. Verify all addresses on-chain before minting.</p>
  </footer>
</div>
<div id="toast"></div>

<script>
__ART_JS__
window.__CLS__ = "__CLS__";
window.__BCD__ = "__BCD__";
</script>
<script>
__SITE_JS__
</script>
</body>
</html>`
  .replace("__ART_JS__", art)
  .replace('"__CLS__"', JSON.stringify(clsStr))
  .replace('"__BCD__"', JSON.stringify(bcdStr))
  .replace("__SITE_JS__", site);

const out = path.join(__dirname, "index.html");
fs.writeFileSync(out, html);
console.log("✅ website/index.html written:", (html.length / 1024).toFixed(0) + " KB");
console.log("   CLS table:", clsStr.length, "chars | BCD table:", bcdStr.length, "chars");
