# 03 · Core Mechanics: Encounters, Battle Plans & Execution

> Part of the Vicoding design set. See [`../README.md`](../README.md) for the index.

This document specifies **how a level actually plays**: the phases of an encounter, the visual programming language ("Battle Plans"), the precise execution rules, how tests become combat, how the run is scored, and every game mode built on top of it.

---

## 1. Anatomy of an Encounter

Every level is an **Encounter** with six phases. The fantasy names are what the player sees; the right-hand column is what they are really learning.

```
 ① SCOUT ──► ② ARM ──► ③ PLAN ──► ④ FORGE ──► ⑤ BATTLE ──► ⑥ SPOILS
 read &       choose    build the   write your   run, watch,  code reveal,
 recognize    loadout   tactics     own tests    survive waves loot, reflect
```

| Phase | Player does | Real skill | Time (typical) |
|---|---|---|---|
| **① Scout** | Reads the monster's story, inspects the Scout Card (traits), plays with the example "Visions" (inputs) on the canvas by hand | Understanding the problem, clarifying, recognizing the pattern | 0.5–2 min |
| **② Arm** | Picks weapons, containers, spells for the loadout | Choosing an approach & data structures | 0.5 min |
| **③ Plan** | Builds the Battle Plan (tactic cards) | Designing the algorithm | 2–6 min |
| **④ Forge** *(optional, rewarded)* | Adds test cases and invariants (armor) | Testing & correctness reasoning | 0.5–2 min |
| **⑤ Battle** | Runs, steps, scrubs, fixes; then faces the hidden waves | Debugging, verifying | 1–4 min |
| **⑥ Spoils** | Sees the code scroll, stars, loot; optionally explains to Quill; answers one "War Council" question | Translating to code, complexity analysis, communication | 0.5–1 min |

The player can jump between ③ ④ ⑤ freely. Iterating is the core loop:

```
          ┌──────────── tweak ────────────┐
          ▼                               │
   ③ PLAN ──► ⑤ BATTLE (examples) ──► fail/slow
          │
          └──► ⑤ BATTLE (hidden waves) ──► victory ──► ⑥ SPOILS
```

---

## 2. Scouting: playing with the problem by hand

Before writing anything, the player can **manually play the problem** using *Hand Mode*: drag pointers yourself, click tiles to "inspect" them, put items in containers by hand. Hand Mode is not scored. It exists because the best way to understand a problem is to solve one small example by hand, which is exactly what interviewers recommend.

- **Visions** = example inputs. The player can **edit** them (drag, type, randomize, "make it nasty").
- When the player solves a Vision by hand, Quill offers: *"You just did it by hand. Want me to write down the moves you made?"* The game then turns the manual moves into a **draft Battle Plan** (a recorded macro). It is often wrong in general, but it's a starting point, and it teaches the "generalize from an example" step.

---

## 3. The Battle Plan language

The visual language is the heart of the game. It must be **tiny, consistent, and map 1:1 to code**.

### 3.1 Structure

A Battle Plan is a stack of **cards**. Every plan has the same skeleton:

```
┌─ ⚑ MUSTER (setup) ──────────────────────────────────┐   ← variable/agent initialization
│  Place  🗡L  at  first tile                          │
│  Place  🗡R  at  last tile                           │
│  Raise banner  best = 0                              │
├─ ⟳ EACH ROUND, WHILE  [ 🗡L before 🗡R ] ───────────┤   ← main loop (while/for)
│  ⟐ IF  [ value at 🗡L ] + [ value at 🗡R ] = target  │
│       ⚔ VICTORY  return [ 🗡L , 🗡R ]                │
│  ⟐ OR IF  … < target                                 │
│       ➜ advance 🗡L                                  │
│  ⟐ OTHERWISE                                         │
│       ⬅ retreat 🗡R                                  │
├─ ⚐ AFTERMATH ───────────────────────────────────────┤   ← code after the loop
│  ⚔ VICTORY  return  "no pair"                        │
└──────────────────────────────────────────────────────┘
```

