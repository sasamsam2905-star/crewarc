/* CREW — Agent Passport site logic. No external deps. */
"use strict";

// ============================== config ==============================
const NETS = {
  "0x4cef52": {
    name: "Arc Testnet",
    chainId: "0x4cef52",
    rpc: "https://rpc.testnet.arc.io",
    contract: "0xd5B4a8E5968072dc6D1afE3dde8669d0364875f5",
    library: "0xe75b220edBf9c1141F143377B2c688D347b17925",
    library2: "0x9f14d1bb452E5286b1ef18Db7d5398691260F011",
    explorer: "https://testnet.arcscan.app",
    symbol: "USDC",
    decimals: 18,
    seed: "0x4d63f727fef8e424365db0a8c8345d925641f9aea7703bdd6e81a7dafed945a9",
  },
  "0x13ba": {
    name: "Arc Mainnet",
    chainId: "0x13ba",
    rpc: "https://rpc.mainnet.arc.io",
    contract: "", // set after mainnet deploy
    library: "",
    explorer: "https://explorer.arc.io",
    symbol: "USDC",
    decimals: 18,
    seed: "",
  },
};
const CLASSES = ["Builder", "Scout", "Trader", "Diplomat", "Guard", "Oracle", "Pioneer", "Auditor"];
const RARITY = ["Common", "Common", "Common", "Uncommon", "Uncommon", "Rare", "Rare", "Legendary"];
const CAPS = [500, 430, 430, 300, 300, 190, 190, 160];
const PHASES = {
  wl: { sel: "0xba419de0", price: 500000000000000000n, cap: 1000n, maxPer: 1n, label: "Whitelist", priceStr: "$0.50", gold: true },
  fcfs: { sel: "0xcd2cbf4f", price: 1000000000000000000n, cap: 1000n, maxPer: 1n, label: "FCFS", priceStr: "$1.00", gold: false },
  pub: { sel: "0xefd0cbf9", price: 10000000000000000000n, cap: 1000n, maxPer: 4n, label: "Public", priceStr: "$10.00", gold: false },
};
const PHASE_IDX = { wl: 0, fcfs: 1, pub: 2 };

const S = {
  totalSupply: "0x18160ddd", wlMinted: "0x463fb323", fcfsMinted: "0xe81e1c83", publicMinted: "0xa4f4f8af",
  fcfsExtra: "0xbc43c321", fcfsStart: "0xe483b3c3", publicStart: "0xa5f4c6ff", wlOpen: "0x1a904acb",
  isWhitelisted: "0x3af32abf", balanceOf: "0x70a08231", tierMinted: "0x9ccfda3b",
  classOf: "0x4324aa21", tierOf: "0x53f96df2", levelOf: "0x6d5e3032", stampBits: "0x00f5e75f",
  agentName: "0x089853b9", agentSkill: "0x6e47d7f1",
  wlMintedPer: "0xd3c13d7e",
  CLASS_NAMES: "0x28a869f3", RARITY_NAMES: "0x0a5b300c", CLASS_CAPS: "0xcfc4ce33",
  ownerTokens: "0xb15feaef", tokenOfOwnerByIndex: "0x2f745c59",
  seed: "0x7d94792a", onboardAgent: "0x4e7005ab", attestTask: "0x907055f9",
};

