/* CREW — Agent Passport site logic. Read-only: no wallet connect, no tx.
   Minting happens on OpenSea — this site is vision/mission + mint info. */
"use strict";

// ============================== config ==============================
const NET = {
  name: "Arc Mainnet",
  rpc: "https://rpc.testnet.arc.io",
  contract: "0x258Cbb33A0FEA6674CC27F87B6a608641B265110",
};
const CLASSES = ["Builder", "Scout", "Trader", "Diplomat", "Guard", "Oracle", "Pioneer", "Auditor"];
const RARITY = ["Common", "Common", "Common", "Uncommon", "Uncommon", "Rare", "Rare", "Legendary"];
const CAPS = [500, 430, 430, 300, 300, 190, 190, 160];
const PHASES = {
  wl: { cap: 500n, wlCap: 1500n, maxPer: 1n, label: "GTD", priceStr: "$0.50", gold: true },
  fcfs: { cap: 1000n, maxPer: 1n, label: "FCFS", priceStr: "$1.00", gold: false },
  pub: { cap: 1000n, maxPer: 4n, label: "Public", priceStr: "$10.00", gold: false },
};
const S = {
  totalSupply: "0x18160ddd", wlMinted: "0x463fb323", fcfsMinted: "0xe81e1c83", publicMinted: "0xa4f4f8af",
  fcfsExtra: "0xbc43c321", fcfsStart: "0xe483b3c3", publicStart: "0xa5f4c6ff", wlOpen: "0x1a904acb",
  foundingMinted: "0x2536da0f",
};

// ============================== mini ABI ==============================
function wordsOf(hex) {
  const h = hex && hex.startsWith("0x") ? hex.slice(2) : "";
  const w = [];
  for (let i = 0; i + 64 <= h.length; i += 64) w.push(h.slice(i, i + 64));
  return w;
}
const du = (hex) => (hex && hex.length > 2 ? BigInt(hex) : 0n);

async function rpc(method, params) {
  const r = await fetch(NET.rpc, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error.message || "rpc error");
  return j.result;
}
async function ccall(sel) {
  return rpc("eth_call", [{ to: NET.contract, data: sel }, "latest"]);
}

async function readState() {
  const r = await Promise.all([
    ccall(S.totalSupply), ccall(S.wlMinted), ccall(S.fcfsMinted), ccall(S.publicMinted),
    ccall(S.fcfsExtra), ccall(S.fcfsStart), ccall(S.publicStart), ccall(S.wlOpen),
    ccall(S.foundingMinted),
  ]);
  return {
    total: du(r[0]), wl: du(r[1]), fcfs: du(r[2]), pub: du(r[3]), extra: du(r[4]),
    fcfsStart: du(r[5]), pubStart: du(r[6]), wlOpen: du(r[7]) === 1n, gtd: du(r[8]),
  };
}
// ============================== art ==============================
const ART = window.__ART__;
const CLS = window.__CLS__; // 2500 chars: class index per token id (id-1)
const BCD = window.__BCD__; // 40000 hex chars (2500 ids × 16): barcode bits per token id (id-1)
function bcOf(id) {
  return BigInt("0x" + BCD.slice((id - 1) * 16, (id - 1) * 16 + 16));
}
// Website-only "elegant gold" card skin: swaps the paper background for a
// champagne-gold gradient. art.js itself stays byte-identical to on-chain.
let skinN = 0;
function goldSkin(svg) {
  const id = "gcard" + (skinN++);
  const defs =
    `<defs><linearGradient id='${id}' x1='0' y1='0' x2='0' y2='1'>` +
    `<stop offset='0' stop-color='#F7E7AE'/><stop offset='0.55' stop-color='#EBCB74'/>` +
    `<stop offset='1' stop-color='#D9A845'/></linearGradient></defs>`;
  if (svg.includes("<rect width='600' height='840' fill='#FAF9F6'/>"))
    return svg
      .replace("<rect width='600' height='840' fill='#FAF9F6'/>", defs + `<rect width='600' height='840' fill='url(#${id})'/>`)
      .replace(/#C9A227/g, "#8a6d1f"); // gold accents -> bronze, legible on gold
  if (svg.includes("<rect width='600' height='840' fill='#F8F3E3'/>"))
    return svg
      .replace("<rect width='600' height='840' fill='#F8F3E3'/>", defs + `<rect width='600' height='840' fill='url(#${id})'/>`)
      .replace(/#C9A227/g, "#8a6d1f");
  return svg;
}
function renderPassport(id, o) {
  return goldSkin(ART.passportSvg(id, { className: CLASSES[o.classIdx], rarityName: RARITY[o.classIdx], bcN: bcOf(id), ...o }));
}

// ============================== dom helpers ==============================
const el = (id) => document.getElementById(id);
let toastTimer = null;
function toast(msg, kind) {
  const t = el("toast");
  t.textContent = msg;
  t.className = "show " + (kind || "ok");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.className = ""), 6000);
}
async function copyTxt(s, label) {
  try {
    await navigator.clipboard.writeText(s);
    toast((label || s) + " copied", "ok");
  } catch (e) {
    toast("Copy failed", "err");
  }
}

