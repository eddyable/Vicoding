# 01 · World, Races & Characters

> Part of the Vicoding design set. See [`../README.md`](../README.md) for the index.

## 1. The Premise

The continent of **Algoria** once ran on the **Compiler Crystal**, a great gem that turned the races' plans into reality. The crystal was shattered by **Gordian, the Spaghetti Wyrm**, a dragon of endlessly tangled noodle-coils who feeds on confusion. Its fourteen shards fell into the realms of Algoria's races, and wherever logic is broken, **Bugs** now swarm: off-by-one imps, null wraiths, infinite-loop serpents.

The races each kept one piece of the old wisdom. Humans know how to march down a line, Dwarves how to stack and haul, Elves how to read trees, Dark Elves how to walk webs, Goblins how to count everything, Gnomes how to halve anything, and Orcs how to just *try everything*, loudly. None of them can defeat the Tangle alone.

The player is a **Codebearer**: a hero who can learn the ways of *every* race. Each realm teaches one way of thinking, wins back a shard and earns the trust of a faction. When all the races fight under one banner, the hero is ready to face the **High Council's Trial** (the mock interview) and Gordian itself.

> **Design intent:** the story *is* the curriculum. "Uniting the races" means "becoming a complete engineer who can pick the right pattern." A player who is "Exalted" with every faction is genuinely interview-ready.

---

## 2. Hero Creation

### 2.1 Race: who you are (identity + starting trait)
Race decides your look, your home banner, your first mentor's greeting and **one starting Trait**. A Trait is a debugging/insight view your race has from the start. **Every Trait can be learned by every hero later** through faction reputation (see §4), so race never locks you out of anything. It only decides what you see first.

| Race | Look & personality | Starting Trait (insight tool) | Realm / patterns taught |
|---|---|---|---|
| **Humans** | Practical, disciplined soldiers of the Free City | **Steady March**: pointer footprints (trails) are permanent, with step numbers | Arrays, strings, two pointers, prefix sums |
| **Goblins** | Greedy merchants, hoarders, obsessive accountants | **Ledger Eye**: every container's contents and size shown live at every tick (memory view) | Hashing, counting, sliding window |
| **Dwarves** | Miners, rail-builders, stubborn and exact | **Stonecount**: per-line operation counter (a heatmap profiler over your battle plan) | Stacks, queues, monotonic stack, linked lists |
| **Gnomes** | Clockwork tinkerers, obsessed with precision | **Boundary Lens**: flashes a warning whenever an index touches `0`, `n-1`, `n` or `-1` | Binary search, search-on-answer, bit manipulation, math |
| **High Elves** | Ancient, patient, live in giant trees | **Far Sight**: preview of the full recursion tree (depth, branching) before running | Trees, BST, recursion, tries |
| **Dark Elves** | Spider-weavers of the Underdark, cunning | **Web-Sense**: visited-set overlay; cycles glow violet the moment they form | Graphs: BFS/DFS, topo sort, union-find, Dijkstra |
| **Orcs** | Loud, honest, brute force with a heart | **Warcry Oracle**: your brute-force plan becomes a *test oracle* that stress-tests your optimized plan on random inputs | Brute force → greedy, sorting, intervals, heaps |

**Not a playable race:** the **Archivists of Memoria**, a spectral scholar-race who remember every answer ever computed. They teach **dynamic programming** and only reveal themselves late in the campaign.

### 2.2 Class: your spell language (= programming language)
Class decides **which language your Spellbook (code panel) is written in**. It can be changed at any Guild Hall at no cost, so it never locks you in.

| Class | Language | Flavor |
|---|---|---|
| **Mage** | Python | Spells glow blue, terse incantations |
| **Ranger** | JavaScript / TypeScript | Arrows of callbacks, fast and flexible |
| **Paladin** | Java | Heavy, verbose, very robust armor sets |
| **Artificer** | C++ | Builds contraptions, manages own memory |
| **Bard** *(later)* | Go / Kotlin | Unlockable via community demand |

A Paladin's code reveal reads `int mid = lo + (hi - lo) / 2;`, while a Mage's reads `mid = (lo + hi) // 2`. The **Overflow Golem** bug (see §6) only shows up for Paladins and Artificers, which is a real lesson for those languages.

### 2.3 Appearance
Body, face, hair, banner, sigil and voice. All gear has race-specific **skins**: Elven twin daggers are silver leaves, Orc twin daggers are jagged cleavers. They behave the same; only the look differs.

---

## 3. Main Characters

