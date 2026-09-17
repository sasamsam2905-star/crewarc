#!/usr/bin/env python3
"""Regenerate gold full-match template across art.js + CrewArtGold.sol,
and strip the stray wordmark arc / add barcode color to standard card."""
import sys
sys.path.insert(0, '/home/user/crew')
import os
os.chdir('/home/user/crew')
BS = chr(92)

# ================= 1. CrewArt.sol =================
src = open('contracts/lib/CrewArt.sol').read()
arc = '                "<path d=\'M172 76 a21 21 0 0 1 42 0\' fill=\'none\' stroke=\'#141414\' stroke-width=\'8\'/>",\n'
assert arc in src, "standard arc not found"
src = src.replace(arc, '')
old_bc = 'function barcode(uint256 id, uint256 x0, uint256 xmax) public pure returns (string memory) {'
new_bc = 'function barcode(uint256 id, uint256 x0, uint256 xmax, string memory color) public pure returns (string memory) {'
assert old_bc in src, "barcode sig not found"
src = src.replace(old_bc, new_bc)
DQ = '"'
old_rect = "' height='40' fill='#141414'/>" + DQ
new_rect = "' height='40' fill='" + DQ + ', color, ' + DQ + "'/>" + DQ
assert old_rect in src, "barcode rect not found"
src = src.replace(old_rect, new_rect)
assert src.count('barcode(id, 40, 368)') == 1
src = src.replace('barcode(id, 40, 368)', 'barcode(id, 40, 368, "#141414")')
open('contracts/lib/CrewArt.sol','w').write(src)
print("CrewArt.sol ok")

# ================= 2. art.js (standard part) =================
js = open('svg/art.js').read()
old = """function barcode(bcN, x0, xmax) {
  let out = "";
  let x = x0;
  for (let i = 0; i < 32; i++) {
    if (x > xmax) break;
    const w = 2 + Number((bcN >> BigInt(2 * (31 - i))) & 3n);
    out += `<rect x='${x}' y='682' width='${w}' height='40' fill='#141414'/>`;
    x += w + 4;
  }
  return out;
}"""
new = """function barcode(bcN, x0, xmax, color) {
  let out = "";
  let x = x0;
  for (let i = 0; i < 32; i++) {
    if (x > xmax) break;
    const w = 2 + Number((bcN >> BigInt(2 * (31 - i))) & 3n);
    out += `<rect x='${x}' y='682' width='${w}' height='40' fill='${color}'/>`;
    x += w + 4;
  }
  return out;
}"""
assert old in js, "js barcode fn not found"
js = js.replace(old, new)
assert "barcode(o.bcN, 150, 405)" in js
js = js.replace("barcode(o.bcN, 150, 405)", 'barcode(o.bcN, 150, 405, "#C9A227")')
assert "barcode(o.bcN, 40, 368)" in js
js = js.replace("barcode(o.bcN, 40, 368)", 'barcode(o.bcN, 40, 368, "#141414")')
arcjs = "    `<path d='M172 76 a21 21 0 0 1 42 0' fill='none' stroke='#141414' stroke-width='8'/>` +\n"
assert arcjs in js, "js standard arc not found"
js = js.replace(arcjs, "")
open('svg/art.js','w').write(js)
print("art.js standard ok")

