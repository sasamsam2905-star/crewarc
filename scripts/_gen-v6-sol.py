#!/usr/bin/env python3
"""v6 SOL part only (art.js already applied). NO backslashes anywhere in this file."""
import math, os
os.chdir('/home/user/crew')

SQ = chr(39)
DQ = chr(34)
IND = ' ' * 16
def sline(svg, comma=True):
    return IND + DQ + svg + DQ + (',' if comma else '') + '\n'

def top_text(cx, cy, r, txt, fs, adv, glyph):
    n = len(txt)
    span = ((n - 1) * adv + glyph) / r
    out = []
    for i, ch in enumerate(txt):
        a = math.pi / 2 - span / 2 + (span * i / (n - 1))
        x = cx - r * math.cos(a); y = cy - r * math.sin(a)
        rot = math.degrees(a) - 90
        out.append("<text x='" + f"{x:.1f}" + "' y='" + f"{y:.1f}" + "' transform='rotate(" + f"{rot:.1f}" + " " + f"{x:.1f}" + " " + f"{y:.1f}" + ")' text-anchor='middle' dominant-baseline='central' font-family='monospace' font-size='" + str(fs) + "' font-weight='bold' fill='#8a6d1f'>" + ch + "</text>")
    return out

def bot_text(cx, cy, r, txt, fs, adv, glyph):
    n = len(txt)
    span = ((n - 1) * adv + glyph) / r
    out = []
    for i, ch in enumerate(txt):
        a = math.pi / 2 - span / 2 + (span * i / (n - 1))
        x = cx - r * math.cos(a); y = cy + r * math.sin(a)
        rot = 90 - math.degrees(a)
        out.append("<text x='" + f"{x:.1f}" + "' y='" + f"{y:.1f}" + "' transform='rotate(" + f"{rot:.1f}" + " " + f"{x:.1f}" + " " + f"{y:.1f}" + ")' text-anchor='middle' dominant-baseline='central' font-family='monospace' font-size='" + str(fs) + "' font-weight='bold' fill='#8a6d1f'>" + ch + "</text>")
    return out

def star4(cx, cy, r=7, w=1.8):
    return ("<path d='M" + str(cx) + " " + str(cy - r) + " L" + str(cx + w) + " " + str(cy - w) +
            " L" + str(cx + r) + " " + str(cy) + " L" + str(cx + w) + " " + str(cy + w) +
            " L" + str(cx) + " " + str(cy + r) + " L" + str(cx - w) + " " + str(cy + w) +
            " L" + str(cx - r) + " " + str(cy) + " L" + str(cx - w) + " " + str(cy - w) +
            " Z' fill='#C9A227'/>")

gc_parts = []
for i in range(8):
    gc_parts.append("<path d='M0 " + str(110 + i * 15) + " Q" + str(44 + i * 9) + " " + str(26 + i * 7) + " " + str(150 + i * 12) + " 0'/>")
    gc_parts.append("<path d='M" + str(110 + i * 15) + " 0 Q" + str(26 + i * 7) + " " + str(44 + i * 9) + " 0 " + str(150 + i * 12) + "'/>")
GC_NEW = "<g id='gc' stroke='#C9A227' stroke-width='0.6' fill='none' opacity='0.45'>" + "".join(gc_parts) + "</g>"

GLOBE_NEW = [
    "<circle cx='493' cy='120' r='48' fill='none' stroke='#C9A227' stroke-width='1.2'/>",
    "<g stroke='#C9A227' fill='none' stroke-width='1.5'><circle cx='493' cy='120' r='31'/><ellipse cx='493' cy='120' rx='15' ry='31' stroke-width='1'/><line x1='493' y1='89' x2='493' y2='151' stroke-width='1'/><line x1='458' y1='120' x2='528' y2='120' stroke-width='1'/></g>",
    "<circle cx='493' cy='120' r='1.5' fill='#C9A227' stroke='none'/>",
    " ".join(top_text(493, 120, 39, "CREW PROTOCOL", 6.5, 5.6, 3.9)),
    " ".join(bot_text(493, 120, 39, "WE BUILD WORLDS", 6.5, 5.6, 3.9)),
    star4(455, 120),
    star4(531, 120),
]

HEAD_NEW = [
    "<circle cx='300' cy='94' r='2' fill='#141414' stroke='none'/>",
    "<path d='M300 100 L300 114' stroke='#141414' stroke-width='1.2'/>",
    "<path d='M300 116 L212 234' stroke='#141414' stroke-width='1.2'/>",
    "<path d='M300 116 L388 234' stroke='#141414' stroke-width='1.2'/>",
    "<circle cx='212' cy='234' r='3' fill='#141414' stroke='none'/>",
    "<circle cx='388' cy='234' r='3' fill='#141414' stroke='none'/>",
    "<path d='M300 116 L300 252' stroke='#141414' stroke-width='1.5'/>",
    "<circle cx='300' cy='149' r='2.5' fill='#141414' stroke='none'/>",
    "<path d='M300 160 L283 189 L317 189 Z' fill='url(#gg)' stroke='#8a6d1f' stroke-width='0.8'/>",
    "<path d='M150 306 A149 149 0 0 1 446 306' stroke='#141414' stroke-width='1.2' stroke-dasharray='4 5' opacity='0.75'/>",
    "<path d='M211 233 A151 151 0 0 1 388 233' stroke='#141414' stroke-width='1.8'/>",
    "<path d='M195 259 A161 161 0 0 1 404 259' stroke='#141414' stroke-width='1.8'/>",
    "<path d='M293 240 L300 250 L307 240' fill='none' stroke='#141414' stroke-width='1.5'/>",
    "<path d='M300 250 L300 261' stroke='#141414' stroke-width='1.5'/>",
    "<path d='M145 313 L248 313' stroke='#141414' stroke-width='1.2'/>",
    "<path d='M352 313 L455 313' stroke='#141414' stroke-width='1.2'/>",
    "<path d='M145 306 L145 320' stroke='#141414' stroke-width='1.2'/>",
    "<path d='M455 306 L455 320' stroke='#141414' stroke-width='1.2'/>",
    "<circle cx='145' cy='313' r='2.5' fill='#C9A227' stroke='none'/>",
    "<circle cx='455' cy='313' r='2.5' fill='#C9A227' stroke='none'/>",
]