| Card part | Code equivalent |
|---|---|
| **Muster** | variable & data-structure initialization |
| **Each Round, While ⟨condition⟩** | `while` loop |
| **For each tile with ⟨agent⟩** | `for` loop (a single agent sweeps) |
| **Inner Round** (nested card) | nested loop. **Drawn as a ring inside a ring**, so nested loops are visually heavy on purpose |
| **If / Or if / Otherwise** | `if / elif / else` |
| **Victory ⟨value⟩** | `return` |
| **Banner** | named variable (rendered as a flag planted on the battlefield, showing its value) |
| **Summon Clone ⟨plan⟩ with ⟨args⟩** | function call / recursion. A sub-plan is a separate card deck with its own Muster |
| **Tactic (named sub-plan)** | helper function |

### 3.2 Order blocks (the verbs)

Orders are colored by category. Players drag them from the **Armory Tray**, which only contains verbs for equipped gear. This is why the loadout matters: you can't push to a stack you didn't bring.

| Category (color) | Orders |
|---|---|
| **Movement** (blue) | `advance ⟨agent⟩ [by k]` · `retreat ⟨agent⟩` · `jump ⟨agent⟩ to ⟨index⟩` · `swap tiles under ⟨a⟩ and ⟨b⟩` |
| **Look** (amber) | `value at ⟨agent⟩` · `tile at ⟨index⟩` · `length of ⟨structure⟩` · `neighbors of ⟨node⟩` · `children of ⟨node⟩` |
| **Compare & math** (amber) | `= ≠ < ≤ > ≥` · `+ − × ÷ mod` · `min` `max` · `abs` · `and/or/not` |
| **Containers** (green) | Ledger: `stash k→v` · `recall k` · `has k?` · `forget k` · Pouch: `add` · `contains?` · Tube: `push` · `pop` · `peek` · `empty?` · Cart: `enqueue` · `dequeue` · Pyramid: `offer` · `take top` · `top` · `size` |
| **Banners** (purple) | `raise banner x = …` · `set x = …` · `record best: x = max(x, …)` |
| **Flow** (grey) | `Victory` · `skip to next round` (continue) · `break formation` (break) |
| **Spells** (cyan) | `Summon Clone` · `consult Memory Crystal` · `inscribe in Crystal` · `Sort Ritual` |

### 3.3 Expression slots
- **Worlds 1–2:** slots accept only dragged pieces (agents, tiles, banners, numbers). It's impossible to make a syntax error.
- **From Hashmire on:** a slot can be clicked to *type* an expression (`nums[l] + nums[r]`). The typed text is parsed and shown back as blocks, which is the bridge to Stage C (two-way code editing).

### 3.4 Live code twin
The **Spellbook panel** shows the code generated from the plan in the player's class language, at all times or only on reveal depending on the scaffolding stage (see the original [Game Design §6](../GAME_DESIGN.md)). During a battle, the currently executing line glows in **both** the plan and the code.

---

## 4. Execution semantics (the "physics")

The interpreter must be deterministic and explainable. These rules are shown to players in a codex page as "the Laws of Battle".

1. **One tick = one primitive operation.** Primitive operations are a comparison, an arithmetic op, a structure read/write, an agent move, a container op, or a call/return. Every tick is **one animation beat** and **one stamina point**.
2. **Container op costs** follow the real data structure: Ledger `recall` = 1 tick (beam animation), Pyramid `offer` = `⌈log₂ size⌉` ticks (the duel-bubble animation plays that many times), Sort Ritual = `n⌈log₂ n⌉` ticks (charged as one whirlwind). Players learn the real cost model.
3. **Agents are just indices/references.** An agent can stand on the "void" (index `n` or `-1`), but *reading* the void spawns an **Off-by-One Imp** and the battle halts with a precise explanation.
4. **Execution is sequential**, exactly like the code twin. There is no hidden concurrency. Multiple agents only *look* simultaneous because their moves animate smoothly in the same round.
5. **Every tick is recorded** into the **Battle Chronicle** (trace). Rewind, scrubbing, the op counter, the Ogre, ghost replays and the complexity graph all read from the Chronicle.
6. **Safety caps:** a round limit (Ouroboros detection), a clone-depth limit (Hydra detection) and a stamina hard cap (10× the target), so a broken plan always terminates with an *explanation*, never a frozen game.

### Timeline controls
`⏮ rewind-to-start` · `◀ step back` · `▶ play` · `▶| step` · `⏭ to end` · speed `¼× ½× 1× 2× 8× instant` · **round markers** on the scrubber · **freeze stones** (breakpoints) on tiles, cards, or banner conditions (`freeze when best > 5`).