# ================= 3. goldPassport full-match =================
GOLD = [
"<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 840'>",
"<defs>",
"<linearGradient id='gg' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='#8a6d1f'/><stop offset='0.5' stop-color='#d4af37'/><stop offset='1' stop-color='#f0d97a'/></linearGradient>",
"<g id='gc' stroke='#C9A227' stroke-width='0.8' fill='none' opacity='0.5'><path d='M26 120 Q60 60 120 26'/><path d='M26 150 Q70 75 150 26'/><path d='M26 185 Q85 85 185 26'/></g>",
"<path id='sp1' d='M57 545 A38 38 0 0 1 133 545' fill='none'/>",
"<path id='sp2' d='M59 545 A36 36 0 0 0 131 545' fill='none'/>",
"</defs>",
"<rect width='600' height='840' fill='#F8F3E3'/>",
"<rect x='8' y='8' width='584' height='824' fill='none' stroke='url(#gg)' stroke-width='12'/>",
"<rect x='26' y='26' width='548' height='788' fill='none' stroke='#8a6d1f' stroke-width='1.5'/>",
"<use href='#gc'/>",
"<use href='#gc' transform='translate(600 0) scale(-1 1)'/>",
"<use href='#gc' transform='translate(0 840) scale(1 -1)'/>",
"<use href='#gc' transform='translate(600 840) scale(-1 -1)'/>",
"<text x='40' y='88' font-family='Arial, Helvetica, sans-serif' font-size='58' font-weight='900' letter-spacing='3' fill='url(#gg)'>CREW</text>",
"<line x1='40' y1='100' x2='300' y2='100' stroke='#C9A227' stroke-width='1.5'/>",
]
EMBLEM = [
"<path d='M58 176 Q72 166 88 172' stroke='#C9A227' stroke-width='1.5' fill='none'/>",
"<path d='M58 184 Q70 177 84 181' stroke='#C9A227' stroke-width='1.5' fill='none'/>",
"<path d='M122 176 Q108 166 92 172' stroke='#C9A227' stroke-width='1.5' fill='none'/>",
"<path d='M122 184 Q110 177 96 181' stroke='#C9A227' stroke-width='1.5' fill='none'/>",
"<path d='M80 178 L90 190 L100 178' stroke='#C9A227' stroke-width='2' fill='none'/>",
"<path d='M90 196 L91.5 199.5 L95 201 L91.5 202.5 L90 206 L88.5 202.5 L85 201 L88.5 199.5 Z' fill='#C9A227'/>",
]
GLOBE = [
"<g stroke='#C9A227' fill='none' stroke-width='2'>",
"<circle cx='512' cy='78' r='34'/>",
"<circle cx='512' cy='78' r='27' stroke-width='1'/>",
"<ellipse cx='512' cy='78' rx='13' ry='27' stroke-width='1'/>",
"<line x1='485' y1='78' x2='539' y2='78' stroke-width='1'/>",
"<line x1='489' y1='64' x2='535' y2='64' stroke-width='0.8'/>",
"<line x1='489' y1='92' x2='535' y2='92' stroke-width='0.8'/>",
"</g>",
"<text x='512' y='128' text-anchor='middle' font-size='8' font-family='monospace' letter-spacing='1.5' fill='#8a6d1f'>CREW PROTOCOL</text>",
"<text x='512' y='138' text-anchor='middle' font-size='8' font-family='monospace' letter-spacing='1.5' fill='#8a6d1f'>WE BUILD WORLDS</text>",
]
MOTTOS = [
"<text transform='rotate(-90 36 420)' x='36' y='420' text-anchor='middle' font-size='10' letter-spacing='4' font-family='monospace' fill='#8a6d1f'>UNITED BY MISSION</text>",
"<text transform='rotate(90 566 450)' x='566' y='450' text-anchor='middle' font-size='10' letter-spacing='4' font-family='monospace' fill='#8a6d1f'>ONE CREW INFINITE FUTURES</text>",
"<circle cx='36' cy='272' r='4' fill='none' stroke='#C9A227' stroke-width='1.2'/>",
"<line x1='36' y1='264' x2='36' y2='268' stroke='#C9A227' stroke-width='1'/>",
"<line x1='36' y1='276' x2='36' y2='280' stroke='#C9A227' stroke-width='1'/>",
"<line x1='28' y1='272' x2='32' y2='272' stroke='#C9A227' stroke-width='1'/>",
"<line x1='40' y1='272' x2='44' y2='272' stroke='#C9A227' stroke-width='1'/>",
"<line x1='36' y1='556' x2='36' y2='568' stroke='#C9A227' stroke-width='1'/>",
"<path d='M566 231 L567.5 234.5 L571 236 L567.5 237.5 L566 241 L564.5 237.5 L561 236 L564.5 234.5 Z' fill='#C9A227'/>",
"<text x='566' y='258' text-anchor='middle' font-family='monospace' font-size='11' fill='#C9A227'>20</text>",
"<text x='566' y='272' text-anchor='middle' font-family='monospace' font-size='11' fill='#C9A227'>24</text>",
"<line x1='566' y1='280' x2='566' y2='292' stroke='#C9A227' stroke-width='1'/>",
"<circle cx='566' cy='300' r='2.5' fill='none' stroke='#C9A227' stroke-width='1'/>",
"<line x1='566' y1='308' x2='566' y2='316' stroke='#C9A227' stroke-width='1'/>",
]
HEXBAR = [
"<g stroke='#C9A227' fill='none' stroke-width='1.5'>",
"<path d='M70 680 l24 14 v28 l-24 14 -24 -14 v-28 z'/>",
"</g>",
"<path d='M70 694 l4 8 9 1 -6 6 1 9 -8 -4 -8 4 1 -9 -6 -6 9 -1 z' fill='#C9A227'/>",
"<path d='M142 674 L134 674 L134 730 L142 730' fill='none' stroke='#C9A227' stroke-width='2'/>",
]
BC_SOL = 'CrewArt.barcode(id, 150, 405, "#C9A227")'
BRACKET_R = "<path d='M418 674 L426 674 L426 730 L418 730' fill='none' stroke='#C9A227' stroke-width='2'/>"
ARCHIVE = [
"<circle cx='500' cy='702' r='34' fill='none' stroke='#C9A227' stroke-width='2'/>",
"<circle cx='500' cy='702' r='29' fill='none' stroke='#C9A227' stroke-width='0.8'/>",
"<text x='500' y='692' text-anchor='middle' font-size='7.5' font-family='monospace' letter-spacing='1' fill='#8a6d1f'>CREW ARCHIVE</text>",
]
ARCHIVE_SERIAL = "<text x='500' y='712' text-anchor='middle' font-size='17' font-weight='bold' font-family='monospace' fill='#8a6d1f'>"
ARCHIVE_AFTER = [
"<text x='500' y='724' text-anchor='middle' font-size='7.5' font-family='monospace' letter-spacing='1' fill='#8a6d1f'>OF 500</text>",
"<rect x='200' y='744' width='200' height='36' fill='none' stroke='url(#gg)' stroke-width='2'/>",
]
CLEARANCE = "<text x='300' y='768' text-anchor='middle' font-family='monospace' font-size='16' font-weight='bold' letter-spacing='2' fill='#8a6d1f'>CLEARANCE "
STARS = [
"<path d='M188 755 L190 760 L195 762 L190 764 L188 769 L186 764 L181 762 L186 760 Z' fill='#C9A227'/>",
"<path d='M412 755 L414 760 L419 762 L414 764 L412 769 L410 764 L405 762 L410 760 Z' fill='#C9A227'/>",
]
SEAL = [
"<circle cx='95' cy='545' r='49' fill='none' stroke='#C9A227' stroke-width='7' stroke-dasharray='2.5 2.8'/>",
"<circle cx='95' cy='545' r='43' fill='none' stroke='#C9A227' stroke-width='1.5'/>",
"<circle cx='95' cy='545' r='30' fill='none' stroke='#C9A227' stroke-width='0.8'/>",
"<text font-family='monospace' font-size='7.5' letter-spacing='1.5' fill='#8a6d1f'><textPath href='#sp1' startOffset='50%' text-anchor='middle'>CREW PROTOCOL</textPath></text>",
"<text font-family='monospace' font-size='7.5' letter-spacing='1.5' fill='#8a6d1f'><textPath href='#sp2' startOffset='50%' text-anchor='middle'>FOUNDING MEMBER</textPath></text>",
"<path d='M87 540 L95 549 L103 540' fill='none' stroke='#C9A227' stroke-width='2'/>",
"<path d='M80 535 Q88 530 94 534' fill='none' stroke='#C9A227' stroke-width='1.5'/>",
"<path d='M110 535 Q102 530 96 534' fill='none' stroke='#C9A227' stroke-width='1.5'/>",
"<text x='95' y='566' text-anchor='middle' font-family='monospace' font-size='6' letter-spacing='1' fill='#8a6d1f'>EST. 2024</text>",
"<path d='M95 516 L96.5 519.5 L100 521 L96.5 522.5 L95 526 L93.5 522.5 L90 521 L93.5 519.5 Z' fill='#C9A227'/>",
]
BADGE = [
"<rect x='438' y='505' width='120' height='86' rx='10' fill='none' stroke='#C9A227' stroke-width='2'/>",
"<rect x='444' y='511' width='108' height='74' rx='7' fill='none' stroke='#C9A227' stroke-width='0.8'/>",
"<text x='498' y='530' text-anchor='middle' font-family='monospace' font-size='10' letter-spacing='2' fill='#8a6d1f'>VERIFIED</text>",
"<g stroke='#C9A227' fill='none' stroke-width='1.2'>",
"<circle cx='498' cy='554' r='15'/>",
"<ellipse cx='498' cy='554' rx='6.5' ry='15' stroke-width='0.8'/>",
"<line x1='483' y1='554' x2='513' y2='554' stroke-width='0.8'/>",
"<line x1='486' y1='546' x2='510' y2='546' stroke-width='0.6'/>",
"<line x1='486' y1='562' x2='510' y2='562' stroke-width='0.6'/>",
"</g>",
"<circle cx='498' cy='554' r='1.5' fill='#C9A227'/>",
"<text x='498' y='579' text-anchor='middle' font-family='monospace' font-size='6.5' letter-spacing='1' fill='#8a6d1f'>ALL SYSTEMS</text>",
"<text x='498' y='588' text-anchor='middle' font-family='monospace' font-size='6.5' letter-spacing='1' fill='#8a6d1f'>NOMINAL</text>",
]
BOTTOM = [
"<path d='M286 821 Q293 815 300 819' fill='none' stroke='#C9A227' stroke-width='1.5'/>",
"<path d='M314 821 Q307 815 300 819' fill='none' stroke='#C9A227' stroke-width='1.5'/>",
"<path d='M293 819 L300 826 L307 819' fill='none' stroke='#C9A227' stroke-width='1.8'/>",
]