def ast(x1, y1, x2, y2):
    return "<path d='M" + str(x1) + " " + str(y1) + " L" + str(x2) + " " + str(y2) + "' stroke-width='2.5'/>"

MAN_NEW = [
    "<circle cx='300' cy='313' r='52' fill='none' stroke='#141414' stroke-width='1.2'/>",
    "<g stroke='#C9A227' fill='none'>",
    "<circle cx='300' cy='313' r='40' stroke-width='4' stroke-dasharray='1.8 2.6'/>",
    ast(300, 279, 300, 347),
    ast(270.6, 296, 329.4, 330),
    ast(270.6, 330, 329.4, 296),
    "</g>",
    "<circle cx='300' cy='279' r='1.8' fill='#C9A227' stroke='none'/>",
    "<circle cx='300' cy='347' r='1.8' fill='#C9A227' stroke='none'/>",
    "<circle cx='270.6' cy='296' r='1.8' fill='#C9A227' stroke='none'/>",
    "<circle cx='329.4' cy='330' r='1.8' fill='#C9A227' stroke='none'/>",
    "<circle cx='270.6' cy='330' r='1.8' fill='#C9A227' stroke='none'/>",
    "<circle cx='329.4' cy='296' r='1.8' fill='#C9A227' stroke='none'/>",
    "<circle cx='285' cy='312' r='1.8' fill='#C9A227' stroke='none'/>",
    "<circle cx='300' cy='313' r='2' fill='#C9A227' stroke='none'/>",
    "<path d='M283 289 L297 303' stroke='#C9A227' stroke-width='1.2'/>",
]

sol = open('contracts/lib/CrewArtGold.sol').read()
assert chr(92) not in GC_NEW and all(chr(34) not in t for t in GLOBE_NEW + HEAD_NEW + MAN_NEW), "content must have no double quotes"

# gc line (middle of list, comma)
gc_old = "<g id='gc' stroke='#C9A227' stroke-width='0.8' fill='none' opacity='0.5'>"
i = sol.index(IND + DQ + gc_old)
j = sol.index(DQ + ",\n", i) + 3
assert sol[j - 3:j] == DQ + ",\n"
sol = sol[:i] + sline(GC_NEW) + sol[j:]

# globe block
g_start_marker = sline("<g stroke='#C9A227' fill='none' stroke-width='2'>")
g_end_marker = "WE BUILD WORLDS</text>" + DQ + ",\n"
gs = sol.index(g_start_marker)
ge = sol.index(g_end_marker) + len(g_end_marker)
globe_sol = "".join(sline(t) for t in GLOBE_NEW)
sol = sol[:gs] + globe_sol + sol[ge:]

# head decor
h_first = sline("<circle cx='300' cy='158' r='3' fill='#141414' stroke='none'/>")
h_last = sline("<circle cx='460' cy='348' r='3' fill='#C9A227' stroke='none'/>")
assert h_first in sol, "h_first missing"
hs = sol.index(h_first)
he = sol.index(h_last) + len(h_last)
head_sol = "".join(sline(t) for t in HEAD_NEW)
sol = sol[:hs] + head_sol + sol[he:]

# old gold triangle
tri_old = sline("<path d='M300 204 L285 226 L315 226 Z' fill='url(#gg)' stroke='#8a6d1f' stroke-width='1'/>")
assert tri_old in sol, "tri missing"
sol = sol.replace(tri_old, '')

# mandala block; last arg of the portrait is </g> without comma
m_first = sline("<g stroke='#C9A227'>") + sline("<circle cx='300' cy='348' r='37' stroke-width='2'/>")
m_last = sline("<circle cx='288' cy='342' r='2.5' fill='#C9A227' stroke='none'/>") + sline("</g>", comma=False)
assert m_first in sol, "m_first missing"
assert m_last in sol, "m_last missing"
ms = sol.index(m_first)
me = sol.index(m_last) + len(m_last)
mand_lines = [sline(t) for t in MAN_NEW]
mand_sol = "".join(mand_lines) + sline("</g>", comma=False)
sol = sol[:ms] + mand_sol + sol[me:]

open('contracts/lib/CrewArtGold.sol', 'w').write(sol)
print('sol ok, braces:', sol.count('{'), sol.count('}'))
