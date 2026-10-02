# 04 · The Visual Language of Patterns

> Part of the Vicoding design set. See [`../README.md`](../README.md) for the index.

Each algorithmic pattern has a **distinct visual signature**: an arena, a way of drawing the data, a characteristic *motion*, and an **"aha" overlay** that makes the correctness argument visible. The goal is that a player who has played Vicoding can close their eyes in an interview and *see* the pattern move.

**Design rules for every pattern:**
1. **One recognizable motion.** Converging blades, an inchworm, ripples, a collapsing range. If you mute the screen and blur it, you should still tell the patterns apart.
2. **The wrong approach must look wrong.** Brute force is visibly dense, repetitive, and wakes the Ogre.
3. **Show the invariant.** There is always an overlay (*Seer's Eye*) that turns the reason the algorithm is correct into a picture.
4. **Same colors everywhere:** blue = agents · amber = values under comparison · green = done/visited/confirmed · red = conflict/invalid · purple = remembered/cached · grey = discarded/eliminated.

---

## 1. Pattern Signature Sheet

### 1.1 Two Pointers: *Converging Blades* (Arraia)
- **Arena:** a stone bridge over a river; tiles are planks in a single row.
- **Agents:** Twin Daggers `L` (left bank) and `R` (right bank).
- **Signature motion:** the two blades **walk toward each other** and never step backwards. Footprints trail behind them.
- **Seer's Eye: the Pair Matrix.** An n×n grid of all pairs `(i, j)` with each cell colored by `sum − target`. Brute force lights up the whole upper triangle cell by cell. Two pointers trace a **staircase path** from the top-right corner: every move eliminates an entire row or column (it greys out). This makes the proof visible: *we never skip the answer, because whatever we discard can't contain it.*
- **Wrong approach look:** nested loops fill the matrix like rain, and the Ogre arrives at n = 1,000.
- **Typical failures:** blades cross (`L > R`) → the Off-by-One Imp; duplicates in 3Sum → the Twin Doppelgänger (the same triplet is recorded twice, and both copies glow red).
- **Variants:** *Parallel blades* (merge two sorted arrays: one blade per bridge, a third hand placing results onto a new bridge) · *Fast & slow* (see 1.6) · *Tri-blade* (Dutch flag: three zones colored red/white/blue grow as the blades sweep).

### 1.2 Sliding Window: *The Caravan* (Hashmire)
- **Arena:** a long bazaar street; the tiles are stalls with goods (letters or numbers).
- **Agents:** a merchant caravan whose **front wagon** is `R` and **rear wagon** is `L`. The caravan's belly (a Ledger) shows what's currently inside.
- **Signature motion:** an **inchworm**. The front pulls ahead; when the window becomes invalid, the rear catches up. The caravan stretches and contracts but **never moves backwards**.
- **Seer's Eye: the Window Triangle.** A triangle chart of all `(L, R)` windows. Valid windows are green, invalid ones red. The caravan's path traces a monotonic boundary, showing that each wagon moves at most n times → O(n).
- **Belly gauge:** it shows the window's state, e.g. the letter counts with any count above 1 glowing red (an invalid window), or the running sum vs the limit.
- **Wrong approach look:** brute force restarts a fresh caravan at every stall, and the street fills with hundreds of ghost caravans.
- **Typical failure:** the rear wagon *jumping backwards* (the `"abba"` bug, where `L = last[c] + 1` without `max`). The rear wagon visibly reverses, which is impossible for a caravan, and the Jester laughs.

### 1.3 Prefix Sums: *The Staircase of Tribute* (Arraia)
- **Arena:** a tile road with a **staircase** built above it; each step's height is the running total.
- **Signature motion:** the staircase **builds once** from left to right. After that, every range query is answered with a single **measuring rod** between two steps (`P[r+1] − P[l]`), with no walking at all.
- **Aha overlay:** the measuring rod snaps in one tick, while a brute-force query sends a soldier walking the whole range. With 1,000 queries, the brute force road is trampled to mud.
- **Advanced variant:** *Subarray Sum Equals K*. Each step's height is stashed in a Goblin Ledger; for each new step, a beam searches the ledger for "height − k". Combines prefix sums and hashing.

### 1.4 Hashing: *The Goblin Ledger* (Hashmire)
- **Arena:** a market with a **wall of lockers** behind the stalls.
- **Agents:** a single walker (Pointer Spear) and Nib's ledger.
- **Signature motion:** walk + **beam**. For each item, a beam shoots *directly* to a locker (no scanning), and the locker flashes green (found) or the item is filed into it.
- **Aha overlay: Scan vs Beam.** A side-by-side ghost shows the brute-force walker scanning backwards through all previous items for each new one (n² footsteps), while the ledger beam is a single straight line.
- **Collisions** (later, optional depth): two items hashing to the same locker stack up in it, which explains why a hash map is "O(1) average".
- **Typical failure:** using an item as its own partner (`target = 2·x` when `x` appears once). The **Twin Doppelgänger** shows up when the order of "check then stash" is wrong.

### 1.5 Stack: *The Ore Tube* (Khaz-Stack)
- **Arena:** a mine shaft with a vertical spring-loaded tube.
- **Signature motion:** **drop in / spring out**, always from the top only. Open brackets fall in as ore chunks; a closing bracket pulls the top chunk out, and matching shapes **click together** and vanish.
- **Aha overlay: the Nesting Arches.** Matched pairs are drawn as arches over the input, and correct nesting means the arches never cross. A mismatch shows two crossing arches in red.
- **Typical failure:** popping an empty tube (the Null Wraith) or leftover ore at the end ("the tube isn't empty, so some brackets never closed").

### 1.6 Fast & Slow Pointers: *Tortoise and Hare* (Khaz-Stack rail yard)
- **Arena:** a rail track of train cars (linked list) that might loop back on itself.
- **Agents:** **Floyd's Twin Blades**: a dwarf on a slow cart (1 step) and a goblin on a fast cart (2 steps).
- **Signature motion:** on a loop the fast cart **laps** the slow one, and they meet in a burst of sparks. On a straight track the fast cart flies off the end (no cycle).
- **Aha overlay: the Gap Counter.** Once both are on the loop, a number between them shows the gap shrinking by exactly 1 per round, which proves they must meet.
- **Bonus phase:** finding the cycle's start. A second dwarf starts from the station, and both walk at the same speed until they meet at the loop's entrance (with a geometric overlay of the distances).

### 1.7 Linked List Surgery: *Re-hooking the Train* (Khaz-Stack)
- **Arena:** train cars with **couplings** (the `next` pointers drawn as chains).
- **Agents:** `prev`, `curr`, `next` hooks (the Coupling Hook weapon).
- **Signature motion:** **unhook → turn → re-hook**. In *Reverse Linked List* each coupling is lifted and flipped one car at a time, and the reversed part of the train turns green.
- **Danger visual:** if you unhook before saving `next`, the rest of the train **rolls away into the dark** (lost reference). It's dramatic and unforgettable.
- **Dummy Engine:** a sentinel head car that removes special cases at the front of the train.

### 1.8 Monotonic Stack: *The Shield Wall* (Khaz-Stack)
- **Arena:** a dwarven gate; warriors arrive in a line, each with a height (value).
- **Signature motion:** **knock-out cascade**. A new tall warrior arrives and knocks out every shorter warrior at the top of the shield wall. Each knocked-out warrior *gets their answer* ("the next taller one is this warrior, 3 days later") written on a scroll.
- **Aha overlay: one push, one pop.** Each warrior has two tally marks (entered once, left once), which proves O(n) even though there is a loop inside the loop.
- **Wrong approach look:** for each warrior, a scout runs forward looking for someone taller, leaving long overlapping scout trails (n²).
- **Problems:** Daily Temperatures, Next Greater Element, Largest Rectangle in Histogram (the boss: when a warrior is knocked out, a rectangle of their height expands as far as it's allowed to).

### 1.9 Binary Search: *The Halving Hammer* (Gnomeria)
- **Arena:** a long brass rail of gears (sorted values), or, for search-on-answer, a **dial of possible answers**.
- **Agents:** `lo` and `hi` clamps and the hammer at `mid`.
- **Signature motion:** **collapse**. The hammer strikes the middle and one half **crumbles into dust**. The range halves visibly each round, and the round counter shows `⌈log₂ n⌉`.
- **Seer's Eye: the Predicate Strip.** Every position is colored by the predicate: `F F F F T T T T`. Binary search is visibly **"find the first T"**. This one overlay unifies all binary-search variants (lower bound, upper bound, rotated arrays, search on answer).
- **Search on the answer (*Hammer of Thresholds*):** for Koko Eating Bananas, the dial is the eating speed 1…max. Each hammer strike runs a **mini-simulation** at that speed (Koko eats; can she finish in h hours?) and colors the dial position T or F.
- **Typical failures:** an infinite loop when `lo = mid` with floor division (the Ouroboros: the clamps stop moving); `hi = n` vs `n-1` (the Off-by-One Imp); the Overflow Golem for Paladins/Artificers.

### 1.10 Trees & Recursion: *The Clone Climb* (Sylvan Canopy)
- **Arena:** a giant luminous tree; nodes are glowing fruit.
- **Agents:** **Clones**. The hero summons a clone into each child; every clone carries a small scroll (its local variables).
- **Signature motion:** **descend, then report back up**. Clones climb down; leaves answer first; answers **float upward** as glowing orbs that combine at each parent (e.g. `1 + max(left, right)`).
- **Aha overlay: the Clone Tower.** At the side of the screen a stack of clones (the call stack) grows and shrinks. Its maximum height is the recursion's memory use (O(h)).
- **Traversal orders:** pre-, in- and post-order are shown as *when* the fruit glows: on arrival, between children, or on the way back. In-order on a BST lights the fruit in sorted order, a beautiful moment that teaches why in-order + BST = sorted.
- **BST:** comparison signposts at each node (*"less → left"*), so the search path is a single descending line.
- **Typical failure:** a missing base case → the **Hydra of the Deep** (the clone tower overflows the screen).

### 1.11 Trie: *The Rune Tree* (Sylvan Canopy)
- **Arena:** an elven tree where each branch is a letter-rune; word endings carry a golden leaf.
- **Signature motion:** **trace a word** down the branches; shared prefixes reuse the same branch (they glow brighter the more words share them).
- **Aha overlay:** an autocomplete fan. From a prefix node, all completions blossom at once.

### 1.12 BFS: *The Dark Lantern* (Underdark Web)
- **Arena:** cave chambers connected by web strands (graph), or a grid of cavern tiles.
- **Agents:** the Lantern; the Mine Cart Line (queue) is shown at the bottom.
- **Signature motion:** **ripples**. Light spreads in concentric rings; each ring has a distance number (1, 2, 3…). The queue cart line shows exactly which chambers are "lit but not yet expanded".
- **Aha overlay: distance rings.** BFS's correctness for shortest unweighted paths is visible: the rings arrive in order, so the first time light touches a node is its shortest distance.
- **Multi-source (Rotting Oranges):** several lanterns light at once and their rings merge.
- **Typical failure:** forgetting the visited mark → light floods back and forth endlessly and the queue overflows. *Web-Sense* shows the same node entering the queue many times.

### 1.13 DFS: *The Grappling Rope* (Underdark Web)
- **Arena:** the same caves as BFS; the contrast between the two is deliberate.
- **Signature motion:** **one thread going deep**. A single rope descends into one tunnel as far as possible, then **reels back** to the last junction and tries the next tunnel. Visited chambers are chalk-marked.
- **BFS vs DFS duel:** a dedicated level runs both on the same cave side by side, ripples vs a thread. Then the player is asked which one finds the *shortest* path, and why.
- **Cycle detection (*Colored Rope*):** chambers are white (unvisited), gray (rope currently inside) or black (finished). Touching a **gray** chamber means a cycle, and it glows violet.
- **Islands:** each DFS paints one island in a new color; the island counter increments.

### 1.14 Topological Sort: *The Oath Chains* (Underdark Web)
- **Arena:** a council of dark-elf houses; chains between houses mean "must act before".
- **Signature motion:** **unlocking**. Houses with no incoming chains glow and step forward (in-degree 0, Kahn's algorithm). When one acts, its outgoing chains **shatter**, which may free others.
- **Aha overlay:** if houses remain chained when nobody can step forward, the cycle is highlighted. This is Course Schedule's "impossible" answer.
- **Easter egg:** Vex'ra reveals that the world map unlocking the player has experienced *is* a topological order.

### 1.15 Union-Find: *Clan Banners* (Underdark Web)
- **Arena:** a plain of tents, each with its own banner.
- **Signature motion:** **merging banners**. Uniting two clans re-pins one leader's banner under the other's. *Find* climbs the banner poles to the top leader; **path compression** is a rope shortcut drawn directly to the leader (the next climb is instant).
- **Aha overlay:** banner tree height stays tiny with union by rank, shown as a height counter.

### 1.16 Heap: *The War Pyramid* (Orcish Warlands)
- **Arena:** a stepped pyramid of orc warriors; the top seat is the chief.
- **Signature motion:** **duel-bubbling**. A new orc enters at the bottom and **duels upward** with its parent until it loses (sift-up); when the chief is taken, the last orc climbs to the top and **duels downward** (sift-down).
- **Dual view:** the pyramid is also shown flattened as an array strip under it, with parent/child index arrows. This teaches the `2i+1, 2i+2` layout.
- **Aha overlay:** the number of duels per insertion never exceeds the pyramid height (log n).

### 1.17 Greedy & Intervals: *Grukk's Charge & the Sweep Beam* (Orcish Warlands)
- **Greedy motion: the Charge.** At each step Grukk grabs the locally best option (highlighted gold) and never looks back.
- **Exchange-argument overlay:** for problems where greedy is correct, the game shows "any other choice could be swapped for Grukk's without getting worse" (animated swap).
- **Greedy betrayal:** for problems where greedy is *wrong* (Coin Change with `[1,3,4]`, amount 6), the Jester opens the **Greedy Trap Mimic** chest to reveal the counterexample (greedy 4+1+1 = 3 coins vs optimal 3+3 = 2). This is the narrative bridge to Memoria and DP.
- **Intervals: the Sweep Beam.** Intervals are drawn as horizontal war-banners on a timeline. After the Sort Ritual (by start time), a vertical beam sweeps left to right; overlapping banners **fuse** (Merge Intervals) or the **Siege Counter** shows how many overlap at once (Meeting Rooms II = the peak of that counter).

### 1.18 Backtracking: *The Mirror Labyrinth*
- **Arena:** a branching mirrored corridor; each junction is a choice (include/exclude, which number next, where to place a queen).
- **Signature motion:** **step in, record, step out**. The hero walks a choice, chalks it on the path, and on return a **mirror ghost erases the chalk** (undo). Complete paths drop a golden token into the results chest.
- **Aha overlay: the Decision Tree.** The full tree of choices grows beside the maze; explored branches are lit, and **pruned** branches turn to ash instantly when a constraint fails (N-Queens: a queen under attack makes the branch burn).
- **Typical failure:** the **Shallow Mimic**. Saving `path` instead of a copy turns every token in the chest into the same final path at the end, so all the results collapse into one.

### 1.19 Dynamic Programming: *The Hydra and the Archive* (Halls of Memoria)
The most important visual sequence in the game, taught in three acts:

1. **Act I: The Hydra (naive recursion).** The problem is a Hydra; each head is a subproblem. Cutting a head (a recursive call) grows two more. Identical subproblems are **heads of the same color**: the player sees five identical "fib(2)" heads and the Ogre grows exponentially.
2. **Act II: The Memory Crystal (top-down memo).** Memoria hands over the crystal. Once a head of a color is defeated, its answer is **inscribed in the crystal**, and every other head of that color **turns to stone instantly** (cache hit). The tree collapses into a thin vine; the Ogre shrinks back.
3. **Act III: The Archive Shelf (bottom-up table).** The player "flattens" the collapsed tree into a bookshelf of scrolls. Cells light up in a **wave** in dependency order, and each cell draws **dependency arrows** to the cells it reads. Rolling-array space optimization is the shelf shrinking to two rows that leapfrog each other.

- **2D DP (LCS, Edit Distance):** a grid where each cell's arrows come from left, up and diagonal. The final answer path is traced back from the corner as a golden line, which *is* the alignment/edit script.
- **Aha overlay: Dependency Arrows.** These are the hardest thing in DP to see in your head, so they are always drawn.

### 1.20 Bit Manipulation: *Gnomish Levers* (Gnomeria)
- **Arena:** a panel of brass levers (bits).
- **Signature motion:** **levers flipping in unison**. XOR shows pairs of equal numbers cancelling (levers flip twice and return), leaving the single number (Single Number).
- **Aha overlay:** bit columns drawn as stacked lever rows, with column-wise parity.

---

## 2. One Problem, Many Battles: how solutions look different

A key feature is that **different solutions to the same problem produce visibly different battles**, and the game encourages discovering several. After a victory, the Spoils screen offers: *"Grukk heard there are other ways to slay this beast…"*

**Example: Two Sum (unsorted) has three battles**

| Approach | What you see | Stamina (n=10,000) | Weight | Result |
|---|---|---|---|---|
| **Grukk's Way** (brute force, nested loops) | A soldier runs from each tile across all following tiles, and the Pair Matrix fills completely | ≈ 50,000,000 → Ogre fills the screen | O(1) | 1★ (examples only; fails the Horde wave) |
| **Sort Ritual + Twin Daggers** (keep the original indices) | A whirlwind sorts the tiles, then the blades converge with a staircase in the Pair Matrix | ≈ 140,000 + 10,000 | O(n) (index tags) | 2★ |
| **Goblin Ledger** (one pass) | One walk; each tile shoots a beam to a locker | ≈ 30,000 | O(n) | 2★, best time |

The **Trade-off Scale** (a balance with time on one side and space on the other) is shown for every discovered approach. Finding all three earns the **"Three Roads" achievement** and a War Council question: *"When would you choose the sorting approach over the ledger?"* (Answer: when memory is tight or the input is already sorted.) Discussing trade-offs like this is exactly what interviewers look for.

Other multi-solution showcases:
- **Contains Duplicate:** nested scan vs Sort Ritual + neighbor check vs Goblin Pouch.
- **Climbing Stairs:** Hydra vs Memory Crystal vs Archive Shelf vs two-row rolling shelf.
- **Kth Largest:** Sort Ritual vs War Pyramid (size k) vs Hoare's Partition Axe.
- **Linked List Cycle:** Goblin Pouch of visited cars (O(n) space) vs Floyd's Twin Blades (O(1) space).

---

## 3. Seer's Eye: the proof-view catalog

Seer's Eye overlays are unlocked by wearing the **Helm of Invariants** and writing the matching invariant (or by reaching Honored with the faction). They are the game's way of teaching *why* algorithms are correct, not just *that* they work.

| Pattern | Overlay | Invariant it visualizes |
|---|---|---|
| Two pointers | Pair Matrix staircase | "The answer, if any, lies within rows ≥ L and columns ≤ R" |
| Sliding window | Window Triangle | "Every window ending at R that starts before L is invalid" |
| Binary search | Predicate Strip | "Everything left of lo is F; everything right of hi is T" |
| Monotonic stack | Tally marks | "The stack is always decreasing; each element is pushed/popped once" |
| BFS | Distance rings | "The queue holds nodes of distance d then d+1, never more" |
| DFS cycle | White/Gray/Black | "Gray = on the current path" |
| Heap | Duel count | "Parent ≥ children everywhere" |
| Greedy | Exchange animation | "Swapping in the greedy choice never makes things worse" |
| DP | Dependency arrows | "Each cell depends only on already-filled cells" |
| Backtracking | Decision tree with ash | "Pruned subtrees cannot contain a valid answer" |

---

## 4. Technical note: semantic events → realm animations

To make all these visuals feasible (and to support Classic Mode), the interpreter does **not** emit raw "line 7 executed" events. It emits **semantic events** in the Battle Chronicle:

```
{ t: 24, type: "agent.move",     agent: "R",  from: 6, to: 5 }
{ t: 25, type: "compare",        a: {tile:1}, b: {tile:5}, op: "+", result: 14, vs: "target", outcome: "eq" }
{ t: 26, type: "container.put",  container: "ledger", key: 7, value: 2 }
{ t: 27, type: "call.enter",     fn: "fib", args: [3], depth: 2, memoKey: "3" }
{ t: 28, type: "memo.hit",       key: "3" }
{ t: 29, type: "return",         value: [1, 5] }
```

Each realm has a **renderer skin**: a mapping from event types to animations (Arraia: `agent.move` → a soldier walking a plank; Underdark: `container.put` on a queue → a cart rolling onto the rail). Seer's Eye overlays are derived views over the same event stream (e.g. the Pair Matrix is computed from `agent.move` + `compare` events). This architecture means:

- One interpreter and many art styles.
- Classic Mode is just another skin.
- Ghost replays, the Jester's divergence point, and the Growth Chart all reuse the Chronicle.
- **Code-first players** get the same visuals: their typed code is instrumented to emit the same semantic events (by tracking reads/writes on wrapped arrays, maps and heaps).
