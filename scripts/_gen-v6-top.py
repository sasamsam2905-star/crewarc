#!/usr/bin/env python3
"""v6: rebuild top section of gold card (roundel + head decor + corners)
to match 02-founding-crew.png. Keeps lower face unchanged. Both files in sync."""
import math, os
os.chdir('/home/user/crew')

# ---------- curved text helpers (static glyphs) ----------
def top_text(cx, cy, r, txt, fs, adv, glyph, weight=""):
    n = len(txt)
    span = ((n - 1) * adv + glyph) / r
    w = f" font-weight='{weight}'" if weight else ""
    out = []
    for i, ch in enumerate(txt):
        a = math.pi / 2 - span / 2 + (span * i / (n - 1))
        x = cx - r * math.cos(a); y = cy - r * math.sin(a)
        rot = math.degrees(a) - 90
        out.append(f"<text x='{x:.1f}' y='{y:.1f}' transform='rotate({rot:.1f} {x:.1f} {y:.1f})' text-anchor='middle' dominant-baseline='central' font-family='monospace' font-size='{fs}'{w} fill='#8a6d1f'>{ch}</text>")
    return out

def bot_text(cx, cy, r, txt, fs, adv, glyph, weight=""):
    n = len(txt)
    span = ((n - 1) * adv + glyph) / r
    w = f" font-weight='{weight}'" if weight else ""
    out = []
    for i, ch in enumerate(txt):
        a = math.pi / 2 - span / 2 + (span * i / (n - 1))
        x = cx - r * math.cos(a); y = cy + r * math.sin(a)
        rot = 90 - math.degrees(a)
        out.append(f"<text x='{x:.1f}' y='{y:.1f}' transform='rotate({rot:.1f} {x:.1f} {y:.1f})' text-anchor='middle' dominant-baseline='central' font-family='monospace' font-size='{fs}'{w} fill='#8a6d1f'>{ch}</text>")
    return out

def star4(cx, cy, r=7, w=1.8):
    return (f"<path d='M{cx} {cy-r} L{cx+w} {cy-w} L{cx+r} {cy} L{cx+w} {cy+w} "
            f"L{cx} {cy+r} L{cx-w} {cy+w} L{cx-r} {cy} L{cx-w} {cy-w} Z' fill='#C9A227'/>")

# ---------- 1. corner guilloche (dense mesh) ----------
gc_parts = []
for i in range(8):
    gc_parts.append(f"<path d='M0 {110+i*15} Q{44+i*9} {26+i*7} {150+i*12} 0'/>")
    gc_parts.append(f"<path d='M{110+i*15} 0 Q{26+i*7} {44+i*9} 0 {150+i*12}'/>")
GC_NEW = "<g id='gc' stroke='#C9A227' stroke-width='0.6' fill='none' opacity='0.45'>" + "".join(gc_parts) + "</g>"

# ---------- 2. globe roundel (center 493,120) ----------
GLOBE_NEW = [
    "<circle cx='493' cy='120' r='48' fill='none' stroke='#C9A227' stroke-width='1.2'/>",
    "<g stroke='#C9A227' fill='none' stroke-width='1.5'><circle cx='493' cy='120' r='31'/><ellipse cx='493' cy='120' rx='15' ry='31' stroke-width='1'/><line x1='493' y1='89' x2='493' y2='151' stroke-width='1'/><line x1='458' y1='120' x2='528' y2='120' stroke-width='1'/></g>",
    "<circle cx='493' cy='120' r='1.5' fill='#C9A227' stroke='none'/>",
    " ".join(top_text(493, 120, 39, "CREW PROTOCOL", 6.5, 5.6, 3.9, "bold")),
    " ".join(bot_text(493, 120, 39, "WE BUILD WORLDS", 6.5, 5.6, 3.9, "bold")),
    star4(455, 120),
    star4(531, 120),
]

# ---------- 3. new head decor (replaces old spire/arcs/crosshair) ----------
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

# new mandala (center 300,313, r52)
ast = lambda x1, y1, x2, y2: f"<path d='M{x1} {y1} L{x2} {y2}' stroke-width='2.5'/>"
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

# ---------- 4. apply to art.js ----------
js = open('svg/art.js').read()

# gc
gc_old_start = "<g id='gc' stroke='#C9A227' stroke-width='0.8' fill='none' opacity='0.5'>"
i = js.index(gc_old_start)
j = js.index('</g>', i) + len('</g>')
js = js[:i] + GC_NEW + js[j:]

