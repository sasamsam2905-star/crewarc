// renders preview SVGs (gold founding + standard) from the current art.js
const path = require('path');
const { passportSvg, packWidths } = require('/home/user/crew/svg/art.js');
const { keccak256, toUtf8Bytes, zeroPadValue, toBeHex, concat } = require('/home/user/crew/node_modules/ethers');
const fs = require('fs');
function bcN(id) {
  const h = BigInt(keccak256(concat([toUtf8Bytes("bc"), zeroPadValue(toBeHex(id), 32)])));
  const widths = [];
  for (let i = 0; i < 32; i++) widths.push(2 + Number((h >> BigInt(8 * i)) & 3n));
  return packWidths(widths);
}
const out = process.argv[2] || 'v6';
const gold = { classIdx: 5, tier: 0, level: 3, stamps: 15, agent: "crew-alpha", bcN: bcN(1), className: "ORACLE", rarityName: "RARE" };
fs.writeFileSync(`/home/user/crew/preview/token-gold-${out}.svg`, passportSvg(1, gold));
const std = { classIdx: 5, tier: 2, level: 2, stamps: 15, agent: "crew-alpha", bcN: bcN(2), className: "ORACLE", rarityName: "RARE" };
fs.writeFileSync(`/home/user/crew/preview/token-standard-${out}.svg`, passportSvg(2, std));
console.log("svg written:", out);
