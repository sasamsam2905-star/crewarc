#!/usr/bin/env python3
"""v10: reference-faithful fine-line face + remove gold stamp circles.
No backslashes in this file."""
import os
os.chdir('/home/user/crew')

DQ = chr(34)
ND = ' ' * 16

F10 = [
 "<path d='M198 305 C195 262 245 241 300 241 C355 241 405 262 402 305' stroke='#141414' stroke-width='1.5'/>",
 "<path d='M198 305 C193 384 205 474 247 549' stroke='#141414' stroke-width='1.5'/>",
 "<path d='M247 549 C259 565 279 576 300 578' stroke='#141414' stroke-width='1.5'/>",
 "<path d='M402 305 C407 384 395 474 353 549' stroke='#141414' stroke-width='1.5'/>",
 "<path d='M353 549 C341 565 321 576 300 578' stroke='#141414' stroke-width='1.5'/>",
 "<path d='M300 578 L300 590' stroke='#141414' stroke-width='1'/>",
 "<path d='M252 340 L226 315' stroke='#141414' stroke-width='0.9'/>",
 "<path d='M348 340 L374 315' stroke='#141414' stroke-width='0.9'/>",
 "<path d='M200 308 L231 360' stroke='#141414' stroke-width='0.9'/>",
 "<path d='M400 308 L369 360' stroke='#141414' stroke-width='0.9'/>",
 "<path d='M202 332 C206 414 221 494 254 551' stroke='#141414' stroke-width='0.8'/>",
 "<path d='M219 354 C221 426 233 496 264 544' stroke='#141414' stroke-width='0.8'/>",
 "<path d='M398 332 C394 414 379 494 346 551' stroke='#141414' stroke-width='0.8'/>",
 "<path d='M381 354 C379 426 367 496 336 544' stroke='#141414' stroke-width='0.8'/>",
 "<path d='M180 392 C172 432 180 472 201 506' stroke='#141414' stroke-width='0.8'/>",
 "<path d='M420 392 C428 432 420 472 399 506' stroke='#141414' stroke-width='0.8'/>",
 "<path d='M172 364 L284 400' stroke='#141414' stroke-width='1.6'/>",
 "<path d='M428 364 L316 400' stroke='#141414' stroke-width='1.6'/>",
 "<path d='M178 350 L281 384' stroke='#141414' stroke-width='0.8'/>",
 "<path d='M422 350 L319 384' stroke='#141414' stroke-width='0.8'/>",
 "<path d='M291 397 L180 389' stroke='#141414' stroke-width='1.5'/>",
 "<path d='M180 389 L167 381' stroke='#141414' stroke-width='1.5'/>",
 "<path d='M183 397 Q233 406 289 403' stroke='#141414' stroke-width='0.8'/>",
 "<circle cx='227' cy='392' r='9.5' stroke='#C9A227' stroke-width='1.8'/>",
 "<circle cx='227' cy='392' r='2.2' fill='#141414' stroke='none'/>",
 "<circle cx='289' cy='400' r='1.2' fill='#141414' stroke='none'/>",
 "<path d='M219 406 L219 415' stroke='#141414' stroke-width='0.8'/>",
 "<path d='M309 397 L420 389' stroke='#141414' stroke-width='1.5'/>",
 "<path d='M420 389 L433 381' stroke='#141414' stroke-width='1.5'/>",
 "<path d='M417 397 Q367 406 311 403' stroke='#141414' stroke-width='0.8'/>",
 "<circle cx='373' cy='392' r='9.5' stroke='#C9A227' stroke-width='1.8'/>",
 "<circle cx='373' cy='392' r='2.2' fill='#141414' stroke='none'/>",
 "<circle cx='311' cy='400' r='1.2' fill='#141414' stroke='none'/>",
 "<path d='M381 406 L381 415' stroke='#141414' stroke-width='0.8'/>",
 "<circle cx='251' cy='438' r='1.8' fill='#141414' stroke='none'/>",
 "<circle cx='349' cy='438' r='1.8' fill='#141414' stroke='none'/>",
 "<path d='M300 358 L300 508' stroke='#141414' stroke-width='1.2'/>",
 "<path d='M285 508 L315 508' stroke='#141414' stroke-width='1.2'/>",
 "<path d='M285 508 L278 502' stroke='#141414' stroke-width='1'/>",
 "<path d='M315 508 L322 502' stroke='#141414' stroke-width='1'/>",
 "<path d='M288 430 L301 468' stroke='#141414' stroke-width='0.8'/>",
 "<path d='M312 430 L319 468' stroke='#141414' stroke-width='0.8'/>",
 "<path d='M266 498 L300 495 L334 498' stroke='#141414' stroke-width='1.5'/>",
 "<circle cx='266' cy='498' r='1.5' fill='#141414' stroke='none'/>",
 "<circle cx='334' cy='498' r='1.5' fill='#141414' stroke='none'/>",
 "<path d='M284 513 L316 513' stroke='#141414' stroke-width='0.9'/>",
 "<path d='M300 505 L300 519' stroke='#141414' stroke-width='0.9'/>",
 "<path d='M201 372 C177 362 165 390 174 418 C181 434 199 436 206 424' stroke='#141414' stroke-width='1.6'/>",
 "<path d='M188 390 C179 397 179 410 189 418' stroke='#141414' stroke-width='1'/>",
 "<circle cx='192' cy='440' r='1.8' fill='#141414' stroke='none'/>",
 "<path d='M399 372 C423 362 435 390 426 418 C419 434 401 436 394 424' stroke='#141414' stroke-width='1.6'/>",
 "<path d='M412 390 C421 397 421 410 411 418' stroke='#141414' stroke-width='1'/>",
 "<circle cx='408' cy='440' r='1.8' fill='#141414' stroke='none'/>",
 "<path d='M166 512 L166 542' stroke='#141414' stroke-width='1'/>",
 "<circle cx='166' cy='505' r='2' fill='#C9A227' stroke='none'/>",
 "<path d='M434 512 L434 542' stroke='#141414' stroke-width='1'/>",
 "<circle cx='434' cy='505' r='2' fill='#C9A227' stroke='none'/>",
 "<circle cx='248' cy='536' r='1.5' fill='#141414' stroke='none'/>",
 "<circle cx='352' cy='536' r='1.5' fill='#141414' stroke='none'/>",
]
assert all(chr(34) not in t for t in F10)
FIRST9 = "<path d='M198 305 C195 260 245 240 300 240 C355 240 405 260 402 305'"
LAST9 = "<circle cx='434' cy='505' r='2' fill='#C9A227' stroke='none'/>"
STAMP_MARKS = ['stamp(222, 800, 14, 9,', 'stamp(278, 800, 14, 9,', 'stamp(334, 800, 14, 9,', 'stamp(390, 800, 14, 9,']

