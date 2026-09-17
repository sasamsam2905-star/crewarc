#!/usr/bin/env python3
"""v7: rebuild the FOUNDING face (brows/eyes/nose/mouth/jaw/ears) to match
02-founding-crew.png. Drops the old faint group. No backslashes in this file."""
import os
os.chdir('/home/user/crew')

DQ = chr(34)
ND = ' ' * 16

# ---------- new face elements (600x840 coords) ----------
F = [
 # cranium (narrow, thin)
 "<path d='M225 300 C222 268 255 250 300 250 C345 250 378 268 375 300' stroke='#141414' stroke-width='2'/>",
 "<path d='M225 300 C221 372 232 462 262 540' stroke='#141414' stroke-width='2'/>",
 "<path d='M262 540 C272 558 286 570 300 573' stroke='#141414' stroke-width='2'/>",
 "<path d='M375 300 C379 372 368 462 338 540' stroke='#141414' stroke-width='2'/>",
 "<path d='M338 540 C328 558 314 570 300 573' stroke='#141414' stroke-width='2'/>",
 "<path d='M300 573 L300 584' stroke='#141414' stroke-width='1.2'/>",
 # temple + cheek facet lines
 "<path d='M225 300 L247 352' stroke='#141414' stroke-width='1'/>",
 "<path d='M375 300 L353 352' stroke='#141414' stroke-width='1'/>",
 "<path d='M228 322 C230 400 240 480 268 545' stroke='#141414' stroke-width='0.9'/>",
 "<path d='M240 348 C242 420 252 490 276 538' stroke='#141414' stroke-width='0.9'/>",
 "<path d='M372 322 C370 400 360 480 332 545' stroke='#141414' stroke-width='0.9'/>",
 "<path d='M360 348 C358 420 348 490 324 538' stroke='#141414' stroke-width='0.9'/>",
 # brows (thick, straight, sharp inner ends)
 "<path d='M189 364 L287 398' stroke='#141414' stroke-width='3.5'/>",
 "<path d='M411 364 L313 398' stroke='#141414' stroke-width='3.5'/>",
 # brow-ridge thin lines
 "<path d='M196 350 L283 383' stroke='#141414' stroke-width='1'/>",
 "<path d='M404 350 L317 383' stroke='#141414' stroke-width='1'/>",
 # left eye
 "<path d='M281 391 L196 385' stroke='#141414' stroke-width='1.8'/>",
 "<path d='M196 385 L185 379' stroke='#141414' stroke-width='1.8'/>",
 "<path d='M196 393 Q238 402 279 398' stroke='#141414' stroke-width='1'/>",
 "<circle cx='234' cy='390' r='9.5' stroke='#C9A227' stroke-width='2'/>",
 "<circle cx='234' cy='390' r='2.5' fill='#141414' stroke='none'/>",
 "<path d='M226 403 L226 412' stroke='#141414' stroke-width='1'/>",
 # right eye
 "<path d='M319 391 L404 385' stroke='#141414' stroke-width='1.8'/>",
 "<path d='M404 385 L415 379' stroke='#141414' stroke-width='1.8'/>",
 "<path d='M404 393 Q362 402 321 398' stroke='#141414' stroke-width='1'/>",
 "<circle cx='366' cy='390' r='9.5' stroke='#C9A227' stroke-width='2'/>",
 "<circle cx='366' cy='390' r='2.5' fill='#141414' stroke='none'/>",
 "<path d='M374 403 L374 412' stroke='#141414' stroke-width='1'/>",
 # dots under eyes
 "<circle cx='257' cy='434' r='2.2' fill='#141414' stroke='none'/>",
 "<circle cx='355' cy='434' r='2.2' fill='#141414' stroke='none'/>",
 # nose
 "<path d='M300 356 L300 514' stroke='#141414' stroke-width='1.5'/>",
 "<path d='M282 514 L302 527 L322 514' stroke='#141414' stroke-width='1.8'/>",
 "<path d='M282 514 L276 507' stroke='#141414' stroke-width='1.2'/>",
 "<path d='M322 514 L328 507' stroke='#141414' stroke-width='1.2'/>",
 "<path d='M287 428 L301 470' stroke='#141414' stroke-width='0.9'/>",
 "<path d='M351 428 L321 470' stroke='#141414' stroke-width='0.9'/>",
 # mouth
 "<path d='M268 501 L302 498 L335 501' stroke='#141414' stroke-width='2'/>",
 "<circle cx='268' cy='501' r='1.8' fill='#141414' stroke='none'/>",
 "<circle cx='335' cy='501' r='1.8' fill='#141414' stroke='none'/>",
 "<path d='M285 517 L339 517' stroke='#141414' stroke-width='1.2'/>",
 "<path d='M302 509 L302 525' stroke='#141414' stroke-width='1'/>",
 # ears (slim, higher)
 "<path d='M216 396 C198 390 190 410 196 430 C200 442 212 444 216 436' stroke='#141414' stroke-width='2'/>",
 "<path d='M206 412 C200 416 200 426 207 430' stroke='#141414' stroke-width='1.2'/>",
 "<circle cx='212' cy='452' r='1.8' fill='#141414' stroke='none'/>",
 "<path d='M384 396 C402 390 410 410 404 430 C400 442 388 444 384 436' stroke='#141414' stroke-width='2'/>",
 "<path d='M394 412 C400 416 400 426 393 430' stroke='#141414' stroke-width='1.2'/>",
 "<circle cx='388' cy='452' r='1.8' fill='#141414' stroke='none'/>",
 # side dimension ticks with gold dots
 "<path d='M189 514 L189 542' stroke='#141414' stroke-width='1'/>",
 "<circle cx='189' cy='507' r='2' fill='#C9A227' stroke='none'/>",
 "<path d='M411 514 L411 542' stroke='#141414' stroke-width='1'/>",
 "<circle cx='411' cy='507' r='2' fill='#C9A227' stroke='none'/>",
]
assert all(chr(34) not in t for t in F)

