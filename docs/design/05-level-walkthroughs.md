# 05 · Level Walkthroughs: the Experience Beat by Beat

> Part of the Vicoding design set. See [`../README.md`](../README.md) for the index.

These walkthroughs describe what the player **sees, does and feels** moment to moment. They are the reference for level designers, artists and engineers. All traces have been checked by hand against the real algorithms.

---

## 0. The First 15 Minutes (onboarding)

| Minute | Beat |
|---|---|
| 0:00 | Cold open: the Compiler Crystal shatters; Gordian's coils sweep across the map. Bugs crawl out of the cracks. **10 seconds of story, skippable.** |
| 0:20 | Hero creation: race (one screen, each race does a 3-second animation of its Trait), class (= language: *"Which spell language will you learn? You can change this anytime."*), name. Under 90 seconds. |
| 2:00 | **Arraia gate.** Captain Ada: *"A Bug is loose in the archive. Find the tallest scroll before it eats them."* Level 1-1 is **Find the Maximum** in **Hand Mode**: the player drags a soldier tile by tile and plants a "best" banner. No blocks yet. |
| 4:00 | Ada: *"Good. Now teach your soldier to do it without you."* The player's hand moves are recorded into a draft Battle Plan (*"For each tile → if tile > best → set best"*). Press ▶. The soldier repeats it alone. **The first "I programmed something" moment.** |
| 5:30 | Victory → **first Spell Scroll**: the Python/JS/Java code of exactly what they built, with each line linked to a card. *"This is what you just wrote."* |
| 6:30 | Level 1-2 (*Witness*): **Reverse a String** with two soldiers swapping from the ends; the player predicts the middle meeting point (Amulet of Foresight intro). |
| 9:00 | Level 1-3 (*Mend*): the **Off-by-One Imp** hides in a plan that starts `R` at `n` instead of `n − 1`, so the first swap reads a tile that doesn't exist. The imp is caught → first Bestiary entry. |
| 12:00 | **Big-O the Ogre's cameo**: a deliberately slow plan for 1-4. Ada: *"Never let him grow."* Introduces the stamina bar. |
| 15:00 | World map opens with the first realm branch visible. The Unity Meter is shown at 0/7. The daily Bounty Board unlocks tomorrow (a retention hook). |

**Success criteria:** within 15 minutes, the player has (1) solved by hand, (2) automated a solution, (3) seen their code, (4) caught a bug, and (5) felt complexity.

---

## 1. "The Bridge of Planks": Two Pointers (Arraia, Level 2-4, *Forge* step)

**Source problem:** adapted from *Two Sum II — Input Array Is Sorted*.

**① Scout.** Story: *"The bridge is broken. Two planks must together span exactly 14 paces. The planks are laid out shortest to longest."*
Scout Card traits: 🪜 **Sorted Scales**, 🤝 **Seeks a Partner** (highlighted words: "shortest to longest", "two planks", "together").
Vision: `planks = [1, 3, 4, 6, 8, 11, 15]`, `target = 14`. In Hand Mode the player usually tries pairs randomly. Quill asks: *"If two planks are too long together, which one would you swap for a shorter one?"*

**② Arm.** Preset loadout: **Twin Daggers**, banners. (The Ledger is greyed out for this level so the lesson stays focused.)

**③ Plan.** A typical first attempt is Grukk-style nested rounds. When pressed ▶ on the Vision it *wins*, but the stamina bar is suspiciously long. The player rebuilds with converging blades:

```
MUSTER: L at first, R at last
WHILE L before R:
  IF  value@L + value@R = target → VICTORY [L, R]
  OR IF  sum < target            → advance L
  OTHERWISE                      → retreat R
```