# ordered args: static string | ("DYN", pre, var, post) | special
args = []
for s in GOLD: args.append(s)
for s in EMBLEM + GLOBE + MOTTOS: args.append(s)
args.append(("PORT",))
for s in HEXBAR: args.append(s)
args.append(("BC",))
args.append(BRACKET_R)
for s in ARCHIVE: args.append(s)
args.append(("DYN", ARCHIVE_SERIAL, "serial4", "</text>"))
for s in ARCHIVE_AFTER: args.append(s)
args.append(("DYN", CLEARANCE, "levelTxt", "</text>"))
for s in STARS + SEAL + BADGE + BOTTOM: args.append(s)
args.append(("AGENT",))
args.append(("STS",))
args.append("</svg>")

q = lambda s: '"' + s.replace('"', BS+'"') + '"'

# ---------- Solidity ----------
sol = open('contracts/lib/CrewArtGold.sol').read()
a = sol.index('function goldPassport(')
head = sol[:a]
lines = []
for arg in args:
    if arg[0] == 'DYN':
        lines.append('                ' + q(arg[1]) + ', ' + arg[2] + ', ' + q(arg[3]))
    elif arg[0] == 'PORT':
        lines.append('                foundingPortrait()')
    elif arg[0] == 'BC':
        lines.append('                ' + BC_SOL)
    elif arg[0] == 'AGENT':
        lines.append('                agentLine')
    elif arg[0] == 'STS':
        lines.append('                sts')
    else:
        lines.append('                ' + q(arg))
