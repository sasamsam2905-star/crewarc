// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {ERC2981} from "@openzeppelin/contracts/token/common/ERC2981.sol";
import {IERC2981} from "@openzeppelin/contracts/interfaces/IERC2981.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {CrewArt} from "./lib/CrewArt.sol";
import {CrewArtGold} from "./lib/CrewArtGold.sol";

/// @title CREW Passport
/// @notice Agent passport of the agentic economy on Arc (Circle L1).
///         ERC-721 with 3 mint phases, 8 procedural classes, on-chain SVG
///         metadata, and a reputation loop (task attestations -> levels -> stamps).
///
/// NOTE (Arc specifics):
///  - Gas on Arc is native USDC. Prices below are denominated in native USDC
///    at 18 decimals (same as ETH wei). Verify the faucet amount on testnet
///    before mainnet; ERC-20 USDC on Arc is 6 decimals - do NOT mix them.
///  - block.prevrandao is always 0 on Arc, so the seed uses blockhash + timestamp.
contract CrewPassport is ERC721Enumerable, ERC2981, Ownable {
    using Strings for uint256;

    // ---------------- supply & mint phases ----------------
    uint256 public constant MAX_SUPPLY = 2500;

    uint8 public constant TIER_WL = 0;     // Founding Crew (whitelist)
    uint8 public constant TIER_FCFS = 1;   // first come first served
    uint8 public constant TIER_PUBLIC = 2; // public

    uint256 public constant WL_CAP = 1500;      // GOLD phase slots (500 gold + 1000 FCFS)
    uint256 public constant FOUNDING_CAP = 500; // total gold (Founding Crew) supply
    uint256 public constant WL_FCFS_BUDGET = 1000; // FCFS-tier slots inside the GOLD bag
    uint256 public constant FCFS_CAP = 1000;    // total FCFS supply (all via the GOLD bag)
    uint256 public constant PUBLIC_CAP = 1000;

    uint256 public constant WL_PRICE = 0.5e18;    // native USDC
    uint256 public constant FCFS_PRICE = 1e18;
    uint256 public constant PUBLIC_PRICE = 10e18;

    uint256 public constant WL_MAX_PER = 1;
    uint256 public constant FCFS_MAX_PER = 1;
    uint256 public constant PUBLIC_MAX_PER = 4;
    uint256 public constant MAX_QTY_PER_TX = 50;

    // ---------------- reputation ----------------
    uint256 public constant ATTEST_COST = 1e18; // 1 USDC per task attestation
    uint32 public constant L2_ATTEST = 10;
    uint32 public constant L3_ATTEST = 50;
    uint32 public constant L4_ATTEST = 200;
    uint32 public constant L5_ATTEST = 500;

    // ---------------- state ----------------
    uint256 public fcfsStart;
    uint256 public publicStart;
    bool public wlOpen = true;
    bytes32 public seed;

    uint256 public wlMinted;      // WL phase mints (both tiers)
    uint256 public foundingMinted; // gold tier mints (via WL)
    uint256 public fcfsViaWL;   // FCFS-tier mints that came from the WL bag
    uint256 public fcfsMinted;    // FCFS tier mints (via WL + FCFS phase)
    uint256 public publicMinted;
    uint256 public fcfsExtra; // unused WL slots released to FCFS

    string[8] public CLASS_NAMES;
    string[8] public RARITY_NAMES;
    uint256[8] public CLASS_CAPS;

    struct Profile {
        uint8 classIdx;
        uint8 tier;
        uint8 flags; // bit0: agent onboarded
        uint32 attestations;
    }

    mapping(uint256 => Profile) private _prof;
    mapping(uint256 => string) private _agentName;
    mapping(uint256 => string) private _agentSkill;
    mapping(address => bool) public isWhitelisted;
    mapping(uint8 => mapping(address => uint256)) public tierMinted;
    mapping(address => uint256) public wlMintedPer; // WL phase mints per wallet
    uint256[8] private _classCount;

    event Minted(uint256 indexed tokenId, address indexed to, uint8 tier, uint8 classIdx);
    event AgentOnboarded(uint256 indexed tokenId, string name, string skill);
    event TaskAttested(uint256 indexed tokenId, address indexed by, uint32 total);

    constructor() ERC721("CREW Passport", "CREW") Ownable(msg.sender) {
        seed = bytes32(uint(keccak256(abi.encodePacked(block.timestamp, blockhash(block.number - 1), msg.sender))));
        CLASS_NAMES = ["Builder", "Scout", "Trader", "Diplomat", "Guard", "Oracle", "Pioneer", "Auditor"];
        RARITY_NAMES = ["Common", "Common", "Common", "Uncommon", "Uncommon", "Rare", "Rare", "Legendary"];
        CLASS_CAPS = [500, 430, 430, 300, 300, 190, 190, 160]; // sums to 2500
        uint256 capSum;
        for (uint256 i = 0; i < CLASS_CAPS.length; i++) capSum += CLASS_CAPS[i];
        require(capSum == MAX_SUPPLY, "class caps must sum to max supply");
    }

    // ---------------- minting ----------------
    /// @dev WL phase: each mint randomly yields Founding Crew (gold, tier 0) or FCFS (tier 1),
    ///      drawn on-chain from (seed, tokenId) with exact supply caps enforced.
    function mintWL(uint256 qty) external payable {
        require(qty > 0 && qty <= MAX_QTY_PER_TX, "qty");
        require(wlOpen, "wl closed");
        require(isWhitelisted[msg.sender], "not whitelisted");
        uint256 paid = qty * WL_PRICE;
        require(msg.value >= paid, "underpaid");
        require(wlMinted + qty <= WL_CAP, "cap reached");
        require(wlMintedPer[msg.sender] + qty <= WL_MAX_PER, "per-wallet limit");
        require(totalSupply() + qty <= MAX_SUPPLY, "max supply");

        uint256 before = totalSupply();
        for (uint256 i = 0; i < qty; i++) {
            _mintWLToken(before + 1 + i);
        }
        if (msg.value > paid) {
            (bool ok, ) = payable(msg.sender).call{value: msg.value - paid}("");
            require(ok, "refund failed");
        }
    }

    function _mintWLToken(uint256 id) internal {
        bool goldLeft = foundingMinted < FOUNDING_CAP;
        bool fcfsLeft = fcfsMinted < FCFS_CAP;
        require(goldLeft || fcfsLeft, "cap reached");
        // Bag model: GOLD = 500 gold balls + 1000 FCFS balls, drawn without
        // replacement proportional to remaining balls -> if the GOLD phase fills
        // all 1500 slots, the final split is exactly 500 gold / 1000 FCFS.
        uint256 remGold = FOUNDING_CAP - foundingMinted;
        uint256 remWlFcfs = WL_FCFS_BUDGET - fcfsViaWL;
        uint8 tier;
        if (remGold > 0 && remWlFcfs > 0) {
            uint256 draw = uint256(keccak256(abi.encodePacked(seed, "wltier", id))) % (remGold + remWlFcfs);
            tier = draw < remGold ? TIER_WL : TIER_FCFS;
        } else {
            tier = remGold > 0 ? TIER_WL : TIER_FCFS;
        }
        uint8 c = _assignClass(id);
        _prof[id] = Profile({classIdx: c, tier: tier, flags: 0, attestations: 0});
        _safeMint(msg.sender, id);
        tierMinted[tier][msg.sender] += 1;
        wlMintedPer[msg.sender] += 1;
        wlMinted += 1;
        if (tier == TIER_WL) foundingMinted += 1;
        else { fcfsMinted += 1; fcfsViaWL += 1; }
        _classCount[c] += 1;
        emit Minted(id, msg.sender, tier, c);
    }

    function mintFCFS(uint256 qty) external payable {
        require(fcfsStart != 0 && block.timestamp >= fcfsStart, "fcfs not open");
        _mint(qty, TIER_FCFS, FCFS_PRICE, FCFS_CAP + fcfsExtra, FCFS_MAX_PER);
    }

    function mintPublic(uint256 qty) external payable {
        require(publicStart != 0 && block.timestamp >= publicStart, "public not open");
        _mint(qty, TIER_PUBLIC, PUBLIC_PRICE, PUBLIC_CAP, PUBLIC_MAX_PER);
    }

    function _mint(uint256 qty, uint8 tier, uint256 price, uint256 cap, uint256 maxPer) internal {
        require(qty > 0 && qty <= MAX_QTY_PER_TX, "qty");
        if (tier == TIER_WL) {
            require(wlOpen, "wl closed");
            require(isWhitelisted[msg.sender], "not whitelisted");
        }
        uint256 paid = qty * price;
        require(msg.value >= paid, "underpaid");
        uint256 mintedOfTier = tier == TIER_WL ? wlMinted : tier == TIER_FCFS ? fcfsMinted : publicMinted;
        require(mintedOfTier + qty <= cap, "cap reached");
        require(tierMinted[tier][msg.sender] + qty <= maxPer, "per-wallet limit");
        require(totalSupply() + qty <= MAX_SUPPLY, "max supply");

        uint256 before = totalSupply();
        for (uint256 i = 0; i < qty; i++) {
            uint256 id = before + 1 + i;
            uint8 c = _assignClass(id);
            _prof[id] = Profile({classIdx: c, tier: tier, flags: 0, attestations: 0});
            _safeMint(msg.sender, id);
            tierMinted[tier][msg.sender] += 1;
            _classCount[c] += 1;
            if (tier == TIER_WL) wlMinted += 1;
            else if (tier == TIER_FCFS) fcfsMinted += 1;
            else publicMinted += 1;
            emit Minted(id, msg.sender, tier, c);
        }
        if (msg.value > paid) {
            (bool ok, ) = payable(msg.sender).call{value: msg.value - paid}("");
            require(ok, "refund failed");
        }
    }

    /// @dev Deterministic class from (seed, tokenId) with exact supply caps.
    ///      If the seeded class is full, walks to the next available class.
    function _assignClass(uint256 id) internal view returns (uint8 idx) {
        uint256 h = uint256(keccak256(abi.encodePacked(seed, "class", id)));
        idx = uint8(h % 8);
        uint256 guard = 0;
        while (_classCount[idx] >= CLASS_CAPS[idx] && guard < 8) {
            idx = uint8((idx + 1) % 8);
            guard++;
        }
        require(guard < 8, "no class available");
    }

    // ---------------- reputation loop ----------------
    /// @notice Anyone can attest a completed task on a passport by paying 1 USDC.
    ///         Attestations raise the level; levels unlock stamps. Phase 2 will
    ///         replace manual attestations with x402 payment receipts.
    function attestTask(uint256 id) external payable {
        require(_ownerOf(id) != address(0), "no token");
        require(msg.value >= ATTEST_COST, "pay 1 USDC");
        require(_prof[id].attestations < L5_ATTEST, "max level reached");
        _prof[id].attestations += 1;
        if (msg.value > ATTEST_COST) {
            (bool ok, ) = payable(msg.sender).call{value: msg.value - ATTEST_COST}("");
            require(ok, "refund failed");
        }
        emit TaskAttested(id, msg.sender, _prof[id].attestations);
    }

    /// @notice Bind an agent identity to this passport (owner only).
    function onboardAgent(uint256 id, string calldata name, string calldata skill) external {
        require(ownerOf(id) == msg.sender, "not owner");
        require(bytes(name).length > 0 && bytes(name).length <= 32, "name length");
        require(bytes(skill).length <= 48, "skill length");
        _agentName[id] = name;
        _agentSkill[id] = skill;
        _prof[id].flags |= 1;
        emit AgentOnboarded(id, name, skill);
    }

    function agentName(uint256 id) external view returns (string memory) {
        return _agentName[id];
    }

    function agentSkill(uint256 id) external view returns (string memory) {
        return _agentSkill[id];
    }

    function levelOf(uint256 id) public view returns (uint8) {
        uint32 a = _prof[id].attestations;
        if (a >= L5_ATTEST) return 5;
        if (a >= L4_ATTEST) return 4;
        if (a >= L3_ATTEST) return 3;
        if (a >= L2_ATTEST) return 2;
        return 1;
    }

    /// @dev bitmask: 1 ENLISTED (always), 2 ONBOARDED, 4 VETTED (>=10), 8 MASTER (>=200)
    function stampBits(uint256 id) public view returns (uint8) {
        uint8 b = 1;
        if ((_prof[id].flags & 1) == 1) b |= 2;
        uint32 a = _prof[id].attestations;
        if (a >= L2_ATTEST) b |= 4;
        if (a >= L4_ATTEST) b |= 8;
        return b;
    }

    function classOf(uint256 id) external view returns (uint8) {
        return _prof[id].classIdx;
    }

    function tierOf(uint256 id) external view returns (uint8) {
        return _prof[id].tier;
    }

    // ---------------- owner management ----------------
    function setWhitelist(address[] calldata addrs, bool on) external onlyOwner {
        for (uint256 i = 0; i < addrs.length; i++) isWhitelisted[addrs[i]] = on;
    }

    function setPhases(uint256 newFcfsStart, uint256 newPublicStart) external onlyOwner {
        require(newFcfsStart == 0 || newFcfsStart <= newPublicStart, "phase order"); // fcfsStart 0 = FCFS phase disabled
        fcfsStart = newFcfsStart;
        publicStart = newPublicStart;
    }

    function setWlOpen(bool open) external onlyOwner {
        wlOpen = open;
    }

    /// @notice Release unused WL slots to FCFS (keeps total supply at 2500).
    function releaseWlToFcfs(uint256 amount) external onlyOwner {
        require(wlMinted + amount <= WL_CAP, "amount > remaining wl");
        fcfsExtra += amount;
    }

    // ---------------- royalties (5%) ----------------
    function royaltyInfo(uint256, uint256 salePrice) public view override(ERC2981) returns (address, uint256) {
        return (owner(), salePrice * 5 / 100);
    }

    // combine ERC721(Enumerable) + ERC2981 interface support
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721Enumerable, ERC2981)
        returns (bool)
    {
        return interfaceId == type(IERC2981).interfaceId || super.supportsInterface(interfaceId);
    }

    // ---------------- metadata (fully on-chain) ----------------
    function tokenURI(uint256 id)
        public
        view
        virtual
        override
        returns (string memory)
    {
        require(_ownerOf(id) != address(0), "no token");
        Profile memory p = _prof[id];
        uint8 lvl = levelOf(id);
        string memory lvlTxt = string(abi.encodePacked("L", uint256(lvl).toString()));
        string memory clsName = CLASS_NAMES[p.classIdx];
        string memory svg;
        if (p.tier == 0) {
            // Founding Crew -> gold banknote template
            svg = CrewArtGold.goldPassport(
                id, p.classIdx, _pad4(id), clsName, RARITY_NAMES[p.classIdx], lvlTxt,
                stampBits(id), _agentName[id]
            );
        } else {
            // FCFS / Public -> standard ID card
            svg = CrewArt.standardPassport(
                id, p.classIdx, _pad4(id), clsName, lvlTxt,
                stampBits(id), _agentName[id]
            );
        }
        string memory json = string(
            abi.encodePacked(
                '{"name":"CREW #', _pad4(id), " - ", CLASS_NAMES[p.classIdx],
                '","description":"Agent passport of the agentic economy on Arc. Identity, reputation and stamps live on-chain.","image":"data:image/svg+xml;base64,',
                Base64.encode(bytes(svg)),
                '","edition":', id.toString(),
                ',"attributes":[{"trait_type":"Class","value":"', CLASS_NAMES[p.classIdx],
                '"},{"trait_type":"Rarity","value":"', RARITY_NAMES[p.classIdx],
                '"},{"trait_type":"Tier","value":"', _tierName(p.tier),
                '"},{"trait_type":"Level","value":"L', uint256(lvl).toString(),
                '"},{"trait_type":"Agent","value":"', _agentName[id],
                '"},{"trait_type":"Skill","value":"', _agentSkill[id], '"}]}'
            )
        );
        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(bytes(json))));
    }

    function _tierName(uint8 t) internal pure returns (string memory) {
        if (t == TIER_WL) return "Founding Crew";
        if (t == TIER_FCFS) return "FCFS";
        return "Public";
    }

    function _pad4(uint256 n) internal pure returns (string memory) {
        return string(
            abi.encodePacked(n < 1000 ? "0" : "", n < 100 ? "0" : "", n < 10 ? "0" : "", n.toString())
        );
    }
}
