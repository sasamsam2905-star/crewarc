# CREW — Agent Passport of the Agentic Economy

ERC-721 "agent passport" collection for **Arc** (Circle's stablecoin-native L1).
Each token is a fully **on-chain rendered SVG** (no IPFS, no off-chain images) with
procedural class faces, tier frames, dynamic stamps and levels.

## Mint structure (supply 2,000)

| Tier | Name | Supply | Price | Max/wallet |
|---|---|---|---|---|
| 0 | Founding Crew (WL) | 500 | **0.5 USDC** | 10 |
| 1 | FCFS | 1,000 | **1 USDC** | 20 |
| 2 | Public | 500 | **10 USDC** | 5 |

Total raise: **$7,250 USDC** · 5% royalty (ERC-2981) · Payment in **native USDC** (Arc gas, 18 decimals).

## Classes (deterministic from deploy seed, exact caps)

| Class | Rarity | Supply | Accent |
|---|---|---|---|
| Builder | Common | 400 | amber |
| Scout | Common | 350 | green |
| Trader | Common | 350 | teal |
| Diplomat | Uncommon | 250 | blue |
| Guard | Uncommon | 250 | brick red |
| Oracle | Rare | 150 | purple |
| Pioneer | Rare | 150 | orange |
| Auditor | Legendary | 100 | monochrome |

## Reputation loop

- `attestTask(id)` — anyone can attest a completed task for **1 USDC** (anti-spam economic gate)
- Levels: L1 → L2 (10 att.) → L3 (50) → L4 (200) → L5 (500)
- Stamps (appear on the SVG): `ENL` (mint), `OBD` (agent onboarded), `VET` (L2), `MST` (L4)
- Phase 2 (roadmap): replace manual attestations with **x402 payment receipts**

## Repo layout

```
contracts/CrewPassport.sol   main contract (phases, classes, reputation, tokenURI)
contracts/lib/CrewArt.sol    on-chain SVG renderer (8 faces, barcode, stamps, standard card)
contracts/lib/CrewArtGold.sol gold banknote template for Founding Crew (tier 0)
test/crew.test.js            8 tests incl. full 2000-mint + on-chain/off-chain byte parity
scripts/deploy.js            deploy to Arc testnet (links CrewArt + CrewArtGold)
scripts/set-phases.js        set FCFS/Public open times (default T+24h / T+72h)
scripts/add-wl.js            whitelist addresses
scripts/verify-site.js       byte-for-byte website vs on-chain tokenURI checker
svg/render.js                off-chain preview mirror -> preview/gallery.html
website/                     built mint site (node website/build.js -> index.html)
```

## Commands

```bash
npm install
npm run compile
npm test

# testnet deploy
cp .env.example .env         # put PRIVATE_KEY of a faucet-funded wallet
npm run deploy:testnet       # deploys CrewArt + CrewPassport, prints address & seed
# add CREW_ADDRESS to .env, then:
npm run phases               # FCFS T+24h, Public T+72h (args: hours offsets)
WALLETS=0x..,0x.. npm run scripts/add-wl.js

# art preview (regenerate with real seed after deploy)
npm run gallery
node svg/render.js --seed 0x<seed-from-deploy>
```

## Arc testnet quick facts

| Field | Value |
|---|---|
| Chain ID | 5042002 |
| RPC | https://rpc.testnet.arc.io |
| Faucet | https://faucet.circle.com (test USDC) |
| Explorer | https://testnet.arcscan.app |
| Gas | USDC (native) |

Mainnet (launch 2026-09-16): chain ID **5042**, check current RPC/explorer at docs.arc.io.

## Arc-specific design notes

- **Native USDC = gas** at 18 decimals → mint prices use `msg.value` (no ERC-20 approval flow).
  ERC-20 USDC on Arc is 6 decimals — do not mix the two.
- `block.prevrandao` is **always 0** on Arc → seed uses `blockhash + timestamp + deployer`.
- Deterministic sub-second finality → no reorg handling needed.
- Blocklist/compliance enforcement exists on Arc; mint failures may be compliance-related.

## Roadmap

- [x] Fase 0: contract + on-chain SVG + tests + deploy scripts
- [x] Testnet deploy (2026-09-16): `0xcb02BcCCe774f747D9Fbf05A69fcA3e125FC9806` on Arc testnet, E2E verified
- [x] GOLD phase = 1,500 slots (2026-09-17, v14 — current live): CrewPassport `0x258Cbb33A0FEA6674CC27F87B6a608641B265110` · CrewArt `0x23C420f117C93deea7d058eC4120FB1551bF1563` · CrewArtGold2 `0x16dfD969190B61a8557b146A689f7EC83ED91f2E` · CrewArtGold `0xC5f95AAD43D49673D78A82d5a5fbCbEEde83B417` · seed `0xb89ce0a34b7648c584fc21460d9a1a5acb10e28d8011250e0075023bb6d0b730`. v14: WL/GOLD phase = 1,500 slots @ $0.50 (bag: 500 gold + 1,000 FCFS drawn without replacement -> exact 500/1000 split at sell-out); FCFS phase disabled (fcfsStart=0, "fcfs not open"); no separate FCFS phase — all 1,000 FCFS come via the GOLD bag. Public unchanged (1,000 @ $10, max 4/wallet). Total supply 2,500 = 500 gold + 1,000 FCFS + 1,000 public; raise $10,750 USDC. setPhases accepts fcfsStart=0 (skips phase-order check). Site: phase label GOLD, hero chips GOLD /1500 + FCFS via GOLD + Public /1000 (fixed stale /500), cursor ember trail. Live: token #1 Oracle tier 0 (gold) + agent crew-alpha (mint 0xbc692064…, onboard 0x3c3dea56…), token #2 Pioneer tier 0 (gold) via w3 (mint 0x84698eb6…); setWlOpen 0x0d213c9f…, phases 0x1a02cba8… (fcfs disabled, public open). Tests 8/8 (FULL MINT: 1,500x1 GOLD + 250x4 public = 2,500; mintFCFS reverts). Website byte-parity verified (tokens #1 & #2).
- [x] Public phase 1,000 @ max 4/wallet + total supply 2,500 (2026-09-17, v13 — superseded by v14):- [x] Public phase 1,000 @ max 4/wallet + total supply 2,500 (2026-09-17, v13 — current live): CrewPassport `0xd5B4a8E5968072dc6D1afE3dde8669d0364875f5` · CrewArt `0xe75b220edBf9c1141F143377B2c688D347b17925` · CrewArtGold2 `0xD22a0de0C0269D6Fb6EDcaE9B4bE1feD2BbA2185` · CrewArtGold `0x9f14d1bb452E5286b1ef18Db7d5398691260F011` · seed `0x4d63f727fef8e424365db0a8c8345d925641f9aea7703bdd6e81a7dafed945a9`. v13: MAX_SUPPLY 2,500 = 500 gold (Founding, via WL) + 1,000 FCFS (500 via WL bag + 500 FCFS phase) + 1,000 Public; PUBLIC_CAP 1,000, PUBLIC_MAX_PER 4; CLASS_CAPS 500/430/430/300/300/190/190/160; edition string on cards "/ 2500". WL phase unchanged (1,000 slots @ $0.50, on-chain random gold-or-FCFS, max 1/wallet; FCFS phase 500 @ $1). Total raise $11,000 USDC (1,000x$0.50 + 500x$1 + 1,000x$10). Live: token #1 Builder tier 1 (FCFS) + agent crew-alpha (WL mint 0x13dc8140…, onboard 0x9cdb034f…), token #2 Auditor tier 1 (FCFS) via demo wallet w3 0xC0d5CD89001626F3785532eD5CbdA2e51DE3d27E (seed keccak256("crew-w3-demo"), WL 0x3b97068b…, mint 0x6401bcda…). Tests 8/8 (FULL MINT 2,500: 1,000x1 WL + 500x1 FCFS + 250x4 public). Website byte-parity verified (tokens #1 & #2).
- [x] WL = random Founding/FCFS result (2026-09-17, v12 — superseded by v13):- [x] WL = random Founding/FCFS result (2026-09-17, v12 — current live): CrewPassport `0x28C3d61447F742c530B8C1F066a78c5d3e557128` · CrewArt `0x0b525d85972AB08Dc74e692131ef916a0fcC23c1` · CrewArtGold2 `0x18e19F7F48Df3770C516505BfD7136fccCC7339b` · CrewArtGold `0xA9Ab45B04305613b85b3a2C51D12979C12BAe7c6` · seed `0xafc45a3684039331f345a72d05e8d4617f104118c4cd25031618e1ee409b7ce6`. v12: WL phase = 1,000 slots drawn on-chain from a bag of 500 gold + 500 FCFS (sampling without replacement, keccak(seed,"wltier",id) % remaining — if WL fills, split is exactly 500/500; counters: wlMinted, foundingMinted, fcfsViaWL, wlMintedPer). FCFS phase keeps the remaining 500 of the 1,000 FCFS supply; public unchanged (500 @ $10, max 5/wallet). Per-wallet caps: WL 1 (phase-based via wlMintedPer), FCFS 1, Public 5. Total raise $6,000 USDC. Website: "WL" removed from Founding Crew labels (Whitelist phase = gold-or-FCFS), WL task form (follow @crewonarc → like&RT post (menyusul) → comment wallet address (menyusul) → paste comment link), 100% English copy, roadmap renumbered (P0 done / P1 testnet IN PROGRESS / P2 mainnet / P3 x402 / P4 ERC-8004), 3D animated cards + glowing deep-red background retained. Live: token #1 = Trader tier 0 (gold) + agent crew-alpha (WL mint tx 0xc23c3e8f…, onboard 0x77cc9d1b…); token #2 pending deployer top-up (faucet.circle.com). Tests 8/8 (FULL MINT: 1000x1 WL + 500x1 FCFS + 100x5 public = 2000, exact caps). Website byte-parity verified (token #1).
- [ ] WL campaign (X) — 500 slots @ $0.5
- [ ] Mint site (landing + mint page + passport viewer)
- [ ] Mainnet mint
- [ ] Fase 2: x402 payment receipts → stamps; ERC-8004 compatibility