// ============================== mini ABI ==============================
const u = (v) => "0x" + BigInt(v).toString(16).padStart(64, "0");
const a32 = (a) => "0x" + a.slice(2).toLowerCase().padStart(64, "0");
function wordsOf(hex) {
  const h = hex && hex.startsWith("0x") ? hex.slice(2) : "";
  const w = [];
  for (let i = 0; i + 64 <= h.length; i += 64) w.push(h.slice(i, i + 64));
  return w;
}
const du = (hex) => (hex && hex.length > 2 ? BigInt(hex) : 0n);
function hexToBytes(h) {
  const b = new Uint8Array(h.length / 2);
  for (let i = 0; i < b.length; i++) b[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16);
  return b;
}
function dstr(hex) {
  const w = wordsOf(hex);
  if (!w.length) return "";
  const off = Number(du("0x" + w[0])) >> 5;
  if (!w[off]) return "";
  const len = Number(du("0x" + w[off]));
  const data = w.slice(off + 1, off + 1 + Math.ceil(len / 32)).join("");
  const bytes = hexToBytes(data.padEnd(len * 2, "0").slice(0, len * 2));
  return new TextDecoder().decode(bytes);
}
function strHex(s) {
  let h = "";
  for (const x of new TextEncoder().encode(s)) h += x.toString(16).padStart(2, "0");
  return h;
}

// ============================== state ==============================
let wallet = typeof window !== "undefined" && window.ethereum ? window.ethereum : null;
let account = null;
let netId = "0x4cef52"; // read-only default: Arc testnet
let state = null;
let stateErr = false;
let acct = null;
let qty = 1;
const net = () => NETS[netId];

async function rpc(method, params) {
  if (wallet) return wallet.request({ method, params });
  const r = await fetch(net().rpc, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const j = await r.json();
  if (j.error) throw new Error(j.error.message || "rpc error");
  return j.result;
}
async function ccall(sel, args = []) {
  const data = sel + args.map((a) => a.slice(2)).join("");
  return rpc("eth_call", [{ to: net().contract, data }, "latest"]);
}

async function readState() {
  const r = await Promise.all([
    ccall(S.totalSupply), ccall(S.wlMinted), ccall(S.fcfsMinted), ccall(S.publicMinted),
    ccall(S.fcfsExtra), ccall(S.fcfsStart), ccall(S.publicStart), ccall(S.wlOpen),
  ]);
  return {
    total: du(r[0]), wl: du(r[1]), fcfs: du(r[2]), pub: du(r[3]), extra: du(r[4]),
    fcfsStart: du(r[5]), pubStart: du(r[6]), wlOpen: du(r[7]) === 1n,
  };
}
function phaseOpen(st, now) {
  return {
    wl: st.wlOpen && st.wl < PHASES.wl.cap,
    fcfs: st.fcfsStart > 0n && now >= st.fcfsStart && st.fcfs < PHASES.fcfs.cap + st.extra,
    pub: st.pubStart > 0n && now >= st.pubStart && st.pub < PHASES.pub.cap,
  };
}
function openPhaseNow() {
  if (!state) return null;
  const o = phaseOpen(state, BigInt(Math.floor(Date.now() / 1000)));
  if (o.wl) return "wl";
  if (o.fcfs) return "fcfs";
  if (o.pub) return "pub";
  return null;
}
async function readAccount() {
  if (!account) return null;
  const r = await Promise.all([
    rpc("eth_getBalance", [account, "latest"]),
    ccall(S.isWhitelisted, [a32(account)]),
    ccall(S.tierMinted, [u(0), a32(account)]),
    ccall(S.tierMinted, [u(1), a32(account)]),
    ccall(S.tierMinted, [u(2), a32(account)]),
    ccall(S.wlMintedPer, [a32(account)]),
  ]);
  return { balance: du(r[0]), wl: du(r[1]) === 1n, tierMinted: [du(r[2]), du(r[3]), du(r[4])], wlPer: du(r[5]) };
}
async function readToken(id) {
  const r = await Promise.all([
    ccall(S.classOf, [u(id)]), ccall(S.tierOf, [u(id)]),
    ccall(S.levelOf, [u(id)]), ccall(S.stampBits, [u(id)]),
    ccall(S.agentName, [u(id)]), ccall(S.agentSkill, [u(id)]),
  ]);
  return {
    id,
    classIdx: Number(du(r[0])),
    tier: Number(du(r[1])),
    level: Number(du(r[2])),
    stamps: Number(du(r[3])),
    agent: dstr(r[4]),
    skill: dstr(r[5]),
  };
}

// ============================== art ==============================
const ART = window.__ART__;
const CLS = window.__CLS__; // 2500 chars: class index per token id (id-1)
const BCD = window.__BCD__; // 32000 hex chars: barcode bits per token id (id-1)
function bcOf(id) {
  return BigInt("0x" + BCD.slice((id - 1) * 16, (id - 1) * 16 + 16));
}
function renderPassport(id, o) {
  return ART.passportSvg(id, { className: CLASSES[o.classIdx], rarityName: RARITY[o.classIdx], bcN: bcOf(id), ...o });
}

// ============================== dom helpers ==============================
const el = (id) => document.getElementById(id);
function fmtUSDC(big) {
  return (Number(big) / 1e18).toLocaleString("en-US", { maximumFractionDigits: 4 });
}
function short(a) {
  return a ? a.slice(0, 6) + "…" + a.slice(-4) : "";
}
function countdown(from) {
  const d = Number(from - BigInt(Math.floor(Date.now() / 1000)));
  if (d <= 0) return "now";
  const h = Math.floor(d / 3600);
  const m = Math.floor((d % 3600) / 60);
  return h > 0 ? h + "h " + m + "m" : m + "m";
}
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

// ============================== wallet ==============================
async function connect() {
  if (!wallet) {
    toast("No wallet detected — open this site in a browser with MetaMask", "err");
    return;
  }
  try {
    const accts = await wallet.request({ method: "eth_requestAccounts" });
    account = accts[0];
    let cid = (await wallet.request({ method: "eth_chainId" })).toLowerCase();
    if (!NETS[cid]) {
      const t = NETS["0x4cef52"];
      try {
        await wallet.request({ method: "wallet_switchEthereumChain", params: [{ chainId: t.chainId }] });
      } catch (e) {
        await wallet.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: t.chainId,
              chainName: t.name,
              rpcUrls: [t.rpc],
              nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
              blockExplorerUrls: [t.explorer],
            },
          ],
        });
      }
    }
    netId = NETS[cid] ? cid : "0x4cef52";
    wallet.on && wallet.on("accountsChanged", (a) => { account = a[0]; refreshAll(); });
    wallet.on && wallet.on("chainChanged", (c) => { netId = c.toLowerCase(); refreshAll(); });
    await refreshAll();
  } catch (e) {
    toast("Connect failed: " + (e.message || e), "err");
  }
}