// ============================== WL form ==============================
function wlList() {
  try { return JSON.parse(localStorage.getItem("crew_wl") || "[]"); } catch (e) { return []; }
}
function saveWL() {
  const rec = {
    wallet: el("wl-wallet").value.trim(),
    comment: el("wl-comment").value.trim(),
    ts: Date.now(),
  };
  if (!/^0x[0-9a-fA-F]{40}$/.test(rec.wallet)) return toast("Valid 0x wallet address required", "err");
  if (!rec.comment) toast("Registered — you can add your comment link later.", "ok");
  const l = wlList();
  if (l.some((r) => r.wallet.toLowerCase() === rec.wallet.toLowerCase())) {
    l = l.filter((r) => r.wallet.toLowerCase() !== rec.wallet.toLowerCase());
  }
  l.push(rec);
  localStorage.setItem("crew_wl", JSON.stringify(l));
  el("wl-count").textContent = l.length;
  el("wl-done").classList.remove("hidden");
  toast("Registered! Keep this device/browser or note your details.", "ok");
}

// ============================== render ==============================
function chip(txt, cls) {
  return `<span class="chip ${cls || ""}">${txt}</span>`;
}
function renderStatus() {
  const bar = el("statusbar");
  if (!state) {
    bar.innerHTML = chip("loading live counters…", "dim");
    return;
  }
  bar.innerHTML =
    chip(`minted ${state.total} / 2500`) +
    chip(`GTD ${state.gtd}/500`) +
    chip(`FCFS ${state.fcfs}/1000 · via WL`) +
    chip(`Public ${state.pub}/1000`) +
    chip(NET.name, "net");
}
function renderPhaseCards() {
  const wrap = el("phasecards");
  wrap.innerHTML = "";
  ["wl", "fcfs", "pub"].forEach((ph) => {
    const P = PHASES[ph];
    const minted = { wl: state ? state.gtd : 0n, fcfs: state ? state.fcfs : 0n, pub: state ? state.pub : 0n }[ph];
    const cap = P.cap + (state && ph === "fcfs" ? state.extra : 0n);
    const pct = cap ? Number(minted * 100n / cap) : 0;
    const c = document.createElement("div");
    c.className = "phase";
    c.innerHTML = `
      <div class="phase-top"><span class="phase-name">${P.label}</span></div>
      <div class="phase-price">${P.priceStr} <span>USDC</span></div>
      <div class="phase-bar"><i style="width:${pct}%"></i></div>
      <div class="phase-sub">${minted} / ${cap} · max ${P.maxPer} / wallet ${P.gold ? "· via WL · random: <b>GTD</b> or FCFS" : ph === "fcfs" ? "· filled via WL mint" : ""}</div>`;
    wrap.appendChild(c);
  });
}
function renderAll() {
  renderStatus();
  if (state) renderPhaseCards();
}
let state = null;
async function refreshAll() {
  try {
    state = await readState();
  } catch (e) {
    state = null;
  }
  renderAll();
}

// ============================== static renders ==============================
function firstIdOfClass(c) {
  for (let id = 1; id <= 2500; id++) if (Number(CLS[id - 1]) === c) return id;
  return 1;
}
function renderCrewGrid() {
  const g = el("crewgrid");
  g.innerHTML = "";
  for (let c = 0; c < 8; c++) {
    const id = firstIdOfClass(c);
    const d = document.createElement("div");
    d.className = "ccard";
    d.innerHTML =
      renderPassport(id, { classIdx: c, tier: 1, level: 1, stamps: 1 }) +
      `<div class="ccard-meta"><b>${CLASSES[c]}</b> <span class="rar ${c >= 5 ? "rare" : c >= 3 ? "uncom" : ""}">${RARITY[c]}</span><br>
       <span class="dim">#${ART.pad4(id)} example · ${CAPS[c]} of 2500</span></div>`;
    g.appendChild(d);
  }
}
function renderHero() {
  const id = firstIdOfClass(7); // Auditor
  el("heropassport").innerHTML = renderPassport(id, { classIdx: 7, tier: 0, level: 5, stamps: 15, agent: "arc-sentinel" });
}