### 3.1 Mentors (one per realm)
Each mentor is a recurring character with a teaching personality. They introduce a realm, voice its tutorials, and give the first hint step for its levels.

| Mentor | Race | Personality | Signature line | Teaches |
|---|---|---|---|---|
| **Captain Ada Ironquill** | Human | Calm drill-sergeant who loves order | "March in a line. Count your steps. Never lose your place." | Iteration, two pointers, prefix sums |
| **Nib Ledgerclaw** | Goblin | Fast-talking bookkeeper, slightly shady | "Why search the whole market when I *wrote down* where everything is?" | Hash maps/sets, counting, sliding window |
| **Thrain Stackbeard** | Dwarf | Gruff, proud of his mine-carts | "Last ore in, first ore out. That's how a mine breathes." | Stack, queue, deque, monotonic stack, linked lists |
| **Professor Tinkerbit** | Gnome | Hyper, speaks in fractions | "Half! Then half of half! Seven cuts finds one gear among a hundred!" | Binary search, bits, math |
| **Lady Arboriel** | High Elf | Serene, speaks in riddles about roots and leaves | "Ask the left branch. Ask the right. Then answer for yourself." | Trees, recursion, BST, tries |
| **Vex'ra Weaveshadow** | Dark Elf | Sardonic and secretive, the hardest teacher | "Mark where you've been, or the web will eat you." | Graphs, BFS/DFS, topo sort, union-find, Dijkstra |
| **Grukk the Brute-Forcer** | Orc | Big-hearted comic relief, always tries everything first | "Grukk try ALL! …Grukk tired. Is there a smarter way?" | Brute force as a baseline, greedy, intervals, heaps |
| **Memoria the Archivist** | Archivist | Ghostly librarian; whispers; never forgets | "You have solved this before. Why solve it twice?" | Dynamic programming |

**Why Grukk matters:** in real interviews, saying the brute force out loud first is *good* practice. Grukk makes that a ritual: many levels open with "Grukk's way" (the brute force) and challenge you to beat it. Grukk's arc is about learning *when* greedy works and when it betrays you (see the Coin Change walkthrough in [`05`](05-level-walkthroughs.md)).

### 3.2 Companion: Quill the Rubber Duck
A small enchanted brass rubber duck familiar that sits on your shoulder. It is the **hint system** and the **rubber-duck-debugging coach**.

- **Hint ladder:** (1) a Socratic question → (2) names the monster's trait (pattern) → (3) shows the invariant → (4) fills one tactic block.
- **"Explain it to Quill":** after victory you can explain your solution by voice or text; an AI grades the explanation for correctness and clarity. This trains the *communication* axis of interviews.
- Quill quacks when your stamina passes the target complexity, giving an early warning before the Ogre arrives.

### 3.3 Antagonists & recurring threats

| Character | Role | Mechanic it embodies |
|---|---|---|
| **Gordian, the Spaghetti Wyrm** | Final antagonist. A dragon of tangled noodle-coils | The final boss is a multi-pattern gauntlet; each coil you untangle is a different pattern |
| **Big-O the Ogre** | Mercenary brute who *grows with n* | Appears when your plan exceeds the target complexity. Ogre size = your operation count at large n. An O(n²) plan makes him fill the screen |
| **Jester Edgecase** | Chaotic trickster, neutral. Lives to break your plans | **The Adversary.** Crafts inputs to break *your* specific plan: empty arrays, duplicates, `"abba"`. Later becomes playable in *Jester's Gambit* mode |
| **The Bug Swarm** | Gordian's minions | Every bug type is a real class of programming mistake (see §6) |
| **Hydras of Exponentia** | Monsters of unchecked recursion | Cut one head and two grow back, which is exponential recursion. Defeated by cauterizing with a Memory Crystal (memoization) |

### 3.4 The High Council (endgame)
Seven council members, one from each race, conduct the **Council Trial** (mock interview). Each has an interviewer persona:

- **Ada**: strict on edge cases and testing.
- **Vex'ra**: pushes hard follow-ups ("and if the graph has a cycle?").
- **Grukk**: friendly; rewards a clear brute force before optimizing.
- **Tinkerbit**: obsessed with complexity analysis.
- And so on.

Company-styled **Guild Trials** reuse the same structure with different council mixes and problem pools (e.g. "Graph-heavy guild", "DP-heavy guild").

---

## 4. Factions & Reputation (= pattern mastery)

Each race is a faction. **Reputation measures your mastery of that faction's patterns**, and it can only be earned by solving that realm's problems well. Grinding easy levels doesn't count.