// ============================== mint ==============================
function maxMintable(ph) {
  const P = PHASES[ph];
  const st = state;
  const minted = { wl: st.wl, fcfs: st.fcfs, pub: st.pub }[ph];
  const rem = P.cap + (ph === "fcfs" ? st.extra : 0n) - minted;
  const used = ph === "wl" ? (acct ? acct.wlPer : 0n) : (acct ? acct.tierMinted[PHASE_IDX[ph]] : 0n);
  const per = P.maxPer - used;
  const m = BigInt(Math.min(Number(rem), Number(per), 50));
  return m > 0n ? Number(m) : 0;
}
function currentOpenPhase() {
  const ph = openPhaseNow();
  if (ph === "wl" && acct && !acct.wl) return null; // WL phase but not whitelisted
  return ph;
}
async function doMint() {
  if (busy) return;
  const ph = currentOpenPhase();
  if (!account) {
    await connect();
    if (!account) return;
  }
  if (!net().contract) return toast("Contract not set for this network", "err");
  const p2 = currentOpenPhase();
  if (!p2) return toast("No open phase for your wallet right now", "err");
  const P = PHASES[p2];
  const max = maxMintable(p2);
  if (qty < 1 || qty > max) return toast("Quantity out of range (max " + max + ")", "err");
  const cost = BigInt(qty) * P.price;
  if (acct && acct.balance < cost) return toast("Not enough USDC for gas + mint", "err");
  busy = true;
  setMintBtn("Confirm in wallet…");
  try {
    const data = P.sel + u(qty).slice(2);
    const value = "0x" + cost.toString(16);
    const hash = await wallet.request({
      method: "eth_sendTransaction",
      params: [{ from: account, to: net().contract, data, value }],
    });
    setMintBtn("Minting…");
    toast("Tx sent: " + hash.slice(0, 14) + "…");
    for (let i = 0; i < 90; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const rc = await rpc("eth_getTransactionReceipt", [hash]).catch(() => null);
      if (rc) {
        if (rc.status === "0x1") {
          toast("✅ Minted " + qty + " passport(s)!", "ok");
          await refreshAll();
          loadMyPassports();
        } else toast("Mint reverted on-chain", "err");
        break;
      }
    }
  } catch (e) {
    toast("Mint failed: " + (e.message || e), "err");
  }
  busy = false;
  setMintBtn();
}
let busy = false;
function setMintBtn(txt) {
  const b = el("mintbtn");
  if (txt) { b.textContent = txt; b.disabled = true; return; }
  b.disabled = busy;
}