**⑤ Battle trace (the exact animation):**
| Round | L (value) | R (value) | Sum | Visual |
|---|---|---|---|---|
| 1 | 0 (1) | 6 (15) | 16 > 14 | Amber flash on both; R steps left; plank 15 greys out (*"too long for anyone"*) |
| 2 | 0 (1) | 5 (11) | 12 < 14 | L steps right; plank 1 greys out (*"too short for anyone"*) |
| 3 | 1 (3) | 5 (11) | 14 ✔ | Both planks glow green, rise and **form the bridge**; the hero crosses |

**Seer's Eye moment:** with the Pair Matrix on, rounds 1–2 grey out a whole column, then a whole row. Ada: *"Every step throws away a row or a column that can't hold the answer. That's why you never miss it."*

**Waves.** Skirmishers: `[2,2]` target 4 (the pair is two equal planks), `[-5, -1, 0, 3]` target −6. The Horde: n = 100,000, where the nested-loop plan triggers the Ogre and the converging plan uses ~n ticks. Jester's Gambit: answer at the extreme ends (`[1, …, 99]` with target 100), which catches plans that start `R` at `n−2`.

**⑥ Spoils.** Spell Scroll (Python):
```python
def bridge(planks, target):
    l, r = 0, len(planks) - 1
    while l < r:
        s = planks[l] + planks[r]
        if s == target:
            return [l, r]
        if s < target:
            l += 1
        else:
            r -= 1
    return None
```
3★ (Victory, Swift, Masterful: O(1) weight, 5 cards ≤ par 6). Loot: *Merging Gauntlets* blueprint (next variant). War Council: *"Would this work if the planks weren't sorted?"* (No. Discarding a row or column relies on the order.)

---

## 2. "The Goblin Caravan": Sliding Window (Hashmire, Level 4-3)

**Source problem:** adapted from *Longest Substring Without Repeating Characters*.

**① Scout.** Nib: *"My caravan may carry each kind of good only once — taxes, you see. What's the longest stretch of the street I can carry in one go?"* Street: `a b c a b c b b`. Traits: 🐛 **Contiguous Body**.

**② Arm.** **Caravan Whip** + **Goblin Pouch** (set).

**③ Plan (set version):**
```
MUSTER: L at first; best = 0; pouch empty
FOR EACH stall with R:
  WHILE pouch has value@R:      ← rear wagon catches up
     remove value@L from pouch; advance L
  add value@R to pouch
  record best = max(best, R − L + 1)
VICTORY best
```

**⑤ Battle highlights:** the caravan's belly shows the letters inside. At R = 3 (`a`), the pouch already has `a`, so it **glows red**. The rear wagon pulls forward one stall, dropping `a`; the belly is green again. The caravan inches along the whole street; the best-banner stops at **3** (`abc`).

**④/⑤ The Jester's signature attack (on the advanced "last-seen ledger" variant).** Players who upgrade to the *Counting Whip* (store each letter's last index, jump L directly) often write `L = last[c] + 1`. The Jester throws **`"abba"`**:
| R | char | Buggy L | Correct L = max(L, last[c]+1) |
|---|---|---|---|
| 0 | a | 0 | 0 |
| 1 | b | 0 | 0 |
| 2 | b | 2 | 2 |
| 3 | a | **1** ← rear wagon drives **backwards** | 2 |

The buggy plan reports 3 (`"bba"`, which has a repeat). The correct answer is 2. On screen, the rear wagon visibly **reverses** into the street, which caravans can't do, and the Jester honks a horn. With the *Helm of Invariants* invariant "L never decreases", the helm cracks at R = 3. The lesson becomes a Bestiary card: *Stale Ghost: an old last-seen index from outside the window*.

---

## 3. "The Shield Wall of Khaz-Stack": Monotonic Stack (Khaz-Stack, Level 5-6)

**Source problem:** adapted from *Daily Temperatures*.

**① Scout.** Thrain: *"Each dwarf in the line wants to know how many places back the next taller dwarf stands."* Heights: `[73, 74, 75, 71, 69, 72, 76, 73]`. Traits: 🏔️ **Looks Ahead**.

