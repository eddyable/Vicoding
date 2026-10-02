# 02 · Gear, Loadouts & Progression

> Part of the Vicoding design set. See [`../README.md`](../README.md) for the index.

## 0. The Golden Rule of Gear

> **Gear grants verbs and vision, never victory.**

A legendary sword must never make a wrong algorithm pass. Every item in Vicoding is one of:

1. **A verb**: a new tool you can use in your battle plan, and it maps 1:1 to a real code construct (a pointer, a hash map, a heap).
2. **Vision**: a debugging or insight view (op heatmap, recursion preview, invariant checker).
3. **A cosmetic**: a skin, an effect, a title.

There are no "+10% damage" stats. The fantasy wrapper is the motivation layer; the *power* the player gains is real skill. This keeps the game honest as interview prep, and players who arrive "geared" are actually better engineers.

---

## 1. Loadout Slots

Before each battle the hero picks a **Loadout**. The slots are deliberately mapped to how a real solution is put together:

```
            ┌───────────── HELM ──────────────┐
            │  Invariant helm (assertions)     │
            └──────────────────────────────────┘
 ┌── MAIN HAND ──┐  ┌──── CHEST ────┐  ┌── OFF HAND ──┐
 │ Primary agent │  │ Testplate     │  │ Second agent │
 │ (the pattern) │  │ (your tests)  │  │ / shield     │
 └───────────────┘  └───────────────┘  └──────────────┘
 ┌──────────── BELT / PACK (weight = space) ──────────┐
 │ Containers: Ledger · Ore Tube · Cart · Pyramid ... │
 └────────────────────────────────────────────────────┘
 ┌─ SPELLBOOK (3 slots) ─┐ ┌─ BOOTS ─┐ ┌─ GLOVES ─┐ ┌─ TRINKET ─┐
 │ Clone, Memory Crystal,│ │ Bounds  │ │ Guards   │ │ Familiar /│
 │ Sort Ritual, Prefix…  │ │         │ │          │ │ Foresight │
 └───────────────────────┘ └─────────┘ └──────────┘ └───────────┘
```

| Slot | Category | What it represents in code |
|---|---|---|
| Main hand / Off hand | **Weapons** | Agents that move over data: pointers, windows, searchers, traversers |
| Belt / Pack | **Containers** | Auxiliary data structures. **Their weight is space complexity** |
| Spellbook | **Techniques** | Recursion, memoization, sorting, prefix sums, bit tricks |
| Helm, Chest, Boots, Gloves | **Armor** | Verification & debugging practices: invariants, tests, bounds, guard clauses |
| Trinket | **Insight** | Familiar, prediction amulet, racial Traits |

### 1.1 Choosing a loadout *is* choosing the approach
In early levels the loadout is preset. In *Choose* levels (late in each realm, and everywhere in the Citadel) **the whole armory is open**. Picking the Halving Hammer for a problem with *Sorted Scales* is half the solution. Picking the wrong weapon is never blocked. It simply leads to a visibly worse battle (the Ogre grows), and that teaches the lesson better than an error message.

---

## 2. Weapons (agents)

Base weapons are **never purchasable**. They unlock through the story when a mentor teaches them. Variants unlock through mastery.

| Weapon | Realm | Code equivalent | Behavior on canvas | Variants (unlock by mastery) |
|---|---|---|---|---|
| **Pointer Spear** | Arraia | single index `i` | A soldier walking along a tile road | *Reverse Spear* (walks from the end) |
| **Twin Daggers** | Arraia | two pointers `l, r` | Two blades on tiles; can converge or run in parallel | *Floyd's Twin Blades* (fast/slow, cycle detection) · *Merging Gauntlets* (one pointer per array, merge) · *Tri-Blade of the Dutch Flag* (three pointers, Sort Colors) |
| **Caravan Whip** | Hashmire | sliding window `[l, r]` | A stretchy whip-bracket; its belly holds the window's contents | *Fixed-length Lash* (size-k window) · *Counting Whip* (window + frequency ledger) |
| **Halving Hammer** | Gnomeria | binary search `lo, hi, mid` | Smashes the middle of a range; the discarded half crumbles to dust | *Hammer of Thresholds* (search on the answer space) · *Twin-Halves Hammer* (lower/upper bound) |
| **Monotone Shield** | Khaz-Stack | monotonic stack | A shield wall where taller warriors knock out shorter ones | *Rising Shield / Falling Shield* (increasing / decreasing variants) |
| **Coupling Hook** | Khaz-Stack | node pointer re-linking | Unhooks and re-hooks train couplings | *Dummy Engine* (sentinel head node) |
| **Grappling Rope** | Underdark | DFS | A rope that descends into a tunnel and is reeled back on return | *Colored Rope* (white/gray/black states for cycle detection) |
| **Dark Lantern** | Underdark | BFS | Light spreads in rings; each ring is one distance level | *Many-Wicked Lantern* (multi-source BFS) · **Dijkstra's Lantern** (legendary, weighted) |
| **Sweep Beam** | Warlands | sweep line over sorted events | A beam of light scans left to right across a timeline | *Siege Counter* (counts concurrent overlaps) |
| **Mirror Path** | Labyrinth | backtracking | Walk a choice; a mirror ghost retraces your step on undo | *Pruning Shears* (cut branches early) |