// ============================== my passports ==============================
async function loadMyPassports() {
  const grid = el("mygrid");
  const empty = el("myempty");
  if (!account) { grid.innerHTML = ""; empty.style.display = "block"; return; }
  empty.style.display = "none";
  grid.innerHTML = '<div class="loading">Loading your passports…</div>';
  try {
    const n = du(await ccall(S.ownerTokens, [a32(account)]));
    const ids = [];
    for (let i = 0n; i < n; i++) {
      ids.push(Number(du(await ccall(S.tokenOfOwnerByIndex, [a32(account), u(i)]))));
    }
    const tokens = await Promise.all(ids.map(readToken));
    grid.innerHTML = "";
    tokens.forEach((t) => grid.appendChild(tokenCard(t)));
    upgrade3D(grid);
  } catch (e) {
    grid.innerHTML = '<div class="loading">Could not load (offline?)</div>';
  }
}
function tokenCard(t) {
  const d = document.createElement("div");
  d.className = "tpass";
  const tierName = t.tier === 0 ? "Founding Crew" : t.tier === 1 ? "FCFS" : "Public";
  d.innerHTML =
    renderPassport(t.id, t) +
    `<div class="tpass-meta">
       <div><b>#${ART.pad4(t.id)}</b> ${CLASSES[t.classIdx]} · ${RARITY[t.classIdx]}<br><span>${tierName} · L${t.level}${t.agent ? " · " + t.agent : ""}</span></div>
       <a class="minilink" target="_blank" href="${net().explorer}/token/erc721/${net().contract}?id=${t.id}">explorer ↗</a>
     </div>
     <div class="tpass-actions">
       <button onclick="toggleOnboard(${t.id})">Onboard agent</button>
       <button onclick="attest(${t.id})">Attest task (1 USDC)</button>
     </div>
     <div class="onboard hidden" id="ob-${t.id}">
       <input id="ob-name-${t.id}" maxlength="32" placeholder="Agent name (e.g. quant-07)">
       <input id="ob-skill-${t.id}" maxlength="48" placeholder="Skill (e.g. defi-arb)">
       <button class="primary" onclick="saveOnboard(${t.id})">Save on-chain</button>
     </div>`;
  return d;
}
function toggleOnboard(id) {
  el("ob-" + id).classList.toggle("hidden");
}
async function saveOnboard(id) {
  const name = el("ob-name-" + id).value.trim();
  const skill = el("ob-skill-" + id).value.trim();
  if (!name) return toast("Agent name required", "err");
  try {
    const nh = strHex(name), sh = strHex(skill || "generalist");
    const nwords = 1 + Math.ceil(nh.length / 64);
    const padHex = (h) => { const n = Math.ceil(h.length / 64) * 64; return h.padEnd(n, "0"); };
    const w = (v) => BigInt(v).toString(16).padStart(64, "0");
    const data = S.onboardAgent + w(id) + w(3 * 32) + w((3 + nwords) * 32) + w(nh.length / 2) + padHex(nh) + w(sh.length / 2) + padHex(sh);
    const hash = await wallet.request({ method: "eth_sendTransaction", params: [{ from: account, to: net().contract, data }] });
    toast("Onboarding agent… " + hash.slice(0, 12) + "…");
    await new Promise((r) => setTimeout(r, 6000));
    await refreshAll();
    loadMyPassports();
    toast("✅ Agent onboarded", "ok");
  } catch (e) {
    toast("Onboard failed: " + (e.message || e), "err");
  }
}
async function attest(id) {
  if (!account) return toast("Connect wallet first", "err");
  try {
    const hash = await wallet.request({
      method: "eth_sendTransaction",
      params: [{ from: account, to: net().contract, data: S.attestTask + u(id).slice(2), value: "0x" + (10n ** 18n).toString(16) }],
    });
    toast("Attestation sent… " + hash.slice(0, 12) + "…");
    await new Promise((r) => setTimeout(r, 6000));
    await refreshAll();
    loadMyPassports();
  } catch (e) {
    toast("Attest failed: " + (e.message || e), "err");
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
    bar.innerHTML = net().contract
      ? chip("status: offline — retrying…", "dim")
      : chip("mainnet contract pending — showing testnet data", "dim");
    return;
  }
  const now = BigInt(Math.floor(Date.now() / 1000));
  const o = phaseOpen(state, now);
  bar.innerHTML =
    chip(`minted ${state.total} / 2500`) +
    (o.wl ? chip(`WL open · ${state.wl}/1000`, "gold") : chip(`WL ${state.wl}/1000 · ${state.wl >= 1000n ? "sold out" : "closed"}`, "dim")) +
    (o.fcfs ? chip(`FCFS OPEN · ${state.fcfs}/1000`, "gold") : chip(`FCFS ${state.fcfs}/1000 · opens in ${countdown(state.fcfsStart)}`, state.fcfsStart > now ? "dim" : "")) +
    (o.pub ? chip(`PUBLIC OPEN · ${state.pub}/500`, "gold") : chip(`Public ${state.pub}/500 · opens in ${countdown(state.pubStart)}`, "dim")) +
    chip(net().name, "net");
}
function renderPhaseCards() {
  const wrap = el("phasecards");
  wrap.innerHTML = "";
  ["wl", "fcfs", "pub"].forEach((ph) => {
    const P = PHASES[ph];
    const minted = { wl: state ? state.wl : 0n, fcfs: state ? state.fcfs : 0n, pub: state ? state.pub : 0n }[ph];
    const cap = P.cap + (state && ph === "fcfs" ? state.extra : 0n);
    const now = BigInt(Math.floor(Date.now() / 1000));
    const o = state ? phaseOpen(state, now)[ph] : null;
    const starts = ph === "fcfs" ? state && state.fcfsStart : ph === "pub" ? state && state.pubStart : 0n;
    let badge, cls;
    if (o) { badge = "OPEN"; cls = "open"; }
    else if (minted >= cap) { badge = "SOLD OUT"; cls = "out"; }
    else if (ph === "wl") { badge = "BY WHITELIST"; cls = "dim"; }
    else { badge = "OPENS IN " + countdown(starts).toUpperCase(); cls = "dim"; }
    const pct = cap ? Number(minted * 100n / cap) : 0;
    const c = document.createElement("div");
    c.className = "phase" + (o ? " active" : "");
    c.innerHTML = `
      <div class="phase-top"><span class="phase-name">${P.label}</span><span class="badge ${cls}">${badge}</span></div>
      <div class="phase-price">${P.priceStr} <span>USDC</span></div>
      <div class="phase-bar"><i style="width:${pct}%"></i></div>
      <div class="phase-sub">${minted} / ${cap} · max ${P.maxPer} / wallet ${P.gold ? "· random: <b>gold</b> or FCFS" : ""}</div>`;
    wrap.appendChild(c);
  });
}
function renderMintControls() {
  const ph = currentOpenPhase();
  const info = el("mintinfo");
  const btn = el("mintbtn");
  const total = el("minttotal");
  if (!account) {
    info.innerHTML = "Connect your wallet to mint. Pays in <b>USDC (native)</b> — the same asset that pays gas on Arc.";
    btn.textContent = "Connect & Mint";
    btn.disabled = false;
    total.textContent = "";
    return;
  }
  if (!ph) {
    const st = state;
    const now = BigInt(Math.floor(Date.now() / 1000));
    let msg = "No open phase for your wallet right now.";
    if (st && !st.wlOpen && st.fcfsStart > now) msg = `WL closed for you — FCFS opens in <b>${countdown(st.fcfsStart)}</b>.`;
    else if (st && st.fcfsStart <= now && st.pubStart > now) msg = "FCFS sold out — Public opens in <b>" + countdown(st.pubStart) + "</b>.";
    info.innerHTML = msg;
    btn.textContent = "Mint closed";
    btn.disabled = true;
    return;
  }
  const P = PHASES[ph];
  const max = maxMintable(ph);
  if (qty > max) qty = Math.max(1, max);
  el("qty").value = qty;
  total.innerHTML = `Total: <b>${(qty * Number(P.price) / 1e18).toLocaleString()} USDC</b> (${qty} × ${P.priceStr})`;
  const claimed = ph === "wl" ? (acct ? acct.wlPer : 0n) : (acct ? acct.tierMinted[PHASE_IDX[ph]] : 0n);
  info.innerHTML = `Minting in <b>${P.label}</b> · you've claimed ${claimed}/${P.maxPer} · WL status: ${acct && acct.wl ? "<b>whitelisted ✓</b>" : "—"}`;
  btn.textContent = `Mint ${qty} Passport${qty > 1 ? "s" : ""}`;
  btn.disabled = max < 1 || busy;
  if (max < 1) btn.textContent = "Sold out for you";
}
function renderAccount() {
  const box = el("acctbox");
  if (!account) { box.innerHTML = ""; return; }
  box.innerHTML = `
    <span class="chip net" title="${account}">${short(account)}</span>
    <span class="chip">balance: <b>${acct ? fmtUSDC(acct.balance) : "…"}</b> USDC</span>
    ${acct && acct.wl ? chip("WL ✓", "gold") : ""}
    <button class="btnlink" onclick="copyTxt('${account}', 'Address')">copy</button>`;
}
function renderAll() {
  renderStatus();
  if (state) {
    renderPhaseCards();
    renderMintControls();
  }
  renderAccount();
}
async function refreshAll() {
  if (!net().contract) {
    state = null;
    renderAll();
    return;
  }
  try {
    state = await readState();
    stateErr = false;
  } catch (e) {
    state = null;
    stateErr = true;
  }
  try { acct = await readAccount(); } catch (e) { acct = null; }
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
document.addEventListener("DOMContentLoaded", () => {
  renderHero();
  renderCrewGrid();
  upgrade3D(el("heropassport"), { glow: true });
  upgrade3D(el("crewgrid"));
  el("connect").addEventListener("click", connect);
  el("mintbtn").addEventListener("click", doMint);
  el("wl-save").addEventListener("click", saveWL);
  el("wl-count").textContent = wlList().length;
  document.querySelectorAll(".copyaddr").forEach((b) =>
    b.addEventListener("click", () => copyTxt(b.dataset.addr, b.dataset.label))
  );
  const q = el("qty");
  el("qminus").addEventListener("click", () => { qty = Math.max(1, qty - 1); q.value = qty; renderMintControls(); });
  el("qplus").addEventListener("click", () => { qty = Math.min(50, qty + 1); q.value = qty; renderMintControls(); });
  q.addEventListener("input", () => { qty = Math.max(1, Math.min(50, parseInt(q.value || "1", 10))); });
  renderStatus();
  refreshAll();
  setInterval(refreshAll, 15000);
});