# ---------- art.js (idempotent guards) ----------
js = open('svg/art.js').read()
fg_first = "  `<g stroke='#141414' stroke-width='1.5' opacity='0.5'>` +\n"
face_first = "  `<path d='M212 330 C212 258 250 238 300 238 C350 238 388 258 388 330' stroke='#141414' stroke-width='3'/>` +\n"
face_last = "  `<circle cx='372' cy='480' r='1.8' fill='#141414' stroke='none'/>` +\n"
changed = False
if fg_first in js:
    i = js.index(fg_first)
    j = js.index("  `</g>` +\n", i) + len("  `</g>` +\n")
    js = js[:i] + js[j:]
    changed = True
if face_first in js and face_last in js:
    fi = js.index(face_first)
    fj = js.index(face_last) + len(face_last)
    face_js = "".join("  `" + t + "` +\n" for t in F)
    js = js[:fi] + face_js + js[fj:]
    changed = True
if changed:
    open('svg/art.js', 'w').write(js)
print('art.js', 'updated' if changed else 'already v7 (skipped)')

# ---------- CrewArtGold.sol ----------
sol = open('contracts/lib/CrewArtGold.sol').read()
lines = sol.split(chr(10))

def sline(svg, comma=True):
    return ND + DQ + svg + DQ + (',' if comma else '') + chr(10)

# drop faint group (g line + 12 paths + </g> line = 14 lines)
fg_i = next(i for i, l in enumerate(lines) if "opacity='0.5'>" in l and "<g" in l)
fg_close = next(i for i in range(fg_i + 1, len(lines)) if lines[i].strip() in (DQ + "</g>" + DQ, DQ + "</g>" + DQ + ','))
assert fg_close - fg_i <= 20, (fg_close - fg_i)
del lines[fg_i:fg_close + 1]

# replace face block
fa_i = next(i for i, l in enumerate(lines) if "M212 330 C212 258" in l)
la_i = next(i for i in range(fa_i, len(lines)) if "cx='372' cy='480'" in lines[i])
face_sol = [sline(t) for t in F]
lines[fa_i:la_i + 1] = face_sol
sol = chr(10).join(lines)
open('contracts/lib/CrewArtGold.sol', 'w').write(sol)
print('sol ok, braces:', sol.count('{'), sol.count('}'))
