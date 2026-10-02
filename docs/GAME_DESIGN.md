# VICODING — Game Design Document

> **Build the algorithm. Watch it run. Then read the code you just wrote.**

> 📚 Detailed design (races, gear, mechanics, pattern visuals, level walkthroughs) lives in [`design/`](design/). See the [index](README.md).

Vicoding is a puzzle game where players solve LeetCode/HackerRank-style problems by **building algorithms visually** on a canvas: they place data structures, drop in agents (pointers, windows, queues, recursive clones), attach rules to them, and press **Run** to watch the execution play out. Every visual solution compiles live into real code (Python / JavaScript / Java), so the player gradually moves from "I can see it" to "I can write it on a whiteboard at Google."

---

## 1. Vision & Pillars

| Pillar | What it means in practice |
|---|---|
| **See the invariant** | Every algorithm has a picture in an expert's head. We draw that picture and make it interactive. |
| **Experiment is free** | Runs are instant, rewindable, and never punished. Failing is how you find the edge case. |
| **The code is the reward** | Each solved level reveals the real code of *your* solution. Visual → pseudocode → code is the learning path. |
| **Interview-shaped** | Progression follows the patterns big-tech interviews actually test, ending in a timed, talk-out-loud mock interview. |
| **Complexity you can feel** | Big-O is not a label; it's a meter that fills up and a graph that bends as input grows. |

**Target players**
1. *The CS student / bootcamp grad* — knows syntax, freezes on "Medium" problems.
2. *The career switcher* — learns best visually, intimidated by a blank editor.
3. *The working engineer prepping for FAANG* — wants to re-learn patterns fast and drill.

---

## 2. Core Loop

```
 ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌───────────┐   ┌───────────┐
 │  READ    │ → │  BUILD   │ → │   RUN    │ → │  VERIFY   │ → │  REVEAL   │
 │ story +  │   │ place    │   │ animated │   │ hidden +  │   │ your code │
 │ examples │   │ agents & │   │ execution│   │ adversarial│  │ + stars + │
 │          │   │ rules    │   │ step/scrub│  │ test cases│   │ Big-O     │
 └──────────┘   └────▲─────┘   └────┬─────┘   └─────┬─────┘   └───────────┘
                     │   tweak      │   fail        │
                     └──────────────┴───────────────┘
```

A level takes 2–10 minutes. A session is ~3 levels + 1 daily review.

---

## 3. The Canvas: How a Visual Program Works

The whole game rests on one small, consistent "visual language" with four building blocks.

### 3.1 Objects (the data)
Data structures rendered as physical things:

| Structure | Visual | Unlocked in |
|---|---|---|
| Array / String | Row of numbered tiles on a track | World 1 |
| Hash Map / Set | Wall of lockers with labels | World 3 |
| Stack | Vertical spring-loaded tube | World 4 |
| Queue / Deque | Conveyor belt | World 4 |
| Linked List | Train cars with couplings you can re-hook | World 5 |
| Tree | Growing tree, nodes as fruit | World 7 |
| Graph | Islands + bridges map | World 8 |
| Heap | Pyramid that self-settles with physics | World 9 |
| DP Table | Grid of glowing cells that fill in | World 11 |

Inputs are given by the level, but players can **edit inputs freely** (drag tiles, type values, "randomize", "make it nasty") to experiment.

### 3.2 Agents (the "who moves")
Agents are what turns data into an algorithm:

- **Pointer** — a little robot standing on an index (`L`, `R`, `i`, `slow`, `fast`).
- **Window** — a stretchy bracket defined by two pointers; shows its live sum/count/contents.
- **Cursor of a structure** — e.g. "top of stack", "front of queue".
- **Clone (recursion)** — an agent that spawns copies of itself into a sub-problem; each clone carries its own scroll of local variables. The call stack is shown as a stack of clones.
- **Scout (BFS/DFS)** — paints visited nodes, leaves breadcrumbs (parent links).

### 3.3 Rules (the logic)
Each agent gets a **rule card** — a tiny when/then program built from snap-together blocks (Scratch-like, but much more constrained, so there is little to fumble):