### Legendary weapons
Named after the people and algorithms they teach. Each comes with a short lore card that is real CS history.

| Legendary | Unlocked by | Teaches |
|---|---|---|
| **Floyd's Twin Blades** | Rail Yard boss, no hints | Tortoise & hare cycle detection |
| **Kadane's Ember** | Arraia Remix streak ×5 | Max subarray in one pass ("drop the past when it hurts") |
| **Hoare's Partition Axe** | Warlands boss | Quickselect / partitioning |
| **Boyer–Moore Voting Banner** | Hashmire Exalted | Majority element in O(1) space |
| **Dijkstra's Lantern** | Underdark boss | Weighted shortest paths |
| **Bellman's Codex** | Memoria Revered | Bottom-up DP tables |
| **Knuth's Quill** *(spellbook)* | Citadel completion | Complexity analysis overlay, which proves the Big-O of your plan line by line |

---

## 3. Containers (Belt/Pack): weight = space complexity

The hero has a **carry capacity**. Each container's weight is measured *during the run* and equals the peak number of elements it held. The **Encumbrance bar** is a live space-complexity meter.

| Container | Realm | Code | Visual |
|---|---|---|---|
| **Goblin Ledger** | Hashmire | hash map / dict | Wall of labeled lockers; lookups shoot a beam straight to the right locker (O(1)) |
| **Goblin Pouch** | Hashmire | hash set | Sack where items glow if already inside |
| **Ore Tube** | Khaz-Stack | stack | Vertical spring tube; push drops ore in, pop springs it out |
| **Mine Cart Line** | Khaz-Stack | queue / deque | Carts on a conveyor; deque carts can leave from either end |
| **War Pyramid** | Warlands | heap / priority queue | Orc hierarchy pyramid; the strongest bubbles to the top in a duel animation |
| **Rune Tree** | Sylvan | trie | Glowing letter-runes branching on a tree |
| **Clan Banners** | Underdark | union-find | Banners; merging clans re-pins one banner under another; path compression is a "shortcut" rope |
| **Archive Shelf** | Memoria | DP array / table | Bookshelf grid of scrolls that light up as filled |

**Travelling light:** many levels give the 3rd star for "Travel Light" (O(1) extra space). A hash-map solution to a sorted Two Sum gets 2★ (correct, O(n) time) but not the Travel Light star. That nudges the player toward the two-pointer solution and makes the **time/space trade-off** tangible.

---

## 4. Spellbook (techniques)

| Spell | Code | Visual | Cost shown |
|---|---|---|---|
| **Summon Clone** | recursion / function call | A copy of the hero steps into a sub-arena carrying a scroll of its locals; returns with an answer | Clone tower height = call stack depth (memory) |
| **Memory Crystal** | memoization | Cauterizes a Hydra head; identical future clones fetch the answer from the crystal instead of fighting | Crystal size = memo entries |
| **Sort Ritual** | sorting (`O(n log n)`) | A whirlwind that rearranges tiles; the stamina cost is charged visibly up front | n log n stamina |
| **Prefix Scroll** | prefix sums | A rising staircase drawn above the tiles; any range sum is one subtraction (stair-height difference) | n space |
| **Gnomish Bit-Levers** | bit manipulation | A row of brass levers (bits); XOR makes paired levers cancel | O(1) |
| **Reversal Rite** | in-place reverse | Tiles mirror around a center | O(n) |

---

## 5. Armor (verification & debugging practices)

Armor protects you from the **Jester's attacks** (adversarial tests) and **bugs**. Every piece corresponds to a professional engineering habit. This is how the game teaches *testing* and *correctness reasoning*, two of the four axes interviewers grade.