# globe block: from `<g stroke='#C9A227' fill='none' stroke-width='2'>` in goldPassport through the two text lines
g_start = js.index("    `<g stroke='#C9A227' fill='none' stroke-width='2'>` +\n")
g_end_marker = "WE BUILD WORLDS</text>` +\n"
g_end = js.index(g_end_marker) + len(g_end_marker)
globe_js = "".join("    `" + s + "` +\n" for s in GLOBE_NEW)
js = js[:g_start] + globe_js + js[g_end:]

# head decor block in FOUNDING_PORTRAIT
h_first = "  `<circle cx='300' cy='158' r='3' fill='#141414' stroke='none'/>` +\n"
h_last = "  `<circle cx='460' cy='348' r='3' fill='#C9A227' stroke='none'/>` +\n"
hs = js.index(h_first)
he = js.index(h_last) + len(h_last)
head_js = "".join("  `" + s + "` +\n" for s in HEAD_NEW)
js = js[:hs] + head_js + js[he:]

# old gold triangle -> removed (new one in HEAD_NEW)
tri_old = "  `<path d='M300 204 L285 226 L315 226 Z' fill='url(#gg)' stroke='#8a6d1f' stroke-width='1'/>` +\n"
assert tri_old in js
js = js.replace(tri_old, "")

# old mandala block -> new
m_first = "  `<g stroke='#C9A227'>` +\n  `<circle cx='300' cy='348' r='37' stroke-width='2'/>` +\n"
assert m_first in js
m_last = "  `<circle cx='288' cy='342' r='2.5' fill='#C9A227' stroke='none'/>` +\n  `</g>`;\n"
ms = js.index(m_first)
me = js.index(m_last) + len(m_last)
mand_js = "".join("  `" + s + "` +\n" for s in MAN_NEW) + "  `</g>`;\n"
js = js[:ms] + mand_js + js[me:]
open('svg/art.js', 'w').write(js)
print('art.js ok')

# ---------- 5. apply to CrewArtGold.sol ----------
sol = open('contracts/lib/CrewArtGold.sol').read()
q = lambda s: '"' + s.replace('"', '\\"') + '"'

# gc
i = sol.index('"' + gc_old_start)
j = sol.index('",\n', i) + 3
sol = sol[:i] + q(GC_NEW) + ',\n' + sol[j+3:]

# globe block
g_start = sol.index('                "<g stroke=\'#C9A227\' fill=\'none\' stroke-width=\'2\'>",\n')
g_end = sol.index("WE BUILD WORLDS</text>\",\n") + len("WE BUILD WORLDS</text>\",\n")
globe_sol = "".join('                ' + q(s) + ',\n' for s in GLOBE_NEW)
sol = sol[:g_start] + globe_sol + sol[g_end:]

# head decor
h_first = '                "<circle cx=\'300\' cy=\'158\' r=\'3\' fill=\'#141414\' stroke=\'none\'>",\n'
h_last = '                "<circle cx=\'460\' cy=\'348\' r=\'3\' fill=\'#C9A227\' stroke=\'none\'>",\n'
hs = sol.index(h_first)
he = sol.index(h_last) + len(h_last)
head_sol = "".join('                ' + q(s) + ',\n' for s in HEAD_NEW)
sol = sol[:hs] + head_sol + sol[he:]

# old gold triangle
tri_old = '                "<path d=\'M300 204 L285 226 L315 226 Z\' fill=\'url(#gg)\' stroke=\'#8a6d1f\' stroke-width=\'1\'>",\n'
assert tri_old in sol
sol = sol.replace(tri_old, '')

# old mandala block
m_first = '''                "<g stroke='#C9A227'>",
                "<circle cx='300' cy='348' r='37' stroke-width='2'/>",
'''
m_last = '''                "<circle cx='288' cy='342' r='2.5' fill='#C9A227' stroke='none'/>",
                "</g>"
'''
ms = sol.index(m_first)
me = sol.index(m_last) + len(m_last)
mand_lines = ['                ' + q(s) + ',\n' for s in MAN_NEW]
mand_sol = "".join(mand_lines) + '                "</g>"\n'
sol = sol[:ms] + mand_sol + sol[me:]
open('contracts/lib/CrewArtGold.sol', 'w').write(sol)
print('sol ok, braces:', sol.count('{'), sol.count('}'))