body = '            abi.encodePacked(\n' + ',\n'.join(lines) + '\n            )'
new_gold = ('function goldPassport(\n'
            '        uint256 id,\n'
            '        uint8 classIdx,\n'
            '        string memory serial4,\n'
            '        string memory className,\n'
            '        string memory rarityName,\n'
            '        string memory levelTxt,\n'
            '        uint8 stamps,\n'
            '        string memory agent\n'
            '    ) public pure returns (string memory) {\n'
            '        string memory sts = "";\n'
            '        if ((stamps & 1) == 1) sts = string(abi.encodePacked(sts, CrewArt.stamp(222, 800, 14, 9, "ENL")));\n'
            '        if ((stamps & 2) == 2) sts = string(abi.encodePacked(sts, CrewArt.stamp(278, 800, 14, 9, "OBD")));\n'
            '        if ((stamps & 4) == 4) sts = string(abi.encodePacked(sts, CrewArt.stamp(334, 800, 14, 9, "VET")));\n'
            '        if ((stamps & 8) == 8) sts = string(abi.encodePacked(sts, CrewArt.stamp(390, 800, 14, 9, "MST")));\n'
            '        string memory agentLine = bytes(agent).length > 0\n'
            '            ? string(abi.encodePacked("<text x=\'150\' y=\'664\' font-family=\'monospace\' font-size=\'15\' fill=\'#8a6d1f\'>AGENT: ", agent, "</text>"))\n'
            '            : "";\n\n'
            '        return string(\n' + body + '\n        );\n    }\n}\n')
