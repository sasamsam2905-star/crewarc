const { ethers } = require('ethers');
const fs = require('fs');
const art = require('../svg/art');
const p = new ethers.JsonRpcProvider('https://rpc.testnet.arc.io');
const C = '0x258Cbb33A0FEA6674CC27F87B6a608641B265110';
const CLS = ['Builder','Scout','Trader','Diplomat','Guard','Oracle','Pioneer','Auditor'];
const RAR = ['Common','Common','Common','Uncommon','Uncommon','Rare','Rare','Legendary'];
const u = (v) => '0x' + BigInt(v).toString(16).padStart(64, '0');
async function ccall(sel, arg) {
  return p.send('eth_call', [{ to: C, data: sel + u(arg).slice(2) }, 'latest']);
}
const du = (h) => (h && h.length > 2 ? BigInt(h) : 0n);
function dstr(hex) {
  const h = hex.slice(2); const words = [];
  for (let i = 0; i + 64 <= h.length; i += 64) words.push(h.slice(i, i + 64));
  if (!words.length) return '';
  const off = Number(du('0x' + words[0])) >> 5;
  const len = Number(du('0x' + words[off]));
  const data = words.slice(off + 1, off + 1 + Math.ceil(len / 32)).join('');
  return Buffer.from(data.padEnd(len * 2, '0').slice(0, len * 2), 'hex').toString('utf8');
}
(async () => {
  const html = fs.readFileSync('website/index.html', 'utf8');
  const bcd = html.match(/window\.__BCD__ = "([^"]+)"/)[1];
  for (const id of [1, 2]) {
    const r = await Promise.all([
      ccall('0x4324aa21', id), ccall('0x53f96df2', id), ccall('0x6d5e3032', id),
      ccall('0x00f5e75f', id), ccall('0x089853b9', id),
    ]);
    const cls = Number(du(r[0])), tier = Number(du(r[1])), level = Number(du(r[2])), stamps = Number(du(r[3]));
    const agent = dstr(r[4]);
    const bcN = BigInt('0x' + bcd.slice((id - 1) * 16, (id - 1) * 16 + 16));
    const svg = art.passportSvg(id, { className: CLS[cls], rarityName: RAR[cls], bcN, classIdx: cls, tier, level, stamps, agent });
    fs.writeFileSync(`x/token-${id}.svg`, svg);
    console.log(`token #${id}: ${CLS[cls]} tier=${tier} level=${level} stamps=${stamps} agent='${agent}' -> x/token-${id}.svg`);
  }
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