**Grukk's Way first** (a *Witness* intro): for each dwarf, a scout runs forward to find someone taller. The overlapping scout trails cover the screen; Thrain grumbles.

**③ Plan:**
```
MUSTER: answers all 0; shield wall (stack) empty
FOR EACH dwarf with i:
  WHILE wall not empty AND height@i > height@(top of wall):
     j = pop wall;  answers[j] = i − j          ← knocked out, gets a scroll
  push i onto wall
VICTORY answers
```

**⑤ Battle trace:**
| i | height | Knock-outs (answers written) | Wall after (heights) |
|---|---|---|---|
| 0 | 73 | n/a | [73] |
| 1 | 74 | 73 → 1 | [74] |
| 2 | 75 | 74 → 1 | [75] |
| 3 | 71 | n/a | [75, 71] |
| 4 | 69 | n/a | [75, 71, 69] |
| 5 | 72 | 69 → 1, 71 → 2 | [75, 72] |
| 6 | 76 | 72 → 1, 75 → 4 | [76] |
| 7 | 73 | n/a | [76, 73] |

Result `[1, 1, 4, 2, 1, 1, 0, 0]`. The cascade at i = 6 (two knock-outs in a row, scrolls flying) is the signature moment. The tally-mark overlay shows each dwarf entered once and left at most once → O(n).

**Jester:** strictly decreasing heights `[90, 80, 70, …]` (nobody is ever knocked out, so all answers are 0 and the wall holds everyone; tests the default value). Equal heights `[70, 70]` (the `>` vs `≥` bug: an equal dwarf is *not* taller).

---

## 4. "Koko's Clockwork Feast": Binary Search on the Answer (Gnomeria, Level 6-7)

**Source problem:** adapted from *Koko Eating Bananas*.

**① Scout.** Tinkerbit's clockwork monkey must eat banana piles `[3, 6, 7, 11]` within `h = 8` hours, eating at most one pile per hour at speed `k`. What is the slowest speed that finishes in time? Traits: ⚖️ **Hidden Threshold** (hidden mid-game: the player must click "slowest speed … such that" to reveal it).

**The twist:** there is no sorted array to search. Tinkerbit rolls out a **dial of speeds 1…11**. *"The array you search is the answer itself!"*

**③ Plan:**
```
MUSTER: lo = 1, hi = max pile
WHILE lo < hi:
  mid = (lo + hi) // 2
  IF  canFinish(mid)  → hi = mid        (Tactic: simulate the monkey)
  OTHERWISE           → lo = mid + 1
VICTORY lo
```
`canFinish(k)` is a **Tactic** (helper) card: the monkey eats each pile at speed k, hours = Σ ⌈pile / k⌉.

**⑤ Battle trace:**
| Strike | lo | hi | mid | Hours at mid | Predicate | Dial result |
|---|---|---|---|---|---|---|
| 1 | 1 | 11 | 6 | 1+1+2+2 = 6 ≤ 8 | T | Right half (7–11) crumbles |
| 2 | 1 | 6 | 3 | 1+2+3+4 = 10 > 8 | F | Left half (1–3) crumbles |
| 3 | 4 | 6 | 5 | 1+2+2+3 = 8 ≤ 8 | T | 6 crumbles |
| 4 | 4 | 5 | 4 | 1+2+2+3 = 8 ≤ 8 | T | 5 crumbles → **k = 4** |

During each strike a tiny clockwork monkey runs the simulation in a picture-in-picture bubble. **Predicate Strip** for speeds 1–11: `F F F T T T T T T T T`. Tinkerbit: *"See? Find the first T. Every binary search you'll ever write is this strip."*

**Jester attacks:** `lo = mid` (instead of `mid + 1`) → **Ouroboros**: with lo = 4, hi = 5, mid = 4 the clamps freeze forever and the serpent coils the timeline. A single pile `[1_000_000_000]` with h = 2 → Paladins/Artificers meet the **Overflow Golem** if they sum hours in 32-bit integers.