---

## 5. Stamina, the Ogre, and Complexity

### 5.1 Stamina (time budget)
Each encounter has a **stamina budget** derived from the target complexity, e.g. `2n + 10` for O(n), `n·⌈log₂ n⌉·3 + 20` for O(n log n). The bar is shown under the hero.

### 5.2 Big-O the Ogre
After a victory on the examples, the battle **zooms out** to a large input (the Horde wave, see §6). If the plan's tick count passes the budget at large n, **Big-O the Ogre** stomps in. His height is drawn proportional to `your_ticks / budget`. The player watches him grow as n grows (the camera literally has to pull back). An O(n²) plan at n = 10,000 makes the Ogre ~5,000× the budget, so he dwarfs the screen. The lesson is understood in one second.

### 5.3 The Growth Chart ("Ogre's Shadow")
A chart that plots your tick count for n = 8, 16, 32 … 4096 against reference curves (log n, n, n log n, n², 2ⁿ). Your curve's shape is labeled automatically: *"Your plan grows like n² — the Ogre approves."* The player can tap any point to replay the battle at that n.

### 5.4 Encumbrance (space)
Peak container sizes are summed into **weight**. The bar turns yellow above the "Travel Light" target and red above the space cap.

---

## 6. Waves: tests as combat

When the player presses **Charge!** (submit), the plan fights a sequence of waves. Each wave is a test category with its own animation.

| Wave | Content | Visual |
|---|---|---|
| **1 · Vanguard** | The visible examples | Familiar foes; quick |
| **2 · Skirmishers** | Small hidden edge cases: empty, single, duplicates, negatives, no-answer | Tiny goblin-sized foes; mostly tests guards & bounds |
| **3 · The Horde** | Large inputs (n up to 10⁵) | Battle runs at "instant", only the stamina bar and Ogre animate |
| **4 · Jester's Gambit** | **Adversarial inputs generated against your plan** | Jester Edgecase juggles inputs, then throws the nastiest one |

### 6.1 How the Jester finds attacks (adversarial test generation)
1. A pool of **category generators** per level (sorted worst case, all duplicates, pattern `"abba"`, deep chain graph, skewed tree…).
2. **Differential fuzzing** against the reference solution: random small inputs, keep any where your output differs.
3. **Shrinking:** a failing input is minimized to the smallest reproducer (`[3,3]` rather than a 40-element array) before it is shown. A small counterexample is what makes a bug understandable.
4. **Complexity attacks:** inputs that maximize *your* plan's tick count (e.g. making your inner loop run fully).