| Piece | Name | Habit it teaches | Mechanic |
|---|---|---|---|
| **Helm** | **Helm of Invariants** | State and maintain invariants | You write an assertion such as `L ≤ R` or "window has no duplicates". It is checked every tick; if violated, the battle freezes and your helm cracks exactly where the bug is. Good invariants also unlock the *Seer's Eye* proof view (see [`04`](04-pattern-visual-language.md)) |
| **Chest** | **Testplate** | Write your own test cases | In the *Forge* phase you craft test inputs and their expected outputs (or ask Grukk's Oracle to compute them). Each **distinct edge-case category** you cover adds a plate. When the Jester attacks with a category you already covered, you **Parry**, which earns the *Testing* score |
| **Boots** | **Boots of Bounds** | Respect array bounds | Shows grey "void tiles" at `-1` and `n`. Stepping onto one is shown before it happens in Step mode |
| **Gloves** | **Gauntlets of Guarding** | Guard clauses | Quick-adds checks for empty/single-element input. Each guard you place blocks a Null Wraith |
| **Trinket** | **Amulet of Foresight** | Mental simulation | Before pressing Run, predict the output (or a pointer's final position). Correct predictions give XP and charge the amulet. This trains the "trace by hand" interview skill |
| **Trinket** | **Quill the Duck** | Rubber-duck debugging | The hint ladder + "Explain it to Quill" (see [`01`](01-world-and-characters.md)) |

**Armor durability = real test categories.** Edge-case categories the game recognizes and scores:
`empty` · `single element` · `all equal` · `duplicates` · `negatives` · `already sorted` · `reverse sorted` · `max size` · `no answer exists` · `answer at boundary` · `overflow-range values` · `disconnected graph` · `cycle` · `self-loop`.

---

## 6. Hero Profile: stats that mean something

Stats are **measured from your play, not assigned with points**. They are honest analytics wearing a fantasy costume.

| Stat | Measures | How it grows |
|---|---|---|
| **Insight** | Pattern recognition | Correct weapon picked first try in *Choose* levels; Scout trait identification |
| **Precision** | Correctness on first submit | First-try victories, few bugs caught by the Jester |
| **Swiftness** | Complexity mastery | Hitting target Big-O; Ogre never summoned |
| **Fortitude** | Testing & robustness | Parries, own test coverage, invariants written |
| **Eloquence** | Communication | Quill explanation scores; Council Trial communication axis |
| **Endurance** | Consistency | Streaks, spaced-repetition reviews done on time |

The **Hero Sheet** shows the six stats as a radar plus per-faction reputation. A player can export it as an "interview readiness report" (useful for bootcamps and as a shareable badge).

---

## 7. Hero Rank (interview-readiness ladder)

| Rank | Roughly equivalent to | Requirement |
|---|---|---|
| Squire | Can solve LeetCode Easy with help | Finish Arraia |
| Knight | Solves Easy reliably, some Mediums | 3 factions Friendly+ |
| Champion | Solves most Mediums | 5 factions Honored+, 3 realm bosses |
| Warlord (Orc/Dwarf/Human) / Archmage (Elf/Gnome) / Shadowmaster (Dark Elf/Goblin) | Mediums fluently, some Hards | All realms cleared, Memoria Honored |
| **Legend of Algoria** | Interview-ready for big tech | Pass 3 Council Trials at "Hire" or "Strong Hire" |

The rank title changes by race for flavor, but the requirements are identical.

---

## 8. Economy

| Currency | Earned by | Spent on | Pay-to-win safe? |
|---|---|---|---|
| **XP** | Everything | Hero level (cosmetic milestones, titles) | n/a |
| **Gold** | Victories, daily bounties | Cosmetic skins, banners, emotes, housing decor | ✔ cosmetics only |
| **Shards** | Stars, bosses, Remix streaks | Rerolling Remix variants, unlocking extra *Choose* challenges, cosmetic legendary effects | ✔ |
| **Faction Tokens** | Faction-specific levels | Faction quartermaster: faction cosmetics, Trait early-access *preview* (one-time trial only) | ✔ |
| **Crowns** (premium) | Purchase | Cosmetics, Pro subscription | ✔ never tools or hints |

**Hard rules:**
- Weapons, containers, spells and armor **cannot be bought**. They are learned.
- Hints are never gated by currency.
- There is **no play-energy system**. Practice is never rationed, because rationing practice contradicts the product's purpose.

---

## 9. The Grimoire (your personal code library)

Every victory inscribes a **Spell Scroll** into your Grimoire: the actual code of *your* solution in your class language, annotated with:
- pattern / weapon used, complexity achieved, edge cases parried
- your Quill explanation
- a mini replay GIF of the battle

The Grimoire is searchable, reviewable before a real interview, and **exportable to GitHub** as a repository of your own solutions. It is the player's tangible takeaway from the game.

---

## 10. Housing: the Guild Hall (light, optional)

A small hub where trophies (boss heads, legendary items, Bestiary specimens) are displayed. Friends can visit and see your **trophy wall**, which is a visual résumé of patterns mastered. It is low priority post-MVP, but strong for social motivation and streak retention.