| Rank | Requirement (per faction) | Rewards |
|---|---|---|
| Stranger | n/a | n/a |
| Recognized | Finish the realm's tutorial | Mentor's basic weapon |
| Friendly | 60% of the realm's core levels at ≥ 2★ | Faction armor piece, faction cosmetics |
| Honored | Realm Boss defeated without hints | **The faction's Trait** (e.g. a Human hero now learns Web-Sense from the Dark Elves) |
| Revered | Pass 5 spaced-repetition Remixes of the realm in a row | Rare weapon variants |
| Exalted | Win a Council Trial on this realm's pattern | Legendary item + title ("Elf-Friend", "Honorary Goblin") |

Reputation **decays slowly** if you don't practice a pattern for weeks, and a Remix restores it. This is spaced repetition with a story reason: the Goblins forget who you are if you stop visiting.

The **Unity Meter** on the world map shows how many factions are at Honored or above. That number is the player's visible "interview readiness".

---

## 5. Geography: the World Map

The world map itself is a **directed acyclic graph of realms**. You can only enter a realm once its prerequisite realms are cleared. Vex'ra later points out that the map *is* a topological sort, an Easter egg for the graph realm.

```
                          ┌──────────────────────┐
                          │  Free City of ARRAIA │  (Humans: arrays, two pointers, prefix sums)
                          └──────────┬───────────┘
                 ┌───────────────────┼────────────────────┐
                 ▼                   ▼                    ▼
       ┌──────────────────┐ ┌──────────────────┐ ┌───────────────────┐
       │ HASHMIRE Bazaar  │ │ KHAZ-STACK Deeps │ │ CLOCKWORK Gnomeria│
       │ (Goblins)        │ │ (Dwarves)        │ │ (Gnomes)          │
       │ hashing, windows │ │ stack/queue/list │ │ binary search,bits│
       └────────┬─────────┘ └────────┬─────────┘ └─────────┬─────────┘
                └───────────┬────────┴───────────┬─────────┘
                            ▼                    ▼
                 ┌────────────────────┐ ┌───────────────────────┐
                 │ SYLVAN CANOPY      │ │ ORCISH WARLANDS       │
                 │ (High Elves)       │ │ (Orcs) greedy, sort,  │
                 │ trees, recursion   │ │ intervals, heaps      │
                 └─────────┬──────────┘ └──────────┬────────────┘
                           ▼                       │
                 ┌────────────────────┐            │
                 │ UNDERDARK WEB      │            │
                 │ (Dark Elves)       │            │
                 │ graphs             │            │
                 └─────────┬──────────┘            │
                           ▼                       ▼
                 ┌──────────────────────────────────────────┐
                 │ THE MIRROR LABYRINTH (neutral)           │
                 │ backtracking                             │
                 └────────────────────┬─────────────────────┘
                                      ▼
                 ┌──────────────────────────────────────────┐
                 │ HALLS OF MEMORIA (Archivists)            │
                 │ dynamic programming                      │
                 └────────────────────┬─────────────────────┘
                                      ▼
                 ┌──────────────────────────────────────────┐
                 │ THE TANGLED CITADEL                      │
                 │ mixed gauntlets · Council Trial · Gordian│
                 └──────────────────────────────────────────┘
```

