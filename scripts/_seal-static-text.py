#!/usr/bin/env python3
"""Replace seal textPath with static per-glyph text (renders in all engines)."""
import math, os, re
os.chdir('/home/user/crew')

FS = "font-family='monospace' font-size='7.5' letter-spacing='0' fill='#8a6d1f'"

def top_text(cx, cy, r, txt):
    adv, glyph = 6.0, 4.5
    n = len(txt)
    span = ((n - 1) * adv + glyph) / r
    out = []
    for i, ch in enumerate(txt):
        a = math.pi / 2 - span / 2 + (span * i / (n - 1))
        x = cx - r * math.cos(a); y = cy - r * math.sin(a)
        rot = math.degrees(a) - 90
        out.append(f"<text x='{x:.1f}' y='{y:.1f}' transform='rotate({rot:.1f} {x:.1f} {y:.1f})' text-anchor='middle' dominant-baseline='central' {FS}>{ch}</text>")
    return out

def bot_text(cx, cy, r, txt):
    adv, glyph = 6.0, 4.5
    n = len(txt)
    span = ((n - 1) * adv + glyph) / r
    out = []
    for i, ch in enumerate(txt):
        a = math.pi / 2 - span / 2 + (span * i / (n - 1))  # from left, through bottom
        x = cx - r * math.cos(a); y = cy + r * math.sin(a)
        rot = 90 - math.degrees(a)
        out.append(f"<text x='{x:.1f}' y='{y:.1f}' transform='rotate({rot:.1f} {x:.1f} {y:.1f})' text-anchor='middle' dominant-baseline='central' {FS}>{ch}</text>")
    return out

top = " ".join(top_text(95, 545, 38, "CREW PROTOCOL"))
bot = " ".join(bot_text(95, 545, 36, "FOUNDING MEMBER"))

# ---------- CrewArtGold.sol ----------
sol = open('contracts/lib/CrewArtGold.sol').read()
sp1 = '''                "<path id='sp1' d='M57 545 A38 38 0 0 1 133 545' fill='none'/>",
'''
sp2 = '''                "<path id='sp2' d='M59 545 A36 36 0 0 0 131 545' fill='none'/>",
'''
assert sp1 in sol and sp2 in sol, "sp1/sp2 not found in sol"
sol = sol.replace(sp1, '').replace(sp2, '')

tp1 = '''                "<text font-family='monospace' font-size='7.5' letter-spacing='1.5' fill='#8a6d1f'><textPath href='#sp1' startOffset='50%' text-anchor='middle'>CREW PROTOCOL</textPath></text>",
'''
tp2 = '''                "<text font-family='monospace' font-size='7.5' letter-spacing='1.5' fill='#8a6d1f'><textPath href='#sp2' startOffset='50%' text-anchor='middle'>FOUNDING MEMBER</textPath></text>",
'''
assert tp1 in sol and tp2 in sol, "textPath lines not found in sol"
sol = sol.replace(tp1, '                "' + top + '",\n')
sol = sol.replace(tp2, '                "' + bot + '",\n')
open('contracts/lib/CrewArtGold.sol', 'w').write(sol)
print("sol ok")

# ---------- art.js ----------
js = open('svg/art.js').read()
jsp1 = """    `<path id='sp1' d='M57 545 A38 38 0 0 1 133 545' fill='none'/>` +\n"""
jsp2 = """    `<path id='sp2' d='M59 545 A36 36 0 0 0 131 545' fill='none'/>` +\n"""
assert jsp1 in js and jsp2 in js, "sp1/sp2 not found in js"
js = js.replace(jsp1, '').replace(jsp2, '')
jt1 = """    `<text font-family='monospace' font-size='7.5' letter-spacing='1.5' fill='#8a6d1f'><textPath href='#sp1' startOffset='50%' text-anchor='middle'>CREW PROTOCOL</textPath></text>` +\n"""
jt2 = """    `<text font-family='monospace' font-size='7.5' letter-spacing='1.5' fill='#8a6d1f'><textPath href='#sp2' startOffset='50%' text-anchor='middle'>FOUNDING MEMBER</textPath></text>` +\n"""
assert jt1 in js and jt2 in js, "textPath lines not found in js"
js = js.replace(jt1, '    `' + top + '` +\n')
js = js.replace(jt2, '    `' + bot + '` +\n')
open('svg/art.js', 'w').write(js)
print("js ok")
