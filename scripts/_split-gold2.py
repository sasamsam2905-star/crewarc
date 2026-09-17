#!/usr/bin/env python3
"""Split heavy static gold fragments into CrewArtGold2 (EIP-170 size limit).
Extracts exact line content from current CrewArtGold.sol so bytes stay identical."""
import os
os.chdir('/home/user/crew')

DQ = chr(34)
ND = ' ' * 16

sol = open('contracts/lib/CrewArtGold.sol').read()
lines = sol.split(chr(10))

def line_of(content):
    return ND + DQ + content + DQ

def content_of(line):
    a = line.index(DQ) + 1
    b = line.rindex(DQ)
    return line[a:b]

# --- locate blocks ---
head_start = next(i for i, l in enumerate(lines) if "cy='94'" in l)
head_end = next(i for i, l in enumerate(lines) if "cx='455' cy='313'" in l)
mand_start = next(i for i, l in enumerate(lines) if "cy='313' r='52'" in l)
mand_end = next(i for i in range(mand_start, len(lines)) if lines[i].strip() == DQ + "</g>" + DQ)

glyph_idx = [i for i, l in enumerate(lines) if "dominant-baseline='central'" in l]
assert len(glyph_idx) == 4, glyph_idx
roundel_lines = [lines[glyph_idx[0]], lines[glyph_idx[1]]]
seal_lines = [lines[glyph_idx[2]], lines[glyph_idx[3]]]

head_lines = lines[head_start:head_end + 1]
mand_lines = lines[mand_start:mand_end]  # 16 content lines; outer "</g>" stays in Gold
assert len(head_lines) == 20, len(head_lines)
assert len(mand_lines) == 16, len(mand_lines)
for l in head_lines[:-0]:
    assert DQ in l

def block_str(lin):
    # join raw lines (they already carry commas/quotes/newlines); return as one string without trailing newline
    return chr(10).join(lin)

def fn(name, lin):
    body = []
    for k, l in enumerate(lin):
        comma = ',' if k < len(lin) - 1 else ''
        body.append(ND + DQ + content_of(l) + DQ + comma)
    out = []
    out.append('    function ' + name + '() public pure returns (string memory) {')
    out.append('        return string(abi.encodePacked(')
    for b in body:
        out.append('                ' + b[16:])
    out.append('            ));')
    out.append('    }')
    return chr(10).join(out)

gold2 = []
gold2.append('// SPDX-License-Identifier: MIT')
gold2.append('pragma solidity ^0.8.24;')
gold2.append('')
gold2.append('/// @title CrewArtGold2 - heavy static SVG fragments for the Founding (gold) card.')
gold2.append('/// @dev    Kept separate from CrewArtGold to stay under the EIP-170 24.5KB size limit.')
gold2.append('library CrewArtGold2 {')
gold2.append(fn('headDecor', head_lines))
gold2.append('')
gold2.append(fn('mandala', mand_lines))
gold2.append('')
gold2.append(fn('roundelText', roundel_lines))
gold2.append('')
gold2.append(fn('sealText', seal_lines))
gold2.append('}')
gold2.append('')
open('contracts/lib/CrewArtGold2.sol', 'w').write(chr(10).join(gold2))
print('Gold2 written, lines:', len(gold2))

# --- patch CrewArtGold.sol ---
s = chr(10).join(lines)
# import
imp_old = 'import {CrewArt} from "./CrewArt.sol";'
imp_new = 'import {CrewArt} from "./CrewArt.sol";\nimport {CrewArtGold2} from "./CrewArtGold2.sol";'
assert imp_old in s
s = s.replace(imp_old, imp_new)

# head block -> call (all lines mid-list, commas)
s = s.replace(block_str(head_lines), ND + 'CrewArtGold2.headDecor(),')
# mandala content lines -> call (mid-list, comma; outer "</g>" stays as last arg)
s = s.replace(block_str(mand_lines), ND + 'CrewArtGold2.mandala(),')
# roundel glyph lines -> call (mid-list)
s = s.replace(block_str(roundel_lines), ND + 'CrewArtGold2.roundelText(),')
# seal glyph lines -> call (mid-list)
s = s.replace(block_str(seal_lines), ND + 'CrewArtGold2.sealText(),')

assert 'CrewArtGold2.headDecor()' in s and 'CrewArtGold2.mandala()' in s
assert 'CrewArtGold2.roundelText()' in s and 'CrewArtGold2.sealText()' in s
open('contracts/lib/CrewArtGold.sol', 'w').write(s)
print('Gold patched, braces:', s.count('{'), s.count('}'))