---

## 5. "The Nightshade Bloom": Multi-source BFS (Underdark Web, Level 9-5)

**Source problem:** adapted from *Rotting Oranges*.

**① Scout.** Vex'ra: *"Nightshade spreads from every cursed chamber to its neighbors each minute. How long until every living chamber is cursed — or will some survive forever?"*
```
2 1 1
1 1 0
0 1 1
```
(2 = cursed, 1 = living, 0 = empty rock). Traits: 🌊 **Spreads in Waves**.

**② Arm.** **Many-Wicked Lantern** + **Mine Cart Line** (queue) + the minutes banner.

**⑤ Battle:** light rings expand once per minute. The queue rail at the bottom shows the carts (chambers) of the current ring, separated by a **minute marker cart**.
| Minute | Newly cursed |
|---|---|
| 1 | (0,1), (1,0) |
| 2 | (0,2), (1,1) |
| 3 | (2,1) |
| 4 | (2,2) |
Answer **4**. The rings visibly radiate outward from the top-left like a bruise.

**Waves & Jester:**
- Unreachable survivor `[[2,1,1],[0,1,1],[1,0,1]]` → the answer must be **−1**. The bottom-left chamber stays green and *pulses* while the plan prints 4; Web-Sense shows that no web strand reaches it.
- No living chambers `[[0,2]]` → 0 (catches plans that return −1 or 1).
- Forgot the visited mark → chambers are re-cursed, the queue overflows and Web-Sense shows duplicate carts.

**Duel follow-up (optional):** the same cave is replayed with the Grappling Rope (DFS). The rope dives deep and reports "minute 6" for a chamber that is really 2 minutes away. Vex'ra: *"Depth is not distance."*

---

## 6. "Grukk's Betrayal & the Hydra of Coins": Greedy → DP (Warlands → Memoria transition)

This is a **story-critical level**: the moment Grukk's way fails and the player is sent to Memoria.

**Source problem:** adapted from *Coin Change* (minimum coins).

**Part A: the Warlands.** Grukk must pay a toll of **6** using coins `[1, 3, 4]`, as few coins as possible. Grukk's Charge (greedy: take the biggest coin that fits) → **4, 1, 1 = 3 coins**. The plan wins on the visible Vision (`[1,5,10]`, amount 12 → 10+1+1 = 3, correct). Then the Jester opens the **Greedy Trap Mimic** chest: `amount 6 → 3 + 3 = 2 coins`. Grukk is devastated. *"Grukk… was wrong? Grukk need… to remember."* A ghostly librarian appears: **Memoria**.

**Part B: Act I, the Hydra.** In the Halls of Memoria, `minCoins(6)` is a Hydra. Each head spawns three heads (one per coin): `minCoins(5)`, `minCoins(3)`, `minCoins(2)`. Heads of the same amount share a color, and the player sees **many orange "2" heads and red "1" heads**. Far Sight (or Stonecount) shows the tick count exploding as the amount grows to 30: the Ogre.

**Act II, the Memory Crystal.** The player adds `consult Crystal` at the start of the Clone plan and `inscribe` before returning. Now the first orange "2" head is defeated and inscribed, and every other orange head **turns to stone** instantly. The Hydra shrinks to a thin vine of 7 distinct heads (amounts 0–6).

**Act III, the Archive Shelf.** "Flatten the vine": a shelf of scrolls `dp[0..6]`, filled in a left-to-right wave with dependency arrows back by 1, 3 and 4:
| amount | 0 | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|---|
| dp | 0 | 1 | 2 | 1 | 1 | 2 | **2** |
`dp[6] = min(dp[5], dp[3], dp[2]) + 1 = min(2, 1, 2) + 1 = 2`. The arrow from 6 → 3 glows gold, and following it back shows the coins: 3 + 3.