open('contracts/lib/CrewArtGold.sol','w').write(head + new_gold)
print("CrewArtGold.sol ok, braces:", (head+new_gold).count('{'), (head+new_gold).count('}'))

# ---------- art.js goldPassport ----------
js = open('svg/art.js').read()
ga = js.index('function goldPassport(id, o) {')
gb = js.index('function standardPassport(id, o) {')
JSVAR = {"serial4": "serial", "levelTxt": "L${o.level}"}
def jline(arg):
    if arg[0] == 'DYN':
        v = JSVAR.get(arg[2], arg[2])
        inner = v if '${' in v else '${' + v + '}'
        return '    `' + arg[1] + inner + arg[3] + '` +'
    if arg[0] == 'PORT':
        return '    FOUNDING_PORTRAIT +'
    if arg[0] == 'BC':
        return '    barcode(o.bcN, 150, 405, "#C9A227") +'
    if arg[0] == 'AGENT':
        return '    agentLine +'
    if arg[0] == 'STS':
        return '    sts +'
    return '    `' + arg + '` +'
jl = [jline(a) for a in args]
jl[-1] = jl[-1][:-2]
new_func = ('function goldPassport(id, o) {\n'
            '  const agentLine = o.agent\n'
            "    ? `<text x='150' y='664' font-family='monospace' font-size='15' fill='#8a6d1f'>AGENT: ${o.agent}</text>`\n"
            '    : "";\n'
            '  let sts = "";\n'
            '  if (o.stamps & 1) sts += stamp(222, 800, 14, 9, "ENL");\n'
            '  if (o.stamps & 2) sts += stamp(278, 800, 14, 9, "OBD");\n'
            '  if (o.stamps & 4) sts += stamp(334, 800, 14, 9, "VET");\n'
            '  if (o.stamps & 8) sts += stamp(390, 800, 14, 9, "MST");\n'
            '  const serial = pad4(id);\n'
            '  return (\n' + '\n'.join(jl) + '\n  );\n}\n\n')
js = js[:ga] + new_func + js[gb:]
open('svg/art.js','w').write(js)
print("art.js gold ok")