```
┌─ Rule card: Pointer L ─────────────────────────────┐
│ EACH TICK:                                          │
│   IF  arr[L] + arr[R]  ==  target  → ✅ RETURN [L,R]│
│   IF  arr[L] + arr[R]  <   target  → ➡ move L +1    │
│   ELSE                             → ⬅ move R −1    │
│ STOP WHEN  L ≥ R                                    │
└─────────────────────────────────────────────────────┘
```

Blocks available: compare, arithmetic, move, read/write structure, push/pop, put/get in map, spawn clone, return, record best (`max=`/`min=`), and named **variables** shown as floating gauges on the canvas.

### 3.4 Run & Debug
- **Play / Step / Rewind / Scrub** — a timeline at the bottom; every tick is a frame you can scrub back to.
- **Speed dial** — 0.25× to "instant".
- **Freeze stones** (breakpoints) — drop on a tile or rule line to pause there.
- **Trails** — pointers leave fading footprints, so you literally *see* that L only ever moves right (that's the O(n) argument!).
- **Op counter** — every read/compare/write ticks a counter. This is how complexity is measured.

### 3.5 Verify
On **Submit**, the level runs your build against:
1. The visible examples,
2. Hidden cases (empty input, single element, duplicates, negatives, max size),
3. **The Adversary** — a character who generates inputs designed to break *your* specific build (worst-case for your complexity, off-by-one boundaries).

A failing case is not a red X — it's **replayed on the canvas** at the exact moment it went wrong ("Your R pointer walked off the edge at tick 7").

---

## 4. Complexity as a Game Mechanic

- **Energy meter**: each level has an energy budget sized for the optimal complexity (e.g. ~2n ops for an O(n) target). Brute force solves the small examples but **runs out of energy** on the large hidden test — the player feels why O(n²) fails.
- **Growth graph**: after a run, a slider scales input size 10 → 10,000 and plots your op count against reference curves (n, n log n, n²). Your curve visibly bending upward is the lesson.
- **Memory meter** (later worlds): extra structures cost "space crystals", teaching space complexity trade-offs.

---

## 5. Scoring & Stars

| ⭐ | Requirement |
|---|---|
| 1 | Correct on all tests (any complexity that fits the hard energy cap) |
| 2 | Hits the target time complexity |
| 3 | Hits target space **and** uses ≤ par number of rule blocks (elegance) |

Bonus badges: *No hints*, *First try*, *Found my own bug with the Adversary*, *Explained it* (see Interview Mode).

---

## 6. From Pictures to Code: Scaffolding Fade

The key educational design: the training wheels come off gradually, so the game does not trap players in a visual-only world.

| Stage | What the player edits | What they see |
|---|---|---|
| **A. Visual only** (Worlds 1–2) | Blocks on canvas | Code panel hidden until level complete, then revealed as "Your solution in Python" |
| **B. Mirror** (Worlds 3–6) | Blocks | Code panel live, highlighted line follows execution |
| **C. Two-way** (Worlds 7–10) | Blocks **or** code | Editing code re-renders the canvas; canvas edits rewrite code |
| **D. Code-first** (Worlds 11+) | Code only | Canvas becomes the visualizer/debugger for their typed code |
| **E. Interview** | Code in a plain editor | No canvas. Optional "sketch pad" to draw like on a whiteboard |

Languages: Python first, then JavaScript and Java (most common interview languages).

---

## 7. World Map & Progression

Worlds follow the classic interview pattern list. Each world has: **3 tutorial levels → 5–8 core levels → 1 Boss level → endless Remix levels.** Bosses are adaptations of real Medium/Hard interview problems.

| # | World (theme) | Pattern | Example levels (source problem → game adaptation) | Boss |
|---|---|---|---|---|
| 1 | **The Track** | Arrays & iteration | Find max; running sum; *Best Time to Buy & Sell Stock* → "Ride the cheapest train, sell at the peak" | Product of Array Except Self |
| 2 | **Bridge Builders** | Two pointers | *Two Sum II (sorted)* → two builders walk inward to find planks summing to the gap; *Valid Palindrome* → mirror twins; *Move Zeroes* | Container With Most Water / 3Sum |
| 3 | **The Locker Room** | Hashing | *Two Sum* (unsorted) → put each number in a locker, look up its partner; *Group Anagrams*; *Contains Duplicate* | Longest Consecutive Sequence |
| 4 | **The Caterpillar** | Sliding window | *Longest Substring Without Repeating* → a caterpillar eats letters, spits from the tail when it tastes a repeat; *Max sum subarray of size k* | Minimum Window Substring |
| 5 | **Spring Tubes & Conveyors** | Stack / Queue | *Valid Parentheses* → plates in a spring tube; *Daily Temperatures* (monotonic stack); *Implement Queue with Stacks* | Largest Rectangle in Histogram |
| 6 | **The Elevator** | Binary search | *Guess the floor* in ≤ log n moves; *Search Insert Position*; *Search in Rotated Sorted Array* → broken elevator | Koko Eating Bananas (search on answer) |
| 7 | **The Rail Yard** | Linked lists | *Reverse Linked List* → re-hook train couplings; *Cycle detection* → tortoise & hare on a loop track; *Merge Two Lists* | Reverse Nodes in k-Group / LRU Cache |
| 8 | **The Orchard** | Trees & recursion | *Max Depth* → clones climb branches and report back; *Invert Tree* mirror; *Lowest Common Ancestor* | Serialize/Deserialize Binary Tree |
| 9 | **The Archipelago** | Graphs BFS/DFS | *Number of Islands* → flood scouts; *Rotting Oranges* → multi-source BFS wave; *Course Schedule* → topological sort of bridges | Word Ladder |
| 10 | **The Pyramid** | Heaps | *Kth Largest*; *Merge K Sorted Lists*; *Top K Frequent* | Find Median from Data Stream (two pyramids) |
| 11 | **The Maze of Choices** | Backtracking | *Subsets* → branching path with an "undo" rewind; *Permutations*; *N-Queens* on a board | Word Search II |
| 12 | **The Tile Factory** | Dynamic programming | *Climbing Stairs* → see the tree of repeated clones, then add a memo locker and watch it collapse; *Coin Change* grid; *House Robber* | Longest Common Subsequence / Edit Distance |
| 13 | **The Calendar** | Intervals & greedy | *Merge Intervals*; *Meeting Rooms II*; *Jump Game* | Non-overlapping Intervals |
| 14 | **Advanced Labs** | Trie, Union-Find, Dijkstra, bit tricks | *Implement Trie* as a word tree; *Redundant Connection*; *Network Delay Time* | Alien Dictionary |

**Gating:** a world unlocks after the previous world's Boss **or** by passing a 3-question placement test (so experienced engineers skip ahead).

**Difficulty within a level series** follows the same five-step ramp:
1. **Watch** — a pre-built solution runs; player predicts where pointers end up.
2. **Fix** — a build with one bug; find and repair it.
3. **Fill** — rule card partly filled; complete the missing block.
4. **Build** — empty canvas, given tools.
5. **Choose** — empty canvas, *all* tools available; picking the right pattern is part of the puzzle (this is the real interview skill).

---

## 8. Sample Level Walkthroughs

### Level 2-4 · "Bridge Builders" (Two Sum II — sorted input)
> *The river has planks of sorted lengths. Find two planks whose lengths add up to exactly the gap of 9.*

- Canvas: array `[2, 7, 11, 15]`, target gauge `9`.
- Tools: 2 pointers, compare block, move block.
- A brute-force player drags one pointer with a nested loop → passes examples, **runs out of energy** on the 10,000-plank hidden test.
- The Hint Owl: *"When the sum is too small, which builder can make it bigger?"*
- Solution: L at 0, R at end, move inward. Trails show each builder only walks one direction → "That's why it's O(n)."
- Reveal:
  ```python
  def two_sum(nums, target):
      l, r = 0, len(nums) - 1
      while l < r:
          s = nums[l] + nums[r]
          if s == target: return [l, r]
          if s < target: l += 1
          else: r -= 1
  ```

### Level 4-3 · "The Caterpillar" (Longest Substring Without Repeating Characters)
- A caterpillar (window) crawls over letter tiles. Its belly shows the letters inside (a set from the Locker Room world).
- Rule card: head eats next letter; *if letter already in belly → tail spits until it isn't*; record best length.
- The Adversary's favorite input: `"abba"` — exposes players who move the tail backwards.

### Level 12-1 · "The Tile Factory" (Climbing Stairs → DP)
- Player first builds the naive recursion with Clones. The canvas shows a **tree of clones exploding** — duplicate sub-problems glow the same color.
- Tool unlock: **Memo Locker**. Attach it → identical glowing clones collapse into one; op counter drops from ~2ⁿ to n.
- Final step: "Flatten the tree" turns the memo into a bottom-up table — the player discovers tabulation themselves.

---

## 9. Interview Mode (the endgame)

A mock interview that mirrors a real 45-minute loop:

1. **Clarify (3 min)** — An AI interviewer presents a problem *without* examples of edge cases. The player earns points for asking about them (empty input? duplicates? range?).
2. **Approach (7 min)** — Player explains the plan by voice or text and may sketch on the canvas. The interviewer pushes back ("What's the complexity? Can you do better?").
3. **Code (25 min)** — Plain editor, no auto-visualization.
4. **Test (5 min)** — Player walks through an example by hand; then hidden tests run.
5. **Feedback** — A scorecard on the four axes interviewers use: *Problem solving, Coding, Communication, Testing*, plus a replay with the canvas visualizing the submitted code.

Tracks: **Company playlists** (e.g. "Arrays-heavy", "Graph-heavy", "Hard-DP"), and **Timed ladders** (Easy → Medium → Hard in 60 min).

---

## 10. Retention & Learning Systems

- **Daily Review (spaced repetition):** 1–2 previously solved levels come back as *Remix* versions (new story, same pattern) on a spacing schedule tied to how hard each felt.
- **Pattern Mastery radar:** a spider chart of the 14 patterns — the player's personal "interview readiness" map.
- **Hint ladder** (costs no stars, only removes the *No hints* badge): Nudge question → Name the pattern → Show the invariant → Fill one block.
- **Streaks & Leagues:** weekly leagues ranked by stars and Adversary wins, not raw time (avoid rewarding cheating/rushing).
- **Ghost replays:** after solving, watch anonymized solutions of others side by side with yours, sorted by op count — "this person did it in half the operations, see how?"

---

## 11. Community & Creation

- **Level Editor:** anyone can create a level by uploading a problem statement, a reference solution, and tests; the editor auto-generates the canvas from the reference solution's data structures.
- **Remix any level:** change the story/skin, keep the logic.
- **Challenge a friend:** send a build and a target ("beat 180 ops").

---

## 12. Art & Feel

- Clean, toy-like 2.5D look (think *Monument Valley* meets a whiteboard). Every structure has a tactile metaphor (tiles, lockers, springs, trains, trees).
- Color code is consistent everywhere: **blue = pointers/agents, amber = values being compared, green = success/visited, red = conflict, purple = memo/cached.**
- Sound design reinforces logic: a soft tick per operation means O(n²) literally *sounds* longer.
- Accessibility: every animation also emits a text log ("Tick 4: L moves 1→2, sum 18 > 9"), color-blind safe palette, full keyboard control, screen-reader narration of the timeline.

---

## 13. Technical Design (MVP-oriented)

```
┌──────────────────────── Client (Web, React + PixiJS) ─────────────────────┐
│ Canvas renderer │ Block/rule editor │ Timeline/scrubber │ Code panel (Monaco)│
└────────┬──────────────────────┬──────────────────────────────┬────────────┘
         │ visual program        │ events                        │ typed code
         ▼                       ▼                               ▼
   ┌───────────────┐      ┌───────────────┐            ┌──────────────────┐
   │ Program IR    │◄────►│  Interpreter  │──trace───► │  Code ↔ IR bridge│
   │ (JSON AST)    │      │ step-by-step, │            │ Python/JS/Java   │
   └───────────────┘      │ op counting   │            │ gen + parse subset│
                          └───────┬───────┘            └──────────────────┘
                                  │ trace (list of frames)
                                  ▼
                       Renderer animates frames; scrubber = index into trace
```

- **One IR, many views.** The visual program is a small typed AST (JSON). The interpreter executes it deterministically and emits a **trace** (one frame per op). Animation, rewind, op counting, and the growth graph all come for free from the trace.
- **Code generation** from IR is straightforward; **code → IR** (stage C/D) supports a restricted subset of Python/JS; outside the subset the canvas falls back to "visualize variables only."
- **Code-first & interview mode** run user code in a sandbox (Pyodide / Web Worker for JS), instrumented to produce the same trace format so the visualizer still works.
- **Level format** (data-driven so designers and the community can add levels without code):

```json
{
  "id": "2-4-bridge-builders",
  "source": "Adapted from 'Two Sum II – Input Array Is Sorted'",
  "story": "Find two planks that exactly span the gap.",
  "objects": [{ "type": "array", "name": "planks", "input": "nums" }],
  "tools": ["pointer", "pointer", "compare", "move", "return"],
  "examples": [{ "nums": [2,7,11,15], "target": 9, "expect": [0,1] }],
  "hiddenTests": "tests/2-4.json",
  "adversary": ["sorted_worst_case", "duplicates", "min_size"],
  "targets": { "time": "O(n)", "space": "O(1)", "parBlocks": 6, "energy": "2n+5" },
  "hints": ["Which builder can make the sum bigger?", "Two pointers, moving inward", "..."],
  "stage": "build"
}
```

- **Backend:** accounts, progress, spaced-repetition scheduler, leaderboards, level store; AI interviewer/hints via an LLM with the level's reference solution and the player's trace as context.

---

## 14. Monetization

- **Free:** Worlds 1–4 fully, daily review, 1 mock interview / week.
- **Pro (monthly):** all worlds, unlimited Interview Mode, company playlists, AI interviewer feedback, all languages.
- **Teams/Edu:** bootcamps and universities get classroom dashboards (which patterns each student struggles with).
- No pay-to-win: hints are never paywalled within a level.

---

## 15. Success Metrics

| Goal | Metric |
|---|---|
| Learning works | % of players who pass a Remix of a pattern 7 days later without hints |
| Transfer to real code | Stage D/E solve rate for patterns learned visually |
| Engagement | D1 / D7 / D30 retention; levels per session |
| Outcome | Self-reported interview offers (opt-in survey); NPS |

---

## 16. MVP Scope (first playable, ~8–10 weeks)

1. Canvas with **Array**, **Pointer**, **Window**, **Hash Map**; rule-card editor.
2. Interpreter + trace + timeline scrubber + op counter + energy meter.
3. Worlds 1–4 (≈30 levels), Python code reveal (stages A–B).
4. Adversary for array-type inputs.
5. Local progress; no backend accounts yet.

**Next:** stacks/queues/linked lists → two-way code editing → trees/recursion clones → Interview Mode with AI interviewer → level editor.

---

## 17. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Visual blocks become a crutch; no transfer to typed code | Scaffolding fade (§6) is mandatory; stars in later worlds require code stages |
| Block editor feels clunky for complex logic | Keep the block vocabulary tiny; allow typed expressions inside blocks from World 3 |
| Hard problems (graphs, DP) are hard to visualize | Prototype Worlds 9 & 12 early; they are the ones that prove the concept |
| Copying LeetCode content | Use problem *patterns* (not copyrightable) with original stories, inputs and wording; credit "inspired by" generically |
| Players game the energy meter | Energy is checked on adversarial large inputs, not visible examples |

---

## 18. Elevator Pitch

> *Duolingo taught millions a language by turning lessons into a game. Vicoding does the same for the coding interview: you don't memorize solutions — you build them with your hands, watch them run, break them with an adversary, and walk away with the code and the intuition. By the time you reach the Boss of the Tile Factory, dynamic programming isn't a trick you memorized; it's a tree of clones you watched collapse.*
