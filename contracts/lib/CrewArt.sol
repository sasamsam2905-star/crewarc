// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/// @title CrewArt - deterministic on-chain SVG renderer for CREW passports
/// @notice Every passport is rendered as a 600x840 SVG built entirely on-chain.
///         Tier 0 (Founding Crew) gets the gold banknote template; others get
///         the clean ID card. Face per class, barcode + serial from token id,
///         stamps from on-chain reputation state.
/// @dev    Kept byte-identical with svg/art.js (off-chain mirror). Verify with
///         scripts/verify-site.js after changes.
library CrewArt {
    using Strings for uint256;

    // ---------------------------------------------------------------- faces
    // Class 0: BUILDER (amber) - rounded helmet, concentric eyes, ear pods
    function face0() public pure returns (string memory) {
        return "<circle cx='300' cy='420' r='150'/><circle cx='300' cy='420' r='112'/><line x1='300' y1='270' x2='300' y2='570'/><line x1='190' y1='382' x2='410' y2='382'/><circle cx='150' cy='420' r='34'/><circle cx='450' cy='420' r='34'/><line x1='116' y1='420' x2='64' y2='420'/><line x1='484' y1='420' x2='536' y2='420'/><circle cx='245' cy='432' r='30'/><circle cx='245' cy='432' r='12' fill='#141414' stroke='none'/><circle cx='355' cy='432' r='30'/><circle cx='355' cy='432' r='15' fill='#D97706' stroke='none'/><path d='M268 524 Q300 508 332 524'/><path d='M185 640 Q300 575 415 640'/><line x1='272' y1='570' x2='272' y2='606'/><line x1='328' y1='570' x2='328' y2='606'/>";
    }

    // Class 1: SCOUT (green) - dome + goggle ring, asymmetric eyes, antenna
    function face1() public pure returns (string memory) {
        return "<path d='M165 470 A135 135 0 1 1 435 470'/><path d='M165 470 L165 522 Q300 560 435 522 L435 470'/><circle cx='300' cy='432' r='72'/><circle cx='272' cy='432' r='26'/><circle cx='272' cy='432' r='10' fill='#141414' stroke='none'/><circle cx='338' cy='432' r='15'/><circle cx='338' cy='432' r='6' fill='#16A34A' stroke='none'/><path d='M262 514 Q300 530 338 514'/><line x1='300' y1='295' x2='300' y2='248'/><circle cx='300' cy='238' r='9' fill='#16A34A' stroke='none'/>";
    }

    // Class 2: TRADER (teal) - circuit ring head, data-bar visor eyes, zigzag mouth
    function face2() public pure returns (string memory) {
        return "<circle cx='300' cy='430' r='150'/><path d='M195 402 L405 402 L378 458 L300 478 L222 458 Z'/><rect x='236' y='416' width='7' height='26' fill='#0D9488' stroke='none'/><rect x='250' y='424' width='7' height='18' fill='#0D9488' stroke='none'/><rect x='264' y='412' width='7' height='30' fill='#0D9488' stroke='none'/><rect x='278' y='420' width='7' height='22' fill='#0D9488' stroke='none'/><rect x='310' y='424' width='7' height='18' fill='#0D9488' stroke='none'/><rect x='324' y='414' width='7' height='28' fill='#0D9488' stroke='none'/><rect x='338' y='422' width='7' height='20' fill='#0D9488' stroke='none'/><rect x='352' y='412' width='7' height='30' fill='#0D9488' stroke='none'/><path d='M248 522 l18 -16 l18 16 l18 -16 l18 16 l18 -16'/><path d='M150 372 h-32 m16 -10 v20'/><circle cx='106' cy='372' r='5'/><path d='M450 372 h32 m-16 -10 v20'/><circle cx='494' cy='372' r='5'/>";
    }

    // Class 3: DIPLOMAT (blue) - oval head, calm closed-arc eyes, necktie
    function face3() public pure returns (string memory) {
        return "<ellipse cx='300' cy='425' rx='135' ry='148'/><path d='M185 380 Q200 300 260 278'/><path d='M415 380 Q400 300 340 278'/><path d='M225 420 q25 -24 50 0'/><path d='M325 420 q25 -24 50 0'/><path d='M272 508 Q300 524 328 508'/><line x1='260' y1='560' x2='340' y2='560'/><path d='M300 566 l-15 0 l15 36 l15 -36 z' fill='#2563EB' stroke='none'/>";
    }

    // Class 4: GUARD (brick red) - armored rounded square, stern eyes, forehead mark
    function face4() public pure returns (string memory) {
        return "<rect x='182' y='292' width='236' height='262' rx='42'/><path d='M232 410 l46 -16'/><path d='M368 410 l-46 -16'/><line x1='272' y1='512' x2='328' y2='512'/><path d='M300 338 l-15 24 h30 z' fill='#B91C1C' stroke='none'/><path d='M196 470 h24'/><path d='M380 470 h-24'/><path d='M210 500 h20'/><path d='M370 500 h-20'/>";
    }

    // Class 5: ORACLE (purple) - third eye, spiral pupils, constellation dots
    function face5() public pure returns (string memory) {
        return "<circle cx='300' cy='430' r='150'/><circle cx='300' cy='346' r='26'/><path d='M300 346 m0 -13 a13 13 0 1 1 -13 13 a8 8 0 1 0 8 -8'/><circle cx='247' cy='442' r='24'/><path d='M247 442 m0 -10 a10 10 0 1 1 -10 10 a6 6 0 1 0 6 -6'/><circle cx='353' cy='442' r='24'/><path d='M353 442 m0 -10 a10 10 0 1 1 -10 10 a6 6 0 1 0 6 -6'/><circle cx='390' cy='384' r='4' fill='#7C3AED' stroke='none'/><circle cx='402' cy='414' r='4' fill='#7C3AED' stroke='none'/><circle cx='394' cy='444' r='4' fill='#7C3AED' stroke='none'/><path d='M282 520 q18 12 36 0'/>";
    }

    // Class 6: PIONEER (orange) - hood, star eyes, open smile
    function face6() public pure returns (string memory) {
        return "<path d='M172 520 Q172 262 300 252 Q428 262 428 520 Q300 566 172 520 Z'/><path d='M202 510 Q202 294 300 284'/><path d='M238 424 l7 -18 l7 18 l18 7 l-18 7 l-7 18 l-7 -18 l-18 -7 z' fill='#EA580C' stroke='none'/><path d='M344 428 l5 -13 l5 13 l13 5 l-13 5 l-5 13 l-5 -13 l-13 -5 z' fill='#EA580C' stroke='none'/><path d='M272 506 Q300 534 328 506'/>";
    }

    // Class 7: AUDITOR (monochrome) - angular face, X eyes, official seal
    function face7() public pure returns (string memory) {
        return "<path d='M300 272 L428 382 L398 556 L202 556 L172 382 Z'/><path d='M228 414 l38 38'/><path d='M266 414 l-38 38'/><path d='M334 414 l38 38'/><path d='M372 414 l-38 38'/><line x1='268' y1='512' x2='332' y2='512'/><circle cx='300' cy='352' r='24'/><path d='M300 334 v36 M282 352 h36 M287 339 l26 26 M313 339 l-26 26' stroke-width='3'/>";
    }

    function face(uint8 c) public pure returns (string memory) {
        if (c == 0) return face0();
        if (c == 1) return face1();
        if (c == 2) return face2();
        if (c == 3) return face3();
        if (c == 4) return face4();
        if (c == 5) return face5();
        if (c == 6) return face6();
        return face7();
    }

    // Seed-driven micro details (variant = id % 3)
    function detail(uint8 v) public pure returns (string memory) {
        if (v == 0) return "<path d='M492 300 h34 m-17 -10 v20'/><circle cx='526' cy='300' r='4'/>";
        if (v == 1) return "<circle cx='104' cy='560' r='6'/><circle cx='120' cy='576' r='4'/><circle cx='132' cy='588' r='3'/>";
        return "<path d='M118 300 v36 m-9 -18 h18'/>";
    }

    // ---------------------------------------------------------------- pieces
    function stamp(uint256 cx, uint256 cy, uint256 r, uint8 fs, string memory txt) public pure returns (string memory) {
        return string(
            abi.encodePacked(
                "<circle cx='", cx.toString(), "' cy='", cy.toString(), "' r='", r.toString(), "' fill='none' stroke='#141414' stroke-width='3'/>",
                "<circle cx='", cx.toString(), "' cy='", cy.toString(), "' r='", (r - 6).toString(), "' fill='none' stroke='#141414' stroke-width='1'/>",
                "<text x='", cx.toString(), "' y='", (cy + 4).toString(), "' text-anchor='middle' font-family='monospace' font-size='", uint256(fs).toString(), "' fill='#141414'>", txt, "</text>"
            )
        );
    }

    function barcode(uint256 id, uint256 x0, uint256 xmax, string memory color) public pure returns (string memory) {
        uint256 h = uint256(keccak256(abi.encodePacked("bc", id)));
        string memory out = "";
        uint256 x = x0;
        for (uint256 i = 0; i < 32; i++) {
            if (x > xmax) break;
            uint256 w = 2 + (h >> (i * 8)) % 4;
            out = string(abi.encodePacked(out, "<rect x='", x.toString(), "' y='682' width='", w.toString(), "' height='40' fill='", color, "'/>"));
            x += w + 4;
        }
        return out;
    }


    // ---------------------------------------------------------------- standard
    function standardPassport(
        uint256 id,
        uint8 classIdx,
        string memory serial4,
        string memory className,
        string memory levelTxt,
        uint8 stamps,
        string memory agent
    ) public pure returns (string memory) {
        string memory sts = "";
        if ((stamps & 1) == 1) sts = string(abi.encodePacked(sts, stamp(516, 656, 24, 11, "ENL")));
        if ((stamps & 2) == 2) sts = string(abi.encodePacked(sts, stamp(556, 700, 24, 11, "OBD")));
        if ((stamps & 4) == 4) sts = string(abi.encodePacked(sts, stamp(516, 744, 24, 11, "VET")));
        if ((stamps & 8) == 8) sts = string(abi.encodePacked(sts, stamp(556, 792, 24, 11, "MST")));
        string memory agentLine = bytes(agent).length > 0
            ? string(abi.encodePacked("<text x='40' y='670' font-family='monospace' font-size='16' fill='#141414'>AGENT: ", agent, "</text>"))
            : "";

        return string(
            abi.encodePacked(
                "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 600 840'>",
                "<rect width='600' height='840' fill='#FAF9F6'/>",
                "<rect x='16' y='16' width='568' height='808' fill='none' stroke='#141414' stroke-width='3'/>",
                "<text x='38' y='78' font-family='Arial, Helvetica, sans-serif' font-size='46' font-weight='bold' fill='#141414'>CREW</text>",
                "<rect x='498' y='46' width='54' height='42' rx='8' fill='none' stroke='#C9A227' stroke-width='4'/><line x1='498' y1='63' x2='552' y2='63' stroke='#C9A227' stroke-width='3'/><line x1='498' y1='71' x2='552' y2='71' stroke='#C9A227' stroke-width='3'/><line x1='516' y1='46' x2='516' y2='88' stroke='#C9A227' stroke-width='3'/><line x1='534' y1='46' x2='534' y2='88' stroke='#C9A227' stroke-width='3'/>",
                "<g stroke='#141414' stroke-width='5' fill='none' stroke-linecap='round'>",
                face(classIdx),
                detail(uint8(id % 3)),
                "</g>",
                barcode(id, 40, 368, "#141414"),
                agentLine,
                "<text x='40' y='766' font-family='monospace' font-size='24' fill='#141414'>NO. ", serial4, " / 2500</text>",
                "<rect x='40' y='784' width='204' height='36' fill='none' stroke='#141414' stroke-width='3'/>",
                "<text x='52' y='809' font-family='monospace' font-size='19' fill='#141414'>CLASS ", className, "</text>",
                "<circle cx='452' cy='796' r='26' fill='none' stroke='#141414' stroke-width='4'/>",
                "<text x='452' y='804' text-anchor='middle' font-family='monospace' font-size='20' font-weight='bold' fill='#141414'>", levelTxt, "</text>",
                sts,
                "</svg>"
            )
        );
    }

}