js = open('svg/art.js').read()
ff = "  `" + FIRST9 + " stroke='#141414' stroke-width='2'/>` +\n"
fl = "  `" + LAST9 + "` +\n"
assert ff in js, "js v9 first not found"
assert fl in js, "js v9 last not found"
fi = js.index(ff)
fj = js.index(fl) + len(fl)
face_js = "".join("  `" + t + "` +\n" for t in F10)
js = js[:fi] + face_js + js[fj:]
for m in STAMP_MARKS:
    assert js.count(m) == 1, 'js stamp mark ' + m
    js = '\n'.join(l for l in js.split('\n') if m not in l) + '\n'
open('svg/art.js', 'w').write(js)
print('art.js ok')

sol = open('contracts/lib/CrewArtGold.sol').read()
lines = sol.split(chr(10))
fa_i = next(i for i, l in enumerate(lines) if FIRST9 in l)
la_i = next(i for i in range(fa_i, len(lines)) if LAST9 in lines[i])
def sline(svg):
    return ND + DQ + svg + DQ + ','
lines[fa_i:la_i + 1] = [sline(t) for t in F10]
for m in STAMP_MARKS:
    c = sum(1 for l in lines if m in l)
    assert c == 1, 'sol stamp mark ' + m + ' count ' + str(c)
    lines = [l for l in lines if m not in l]
sol = chr(10).join(lines)
open('contracts/lib/CrewArtGold.sol', 'w').write(sol)
print('sol ok, braces:', sol.count('{'), sol.count('}'))