// ============================== 3d cards ==============================
function upgrade3D(scope, opts) {
  opts = opts || {};
  scope.querySelectorAll('svg').forEach((svg, i) => {
    if (svg.parentElement && svg.parentElement.classList.contains('nft3d')) return;
    const stage = document.createElement('div');
    stage.className = 'nft3d-stage' + (opts.glow ? ' glow' : '');
    const fl = document.createElement('div');
    fl.className = 'nft3d-float';
    fl.style.animationDelay = (-(i * 1.9) % 7.5).toFixed(1) + 's';
    const card = document.createElement('div');
    card.className = 'nft3d';
    const glare = document.createElement('div');
    glare.className = 'glare';
    const shine = document.createElement('div');
    shine.className = 'shine';
    card.appendChild(glare);
    card.appendChild(shine);
    const shadow = document.createElement('div');
    shadow.className = 'nftshadow';
    const parent = svg.parentNode;
    parent.insertBefore(stage, svg);
    stage.appendChild(shadow);
    stage.appendChild(fl);
    fl.appendChild(card);
    card.appendChild(svg);
    card.addEventListener('pointermove', (e) => {
      const r = stage.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      card.style.transform = 'rotateX(' + (-py * 16).toFixed(2) + 'deg) rotateY(' + (px * 20).toFixed(2) + 'deg) translateZ(14px)';
      glare.style.setProperty('--gx', ((px + 0.5) * 100).toFixed(1) + '%');
      glare.style.setProperty('--gy', ((py + 0.5) * 100).toFixed(1) + '%');
    });
    stage.addEventListener('pointerleave', () => {
      card.style.transform = '';
      glare.style.opacity = '';
    });
  });
}

// ============================== init ==============================
function startCursorEmbers() {
  if (!window.matchMedia("(hover:hover) and (pointer:fine)").matches) return;
  const cv = document.createElement("canvas");
  cv.id = "cursor-embers";
  Object.assign(cv.style, { position: "fixed", inset: "0", width: "100vw", height: "100vh", pointerEvents: "none", zIndex: "9999" });
  document.body.appendChild(cv);
  const ctx = cv.getContext("2d");
  let W, H; const DPR = Math.min(window.devicePixelRatio || 1, 2);
  function resize() { W = window.innerWidth; H = window.innerHeight; cv.width = W * DPR; cv.height = H * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0); }
  resize(); window.addEventListener("resize", resize);
  const parts = [];
  const G = { x: -200, y: -200, tx: -200, ty: -200 };
  let active = false;
  window.addEventListener("mousemove", (e) => {
    G.tx = e.clientX; G.ty = e.clientY; active = true;
    for (let i = 0; i < 2; i++) parts.push({
      x: e.clientX + (Math.random() - 0.5) * 10, y: e.clientY + (Math.random() - 0.5) * 10,
      vx: (Math.random() - 0.5) * 0.6, vy: -0.4 - Math.random() * 0.9,
      r: 1 + Math.random() * 2.4, life: 1, decay: 0.015 + Math.random() * 0.02, gold: Math.random() < 0.45,
    });
    if (parts.length > 90) parts.splice(0, parts.length - 90);
  });
  (function tick() {
    requestAnimationFrame(tick);
    ctx.clearRect(0, 0, W, H);
    if (!active) return;
    G.x += (G.tx - G.x) * 0.18; G.y += (G.ty - G.y) * 0.18;
    const g = ctx.createRadialGradient(G.x, G.y, 0, G.x, G.y, 90);
    g.addColorStop(0, "rgba(255,120,60,0.10)"); g.addColorStop(0.5, "rgba(255,60,30,0.05)"); g.addColorStop(1, "rgba(255,60,30,0)");
    ctx.fillStyle = g; ctx.fillRect(G.x - 90, G.y - 90, 180, 180);
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.x += p.vx; p.y += p.vy; p.vy -= 0.004; p.life -= p.decay;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      const a = Math.max(p.life, 0);
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * a, 0, Math.PI * 2);
      ctx.fillStyle = p.gold ? `rgba(255,196,60,${0.85 * a})` : `rgba(255,84,32,${0.8 * a})`;
      ctx.fill();
    }
  })();
}

document.addEventListener("DOMContentLoaded", () => {
  renderHero();
  renderCrewGrid();
  upgrade3D(el("heropassport"), { glow: true });
  startCursorEmbers();
  upgrade3D(el("crewgrid"));
  el("wl-save").addEventListener("click", saveWL);
  el("wl-count").textContent = wlList().length;
  document.querySelectorAll(".copyaddr").forEach((b) =>
    b.addEventListener("click", () => copyTxt(b.dataset.addr, b.dataset.label))
  );
  renderStatus();
  refreshAll();
  setInterval(refreshAll, 15000);
});
