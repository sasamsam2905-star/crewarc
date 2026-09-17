#!/usr/bin/env python3
"""v8: widen the FOUNDING face to match the reference oval (wide cheeks,
bolder wider brows/eyes, sweeping facet lines). No backslashes in this file."""
import os
os.chdir('/home/user/crew')

DQ = chr(34)
ND = ' ' * 16

F8 = [
 # cranium (wide oval)
 "<path d='M205 305 C202 262 245 242 300 242 C355 242 398 262 395 305' stroke='#141414' stroke-width='2'/>",
 "<path d='M205 305 C200 380 212 470 248 545' stroke='#141414' stroke-width='2'/>",
 "<path d='M248 545 C260 562 280 574 300 576' stroke='#141414' stroke-width='2'/>",
 "<path d='M395 305 C400 380 388 470 352 545' stroke='#141414' stroke-width='2'/>",
 "<path d='M352 545 C340 562 320 574 300 576' stroke='#141414' stroke-width='2'/>",
 "<path d='M300 576 L300 586' stroke='#141414' stroke-width='1.2'/>",
 # temple + cheek sweeping facet lines
 "<path d='M205 305 L236 360' stroke='#141414' stroke-width='1'/>",
 "<path d='M395 305 L364 360' stroke='#141414' stroke-width='1'/>",
 "<path d='M208 330 C212 410 226 490 258 548' stroke='#141414' stroke-width='0.9'/>",
 "<path d='M224 352 C226 424 238 492 268 540' stroke='#141414' stroke-width='0.9'/>",
 "<path d='M392 330 C388 410 374 490 342 548' stroke='#141414' stroke-width='0.9'/>",
 "<path d='M376 352 C374 424 362 492 332 540' stroke='#141414' stroke-width='0.9'/>",
 # brows (bolder, wider, sharp inner ends)
 "<path d='M170 362 L283 398' stroke='#141414' stroke-width='4.5'/>",
 "<path d='M430 362 L317 398' stroke='#141414' stroke-width='4.5'/>",
 # brow-ridge thin lines
 "<path d='M176 348 L280 380' stroke='#141414' stroke-width='1'/>",
 "<path d='M424 348 L320 380' stroke='#141414' stroke-width='1'/>",
 # left eye (wider)
 "<path d='M293 392 L178 384' stroke='#141414' stroke-width='1.8'/>",
 "<path d='M178 384 L166 377' stroke='#141414' stroke-width='1.8'/>",
 "<path d='M178 392 Q230 404 289 400' stroke='#141414' stroke-width='1'/>",
 "<circle cx='226' cy='389' r='10.5' stroke='#C9A227' stroke-width='2.5'/>",
 "<circle cx='226' cy='389' r='2.8' fill='#141414' stroke='none'/>",
 "<path d='M218 404 L218 414' stroke='#141414' stroke-width='1'/>",
 # right eye (wider)
 "<path d='M307 392 L422 384' stroke='#141414' stroke-width='1.8'/>",
 "<path d='M422 384 L434 377' stroke='#141414' stroke-width='1.8'/>",
 "<path d='M422 392 Q370 404 311 400' stroke='#141414' stroke-width='1'/>",
 "<circle cx='374' cy='389' r='10.5' stroke='#C9A227' stroke-width='2.5'/>",
 "<circle cx='374' cy='389' r='2.8' fill='#141414' stroke='none'/>",
 "<path d='M382 404 L382 414' stroke='#141414' stroke-width='1'/>",
 # dots under eyes
 "<circle cx='250' cy='436' r='2.2' fill='#141414' stroke='none'/>",
 "<circle cx='350' cy='436' r='2.2' fill='#141414' stroke='none'/>",
 # nose
 "<path d='M300 356 L300 512' stroke='#141414' stroke-width='1.5'/>",
 "<path d='M281 512 L302 526 L323 512' stroke='#141414' stroke-width='1.8'/>",
 "<path d='M281 512 L274 505' stroke='#141414' stroke-width='1.2'/>",
 "<path d='M323 512 L330 505' stroke='#141414' stroke-width='1.2'/>",
 "<path d='M288 430 L301 468' stroke='#141414' stroke-width='0.9'/>",
 "<path d='M352 430 L321 468' stroke='#141414' stroke-width='0.9'/>",
 # mouth
 "<path d='M264 499 L302 496 L340 499' stroke='#141414' stroke-width='2.2'/>",
 "<circle cx='264' cy='499' r='1.8' fill='#141414' stroke='none'/>",
 "<circle cx='340' cy='499' r='1.8' fill='#141414' stroke='none'/>",
 "<path d='M283 516 L337 516' stroke='#141414' stroke-width='1.2'/>",
 "<path d='M302 507 L302 523' stroke='#141414' stroke-width='1'/>",
 # ears (bigger)
 "<path d='M200 388 C178 380 168 404 176 428 C182 442 198 444 204 434' stroke='#141414' stroke-width='2.2'/>",
 "<path d='M188 404 C180 410 180 422 189 428' stroke='#141414' stroke-width='1.2'/>",
 "<circle cx='192' cy='448' r='2' fill='#141414' stroke='none'/>",
 "<path d='M400 388 C422 380 432 404 424 428 C418 442 402 444 396 434' stroke='#141414' stroke-width='2.2'/>",
 "<path d='M412 404 C420 410 420 422 411 428' stroke='#141414' stroke-width='1.2'/>",
 "<circle cx='408' cy='448' r='2' fill='#141414' stroke='none'/>",
 # side dimension ticks with gold dots
 "<path d='M166 512 L166 542' stroke='#141414' stroke-width='1'/>",
 "<circle cx='166' cy='505' r='2' fill='#C9A227' stroke='none'/>",
 "<path d='M434 512 L434 542' stroke='#141414' stroke-width='1'/>",
 "<circle cx='434' cy='505' r='2' fill='#C9A227' stroke='none'/>",
]
assert all(chr(34) not in t for t in F8)
FIRST7 = "<path d='M225 300 C222 268 255 250 300 250 C345 250 378 268 375 300'"
LAST7 = "<circle cx='411' cy='507' r='2' fill='#C9A227' stroke='none'/>"

# ---------- art.js (replace v7 face block) ----------
js = open('svg/art.js').read()
ff = "  `" + FIRST7 + " stroke='#141414' stroke-width='2'/>` +\n"
fl = "  `" + LAST7 + "` +\n"
assert ff in js, "js v7 first not found"
assert fl in js, "js v7 last not found"
fi = js.index(ff)
fj = js.index(fl) + len(fl)
face_js = "".join("  `" + t + "` +\n" for t in F8)
js = js[:fi] + face_js + js[fj:]
open('svg/art.js', 'w').write(js)
print('art.js ok')

# ---------- CrewArtGold.sol (replace v7 face lines) ----------
sol = open('contracts/lib/CrewArtGold.sol').read()
lines = sol.split(chr(10))
fa_i = next(i for i, l in enumerate(lines) if FIRST7 in l)
la_i = next(i for i in range(fa_i, len(lines)) if LAST7 in lines[i])
def sline(svg):
    return ND + DQ + svg + DQ + ','
lines[fa_i:la_i + 1] = [sline(t) for t in F8]
sol = chr(10).join(lines)
open('contracts/lib/CrewArtGold.sol', 'w').write(sol)
print('sol ok, braces:', sol.count('{'), sol.count('}'))