Within each realm the map is a **path of encounter nodes** with side branches (optional Bug Hunts, Jester's Gambits, treasure Remixes) and a **Realm Boss** at the end.

### Realm aesthetics
| Realm | Visual identity | Music |
|---|---|---|
| Arraia | Sunny stone city, banners, long straight roads, marching tile-plazas | Brass march |
| Hashmire Bazaar | Crowded market of stalls and labeled lockers, coins everywhere | Jaunty plucked strings |
| Khaz-Stack Deeps | Torch-lit mines, rails, carts, vertical shafts | Anvil percussion, low choir |
| Gnomeria | Brass gears, binary levers, steam clocks | Ticking harpsichord |
| Sylvan Canopy | Gigantic luminous trees; nodes are glowing fruit | Harp and flute |
| Underdark Web | Bioluminescent caverns and giant spider webs | Dark ambient |
| Orcish Warlands | Red plains, war camps, siege towers, arena pits | War drums |
| Mirror Labyrinth | Infinite mirrored corridors, chalk marks | Echoing piano |
| Halls of Memoria | Endless library, ghostly shelves of glowing scrolls | Celesta, whispers |
| Tangled Citadel | Spaghetti-coil fortress | All themes collide |

---

## 6. Bestiary of Bugs (debugging monsters)

Every bug monster is a **real class of mistake**. In *Bug Hunt* levels you're given a broken battle plan; the bug hides in one of its lines. Catching it adds it to your **Bestiary**: a personal catalog of mistakes with an explanation card, plus a spaced-repetition review of *your own* past bugs.

| Bug | Looks like | Real mistake | How it shows on the canvas |
|---|---|---|---|
| **Off-by-One Imp** | Tiny red imp with one extra finger | Fencepost errors: `<` vs `<=`, `n` vs `n-1` | A pointer steps onto a tile that doesn't exist; the imp sits on it laughing |
| **Null Wraith** | Transparent hooded ghost | Not handling empty input / `None` / missing key | Battle starts with an empty arena and your hero swings at air → crash |
| **Ouroboros** | Serpent eating its tail | Infinite loop (pointer never advances) | Timeline grows forever; the serpent coils around the stamina bar |
| **Overflow Golem** | Golem cracking under weight (Paladin/Artificer only) | Integer overflow (`(lo+hi)/2`) | Numbers on tiles turn into garbage glyphs |
| **Shallow Mimic** | Chest monster copying your loot | Appending a reference instead of a copy (`res.append(path)`) | All saved results morph into the same final value at the end |
| **Stale Ghost** | Faded copy of an old variable | Forgot to update or reset a variable | A banner (variable) shows an old value with a ghostly blur |
| **Shifting Shade** | Flickering shadow | Mutating a collection while iterating it | Tiles slide under a pointer mid-step |
| **Hydra of the Deep** | Many-headed beast | Missing base case → stack overflow | The clone tower grows past the top of the screen |
| **Greedy Trap Mimic** | A treasure chest with teeth | A greedy choice that is locally best but globally wrong | Looks like victory until Jester opens the counterexample chest |
| **Twin Doppelgänger** | Two identical swordsmen | Duplicates not handled | Two equal tiles; your plan counts or skips one wrongly |

---

## 7. Monster Traits: Pattern-Recognition Training

Every encounter's *problem* is presented as a **monster** with a **Scout Card**. The card lists **traits**, and each trait is a real keyword cue that experienced engineers use to spot the pattern. The Bestiary of Traits becomes the player's pattern cheat sheet.

| Trait icon | Trait name | Cue in the problem statement | Suggested weapon (pattern) |
|---|---|---|---|
| 🪜 | *Sorted Scales* | "sorted array", "non-decreasing" | Twin Daggers (two pointers) / Halving Hammer (binary search) |
| 🐛 | *Contiguous Body* | "subarray", "substring", "consecutive" | Caravan Whip (sliding window) / Prefix Scroll |
| 🤝 | *Seeks a Partner* | "pair", "complement", "two numbers that…" | Goblin Ledger (hash map) |
| 🪆 | *Nested Shell* | "valid parentheses", "nested", "undo" | Ore Tube (stack) |
| 🏔️ | *Looks Ahead* | "next greater", "days until warmer" | Monotone Shield (monotonic stack) |
| 🌊 | *Spreads in Waves* | "minimum steps", "shortest path (unweighted)", "level by level" | Dark Lantern (BFS) |
| 🧵 | *Deep Tunnels* | "connected components", "all paths", "islands" | Grappling Rope (DFS) |
| 👑 | *Crowned Few* | "top k", "k-th largest", "median", "merge k" | War Pyramid (heap) |
| 🗓️ | *Overlapping Shadows* | "intervals", "meetings", "overlap" | Sort Ritual + Sweep Beam |
| 🌳 | *Branching Choices* | "all subsets", "all permutations", "combinations" | Mirror Path (backtracking) |
| 🐉 | *Repeating Heads* | "number of ways", "min cost", "can you reach", overlapping subproblems | Memory Crystal (DP) |
| ⛓️ | *Bound by Oaths* | "prerequisites", "order", "dependencies" | Oath Chains (topological sort) |
| 🏳️ | *Gathering Clans* | "connected groups", "merge accounts", "redundant edge" | Clan Banners (union-find) |
| 🔤 | *Speaks in Prefixes* | "prefix", "autocomplete", "word dictionary" | Rune Tree (trie) |
| ⚖️ | *Hidden Threshold* | "minimum capacity such that…", "smallest speed to finish" | Halving Hammer on the *answer* |

**Learning ramp for traits:**
- Early levels show traits **highlighted** in the story text.
- Mid-game shows the traits as icons, but the player must click the words in the story that justify them ("Scout skill").
- In late-game *Choose* levels the card is **blank**. The player identifies the traits, which is exactly the interview skill of recognizing the pattern from a raw problem statement.
