#!/usr/bin/env python3
"""v9: final face polish vs reference (wider temples, tear-trough lines,
higher ears, wider mouth/nose). No backslashes in this file."""
import os
os.chdir('/home/user/crew')

DQ = chr(34)
ND = ' ' * 16

F9 = [
 # cranium (wider dome)
 "<path d='M198 305 C195 260 245 240 300 240 C355 240 405 260 402 305' stroke='#141414' stroke-width='2'/>",
 "<path d='M198 305 C193 382 206 472 246 548' stroke='#141414' stroke-width='2'/>",
 "<path d='M246 548 C258 564 278 575 300 577' stroke='#141414' stroke-width='2'/>",
 "<path d='M402 305 C407 382 394 472 354 548' stroke='#141414' stroke-width='2'/>",
 "<path d='M354 548 C342 564 322 575 300 577' stroke='#141414' stroke-width='2'/>",
 "<path d='M300 577 L300 587' stroke='#141414' stroke-width='1.2'/>",
 # temple diagonals + sweeping cheek facets
 "<path d='M198 305 L232 362' stroke='#141414' stroke-width='1'/>",
 "<path d='M402 305 L368 362' stroke='#141414' stroke-width='1'/>",
 "<path d='M201 330 C205 412 220 492 254 550' stroke='#141414' stroke-width='0.9'/>",
 "<path d='M218 352 C220 424 232 494 264 542' stroke='#141414' stroke-width='0.9'/>",
 "<path d='M399 330 C395 412 380 492 346 550' stroke='#141414' stroke-width='0.9'/>",
 "<path d='M382 352 C380 424 368 494 336 542' stroke='#141414' stroke-width='0.9'/>",
 # tear-trough lines from outer eye
 "<path d='M178 390 C170 430 178 470 200 505' stroke='#141414' stroke-width='0.9'/>",
 "<path d='M422 390 C430 430 422 470 400 505' stroke='#141414' stroke-width='0.9'/>",
 # brows (wider outer ends)
 "<path d='M166 360 L283 398' stroke='#141414' stroke-width='4.5'/>",
 "<path d='M434 360 L317 398' stroke='#141414' stroke-width='4.5'/>",
 # brow-ridge thin lines
 "<path d='M172 346 L280 380' stroke='#141414' stroke-width='1'/>",
 "<path d='M428 346 L320 380' stroke='#141414' stroke-width='1'/>",
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
 # nose (wider V)
 "<path d='M300 356 L300 512' stroke='#141414' stroke-width='1.5'/>",
 "<path d='M279 512 L302 527 L325 512' stroke='#141414' stroke-width='1.8'/>",
 "<path d='M279 512 L272 505' stroke='#141414' stroke-width='1.2'/>",
 "<path d='M325 512 L332 505' stroke='#141414' stroke-width='1.2'/>",
 "<path d='M288 430 L301 468' stroke='#141414' stroke-width='0.9'/>",
 "<path d='M352 430 L321 468' stroke='#141414' stroke-width='0.9'/>",
 # mouth (wider)
 "<path d='M262 499 L302 496 L342 499' stroke='#141414' stroke-width='2.2'/>",
 "<circle cx='262' cy='499' r='1.8' fill='#141414' stroke='none'/>",
 "<circle cx='342' cy='499' r='1.8' fill='#141414' stroke='none'/>",
 "<path d='M281 516 L339 516' stroke='#141414' stroke-width='1.2'/>",
 "<path d='M302 507 L302 523' stroke='#141414' stroke-width='1'/>",
 # ears (higher)
 "<path d='M200 376 C178 368 168 392 176 416 C182 430 198 432 204 422' stroke='#141414' stroke-width='2.2'/>",
 "<path d='M188 392 C180 398 180 410 189 416' stroke='#141414' stroke-width='1.2'/>",
 "<circle cx='192' cy='436' r='2' fill='#141414' stroke='none'/>",
 "<path d='M400 376 C422 368 432 392 424 416 C418 430 402 432 396 422' stroke='#141414' stroke-width='2.2'/>",
 "<path d='M412 392 C420 398 420 410 411 416' stroke='#141414' stroke-width='1.2'/>",
 "<circle cx='408' cy='436' r='2' fill='#141414' stroke='none'/>",
 # side dimension ticks with gold dots
 "<path d='M166 512 L166 542' stroke='#141414' stroke-width='1'/>",
 "<circle cx='166' cy='505' r='2' fill='#C9A227' stroke='none'/>",
 "<path d='M434 512 L434 542' stroke='#141414' stroke-width='1'/>",
 "<circle cx='434' cy='505' r='2' fill='#C9A227' stroke='none'/>",
]
assert all(chr(34) not in t for t in F9)
FIRST8 = "<path d='M205 305 C202 262 245 242 300 242 C355 242 398 262 395 305'"
LAST8 = "<circle cx='434' cy='505' r='2' fill='#C9A227' stroke='none'/>"

js = open('svg/art.js').read()
ff = "  `" + FIRST8 + " stroke='#141414' stroke-width='2'/>` +\n"
fl = "  `" + LAST8 + "` +\n"
assert ff in js, "js v8 first not found"
assert fl in js, "js v8 last not found"
fi = js.index(ff)
fj = js.index(fl) + len(fl)
face_js = "".join("  `" + t + "` +\n" for t in F9)
js = js[:fi] + face_js + js[fj:]
open('svg/art.js', 'w').write(js)
print('art.js ok')

sol = open('contracts/lib/CrewArtGold.sol').read()
lines = sol.split(chr(10))
fa_i = next(i for i, l in enumerate(lines) if FIRST8 in l)
la_i = next(i for i in range(fa_i, len(lines)) if LAST8 in lines[i])
def sline(svg):
    return ND + DQ + svg + DQ + ','
lines[fa_i:la_i + 1] = [sline(t) for t in F9]
sol = chr(10).join(lines)
open('contracts/lib/CrewArtGold.sol', 'w').write(sol)
print('sol ok, braces:', sol.count('{'), sol.count('}'))