**Jester:** `amount 0` → 0 (base case); `coins [2], amount 3` → −1 (the unreachable sentinel; plans that use ∞ and forget to convert it print a huge number, and the Null Wraith appears).

**Story payoff:** Grukk joins Memoria's halls as a student. From now on he says: *"Grukk try ALL… but Grukk REMEMBER."* Brute force plus memory is DP.

---

## 7. Realm Boss: "Vex'ra's Labyrinth of Words" (Underdark Boss, multi-phase)

**Source problem:** adapted from *Word Ladder* (Hard), with follow-up phases.

| Phase | Boss says | Player must | Visual |
|---|---|---|---|
| 1 | "Turn *hit* into *cog*, one letter at a time, every step a real word. How many steps?" | Model words as chambers and one-letter changes as web strands; run BFS | The web is built on the fly: each word sprouts strands to its neighbors; lantern rings count steps |
| 2 | "My dictionary has 5,000 words. Your strand-building is too slow." | Optimize neighbor generation with wildcard buckets (`h*t`, `*it` → Goblin Ledger) | The Ogre appears on phase-1 plans; the wildcard Ledger makes strands appear in bursts |
| 3 | "Now show me *one* shortest path, not just its length." | Keep parent links during BFS; trace back | A golden thread is pulled back from *cog* to *hit* |
| 4 *(Heroic)* | "Light from both ends." | Bidirectional BFS | Two lanterns from opposite sides; the rings meet in the middle |

The boss's 4 heads (one per phase) hang on the wall as trophies. Defeating it **without hints** grants **Honored** with the Dark Elves (→ the Web-Sense Trait for all races).

---

## 8. Council Trial: a sample (abridged)

*Council member: Lady Arboriel (focus: trees, communication). Problem: "Given a binary tree, return the values visible from its right side."*

| Stage | Player | Arboriel (AI) | Scoring signal |
|---|---|---|---|
| Petition | "Can the tree be empty? Are node values unique? Is it a BST?" | "It can be empty. Values may repeat. Not necessarily a BST." | +Clarification (asked about empty input and assumptions) |
| Strategy | Drops a tree on the Sketch Slate and draws level rings: "BFS by level, take the last node of each level. O(n) time, O(width) space." | "Could you do it with DFS?" | +Approach, +Complexity |
| Strategy | "Yes, DFS visiting right first, recording the first node seen at each new depth." | "Which would you choose and why?" | +Trade-off discussion |
| Inscription | Writes BFS in Python; forgets the empty-tree guard | (silent) | n/a |
| Trial by Example | Traces a 5-node tree aloud; then runs the tests; the empty tree fails. The canvas replays the *typed* code: the lantern tries to light a `None` root and the Null Wraith appears | "What happened there?" | −Testing, +Debugging (fixed within 1 minute) |
| Verdict | n/a | **Hire.** Strong communication and approach; reminder to test empty inputs first | Scorecard + Grimoire entry |

---

## 9. Designer Checklist for every new level

- [ ] Source problem adapted with an original story; **no copied text**.
- [ ] Traits defined, with the words in the story that justify each one.
- [ ] Target time/space, stamina formula, par cards.
- [ ] At least one Vision that can be solved in Hand Mode in under 1 minute.
- [ ] Skirmisher categories listed (from the edge-case list in [`02` §5](02-gear-and-progression.md)).
- [ ] At least one **signature Jester attack** with a shrunken counterexample and a Bestiary link.
- [ ] Grukk's Way (brute force) behavior specified: it must pass Vanguard and fail the Horde.
- [ ] Seer's Eye overlay specified (or explicitly "none").
- [ ] War Council question.
- [ ] Spell Scroll reference solution in all class languages.
- [ ] Remix variants (≥ 3 re-skins with different stories/inputs) for the Bounty Board.