### 6.2 Defeat is a replay, not a game over
When a wave defeats the plan, the screen shows:
- the **shrunken counterexample**,
- the battle **auto-replayed to the exact tick where your output diverged** from the reference (the reference's ghost runs side by side, translucent),
- the bug's Bestiary type if it's recognized (e.g. *"Off-by-One Imp: your 🗡R started at n instead of n−1"*).

There are no lives, no timers (outside Trials), and no lost progress. The **Chronomancer's Hourglass** (rewind) is always free.

---

## 7. Scoring

### 7.1 Stars (per encounter)
| ★ | Name | Requirement |
|---|---|---|
| ★ | **Victory** | All waves defeated within the stamina hard cap |
| ★★ | **Swift** | Ogre never summoned (target time complexity) |
| ★★★ | **Masterful** | Target space ("Travel Light" when applicable) **and** plan size ≤ par cards |

### 7.2 Battle Report (the four interview axes)
Each victory also produces a small report graded on the same axes as real interviews:

| Axis | Signals |
|---|---|
| **Problem solving** | Right weapon chosen, number of plan rewrites, hints used |
| **Code / plan quality** | Plan size vs par, clean names on banners, no dead cards |
| **Testing** | Testplate coverage, Parries, invariants written, Foresight predictions |
| **Communication** | Quill explanation score (optional) |

### 7.3 War Council question
After victory, one quick question (multiple choice or slider), e.g. *"What's the space complexity of your plan?"*, *"What breaks if the array isn't sorted?"*, *"Which wave would fail if you removed the guard?"* This builds the habit of analyzing a solution after writing it.

---

## 8. Difficulty Design

### 8.1 The five-step ramp (within each pattern)
| Step | Name | What's given | Player task |
|---|---|---|---|
| 1 | **Witness** | A complete plan | Predict where agents end / the output (Foresight), then watch |
| 2 | **Mend** | A plan with one bug (a Bestiary monster hides in it) | Find and fix the bug |
| 3 | **Complete** | A plan missing 1–3 cards | Fill in the gaps |
| 4 | **Forge** | Empty plan, fixed loadout | Build from scratch |
| 5 | **Choose** | Empty plan, **open armory**, blank Scout Card | Recognize the pattern *and* build |

### 8.2 Difficulty knobs (used by designers and the adaptive system)
- Input size targets (does brute force survive the Horde?)
- Number of concepts combined (window + ledger; BFS + visited set + level counting)
- Scaffolding stage (visual only → code-first)
- Hidden vs visible traits
- Par plan size
- Twist count (bosses add follow-up phases)

### 8.3 Adaptive tuning
If a player fails the same encounter 3 times, Quill offers (never forces) **"Go back one step"**: the same problem at a lower ramp step (e.g. from Forge to Complete). If a player clears a realm's step-4 levels with 3★ on the first try, the game offers to **skip ahead** to *Choose* levels.

---

## 9. Game Modes

| Mode | Description | Interview skill | Session length |
|---|---|---|---|
| **Campaign** | Realm-by-realm encounters, bosses, story | All | 5–30 min |
| **Bug Hunt** | Fix a broken plan; catch the Bestiary monster | Debugging, reading code | 2–5 min |
| **Jester's Gambit** | *You* play the Jester: given a flawed plan, craft the smallest input that breaks it | Edge cases, adversarial thinking | 2–4 min |
| **Oracle's Riddles** | Rapid-fire: "What does this output?", "What's the Big-O?", "Which pattern?" | Speed of recognition | 60 s (mobile-friendly) |
| **Curse of Slowness** | A working but slow plan is cursed; cut its stamina below the target | Optimization | 3–8 min |
| **Bounty Board** | Daily spaced-repetition Remixes of solved patterns | Retention | 5–10 min |
| **Boss Raid** | Multi-phase bosses with interview-style follow-ups (§10) | Handling follow-ups | 15–25 min |
| **Arena** | Async PvP on the same problem; ranked by correctness → stamina → plan size → time | Speed & polish under pressure | 5–10 min |
| **Guild Raid** | Co-op: a design-heavy problem split into roles (§11) | Collaboration, data-structure design | 20–40 min |
| **Council Trial** | Full mock interview (§12) | Everything | 45 min |

---

## 10. Boss Raids: follow-up questions as phases

Real interviewers rarely stop at the first solution: *"Now what if the data is a stream?"*. Bosses turn follow-ups into **phases**. The boss mutates between phases and the player adapts the plan.

**Example: "The Crowned Hydra" (Kth Largest Element)**
| Phase | Boss mutation (follow-up) | Expected adaptation |
|---|---|---|
| 1 | "Find the k-th strongest warrior in this army" | Sort Ritual, take index (O(n log n)) |
| 2 | Hydra regenerates: "The army is huge; k is small" | War Pyramid of size k (O(n log k)) |
| 3 | "Warriors arrive one by one, forever. Answer after each arrival" | Keep the size-k Pyramid as a persistent structure (stream) |
| 4 *(hard mode)* | "Average O(n), no extra memory" | Hoare's Partition Axe (quickselect) |

Each phase is scored separately, and the boss's **remaining heads** show how many follow-ups are left.

---

## 11. Guild Raids (co-op)

Problems that combine data structures become co-op raids where each player owns a component. The roles are the interfaces of the design.

**Example: "The Forgetful Vault" (LRU Cache)**
- **Goblin role:** builds the Ledger (key → node lookup).
- **Dwarf role:** builds the Mine Cart Line as a doubly linked list (move-to-front, evict from back).
- **Captain role:** writes the `get` / `put` orders that call both, plus the Testplate.
- The raid only passes when the components work together. A shared timeline shows all three plans executing as one.

---

## 12. The Council Trial (mock interview)

The endgame mode and the product's north star. It is a 45-minute session that mirrors a real interview loop. **Fantasy is minimal here**: the council chamber is a calm, focused room.

| Stage | Minutes | What happens | Visual support |
|---|---|---|---|
| **Petition** (clarify) | 0–5 | The council member states a problem with deliberate ambiguity. The player asks clarifying questions (typed or voice); points for asking about inputs, edge cases, constraints | None |
| **Strategy** (approach) | 5–12 | The player explains the plan. The AI interviewer probes: "Complexity? Can you do better?" | **Sketch Slate**: a whiteboard-like canvas where the player can drop data structures and agents *without* a Battle Plan, just to illustrate |
| **Inscription** (code) | 12–37 | Write code in a plain editor; no auto-visualization | None (Stage E) |
| **Trial by Example** (test) | 37–42 | The player traces an example by hand, then runs hidden tests | After the run, the canvas visualizes their *typed* code |
| **Verdict** | 42–45 | Scorecard on the 4 axes, a hire-style verdict (*No Hire → Strong Hire*) and a replay | Full replay with Ogre's Shadow chart |

Each council member is an interviewer *persona* (strictness, follow-up style, focus area). Guild Trials (company-style tracks) bundle personas with problem pools.

---

## 13. Screen Layout: the Battle Screen

```
┌───────────────────────────────────────────────────────────────────────────────────┐
│ ⚑ Arraia › Bridge of Planks (2-4)   Traits: 🪜 Sorted Scales  🤝 Seeks a Partner    │
│ ♥ Stamina ▓▓░░░░░░░░░░  4/42    🎒 Weight ▓░░░░ O(1)    ⭐⭐☆   🦆 Quill  ⚙         │
├───────────────────────────────────────────────────┬───────────────────────────────┤
│                                                   │  BATTLE PLAN                  │
│        ~~~~~~~~~~~~ river ~~~~~~~~~~~~            │  ⚑ MUSTER                     │
│   🗡L                                    🗡R      │   place 🗡L at first          │
│   ┌──┐  ┌──┐  ┌──┐  ┌──┐  ┌──┐  ┌──┐  ┌──┐       │   place 🗡R at last           │
│   │ 1│  │ 3│  │ 4│  │ 6│  │ 8│  │11│  │15│       │  ⟳ WHILE 🗡L before 🗡R  ◄──  │
│   └──┘  └──┘  └──┘  └──┘  └──┘  └──┘  └──┘       │   ⟐ IF sum = target           │
│    0     1     2     3     4     5     6          │       ⚔ VICTORY [L,R]         │
│                                                   │   ⟐ OR IF sum < target        │
│   ⚑ target = 14     ⚑ sum = 16  (> target)        │       ➜ advance 🗡L           │
│                                                   │   ⟐ OTHERWISE                 │
│   [ Seer's Eye: Pair Matrix ▢ ]                   │       ⬅ retreat 🗡R  ◄── now  │
├───────────────────────────────────────────────────┼───────────────────────────────┤
│ ⏮ ◀ ▶ ▶| ⏭   speed 1×   |▮▮▮▮▮▮▮▮▮●──────────| round 1 / tick 4                   │
├───────────────────────────────────────────────────┴───────────────────────────────┤
│ ARMORY TRAY: 🗡 advance · retreat · jump │ ≟ compare │ ⚑ banner │ ⚔ victory │ 🛡 guard │
│ SPELLBOOK (Python) ▸ while l < r: s = nums[l] + nums[r] ...      [ Hand Mode ] [CHARGE!]│
└───────────────────────────────────────────────────────────────────────────────────┘
```

**Mobile layout:** the battlefield is on top, the plan is a bottom sheet, and the timeline is a thumb-scrubber. *Oracle's Riddles* and *Bounty Board* are designed for phones; *Forge*-step levels are best on tablet/desktop.

---

## 14. Classic Mode (no fantasy)

Some players, especially working engineers, will find the fantasy layer distracting. **Classic Mode** is a single toggle that re-skins everything without changing any mechanic:

| Fantasy | Classic |
|---|---|
| Twin Daggers | Pointers `l`, `r` |
| Goblin Ledger | HashMap |
| Big-O the Ogre | Complexity warning + growth chart |
| Jester Edgecase | "Adversarial tests" |
| Waves | Test suites |
| Stamina | Operation budget |
| Battle Plan | Visual program |

This is cheap to build because skins sit on top of the same semantic event stream (see [`04` §4](04-pattern-visual-language.md)).
