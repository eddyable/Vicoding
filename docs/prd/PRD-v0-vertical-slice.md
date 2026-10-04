# PRD · Vicoding v0 "Vertical Slice" Prototype

| | |
|---|---|
| **Status** | Approved (2026-10-03) |
| **Owner** | Product (Vicoding) |
| **Date** | 2026-10-03 |
| **Platforms** | Web (desktop + mobile browsers), iOS and Android (Capacitor test builds) |
| **Related** | [Big picture](../design/00-big-picture.md) · [Core mechanics](../design/03-core-mechanics.md) · [Tech stack ADR](../adr/0001-tech-stack.md) |

---

## 1. Summary

Build a small, playable slice of Vicoding (**5 levels from the first realm, Arraia**) to test the core idea before investing in the full game: *players learn interview patterns by building algorithms visually, watching them run, and then seeing the real code.*

The slice deliberately leaves out races, gear, story and accounts. It contains only the **core loop**: read a problem, build a plan from cards, run it on an animated board, rewind to fix it, pass hidden tests, and see the code.

## 2. Problem

People preparing for coding interviews struggle to move from "I know the syntax" to "I can solve a Medium problem." Existing practice sites (LeetCode, HackerRank) give a blank editor and a pass/fail result. They don't show *why* an approach works, *where* it breaks, or *how* an algorithm behaves as the input grows. Many learners, especially visual learners and career switchers, give up.

## 3. Target users (for this prototype)

| Persona | Description | Why them first |
|---|---|---|
| **Primary: the interview preparer** | CS student, bootcamp graduate or junior engineer; knows basic Python or JavaScript; preparing for interviews within 1–6 months | Highest motivation, clearest success measure (can they solve the problem afterwards?) |
| Secondary: the career switcher | Has done a beginner course; intimidated by algorithm problems | Tests whether the visuals lower the entry barrier |

Not targeted yet: total beginners who can't read code, and senior engineers.

## 4. Hypotheses to test

| # | Hypothesis | How we test it |
|---|---|---|
| **H1 Fun** | Building a plan from cards and watching it run is engaging, not clunky | Completion rate, session time, "would keep playing" survey, observed frustration in sessions |
| **H2 Transfer** | After the slice, players can write the two-pointer pattern in plain code on a new problem | A code-only transfer test after the slice and again 24 h later |
| **H3 Understanding** | Visual runs (rewind, step-by-step, the Ogre) help players understand *why* a solution works and why brute force is too slow | War Council answers; think-aloud comments in sessions |
| **H4 Mobile** | The loop works on a phone, at least for watching, fixing and simple building | Completion and error rates by device; mobile-specific session notes |

## 5. Goals and non-goals

**Goals**
- A complete, polished core loop on 5 levels, playable on web and phones.
- Enough measurement to decide go / adjust / stop on H1–H4.

**Non-goals (explicitly out of scope for v0)**
- Races, classes, gear, loot, economy, reputation, story beyond one mentor's lines
- Accounts, backend, leaderboards, social features
- AI hints, Quill explanations, Council Trials (mock interviews)
- Realms beyond Arraia; patterns beyond iteration and two pointers
- Two-way editing (code ↔ cards); code is shown read-only
- Languages other than Python and JavaScript in the code reveal
- App-store public release (internal test builds only)

## 6. The slice: content

All levels are in Arraia with mentor **Captain Ada**. They follow the five-step difficulty ramp (Watch → Fix → Complete → Build → Choose).

| # | Level | Source problem (adapted) | Ramp step | Teaches | Target |
|---|---|---|---|---|---|
| 1 | **The Tallest Scroll** | Find the maximum | Hand Mode → Build | Iteration, variables; "your moves became a program" | O(n) |
| 2 | **Mirror Twins** | Reverse a string/array | Watch (predict the meeting point) | Two pointers converging, swap | O(n), O(1) space |
| 3 | **The Imp on the Bridge** | Reverse, with an off-by-one bug | Fix | Bounds, debugging by stepping/rewinding | n/a |
| 4 | **The Bridge of Planks** | Two Sum II (sorted input) | Build | Converging two pointers; brute force vs linear (Ogre) | O(n), O(1) space |
| 5 | **Clearing the Road** | Move Zeroes | Build (minimal hints) | Same-direction two pointers (read/write) | O(n), O(1) space |

**Transfer test (after level 5):** **Valid Palindrome** in a plain code editor (Python or JavaScript), with no cards and no board. It is offered right after the slice and again by link 24 hours later.

Each level is defined as data (JSON) per the level format in [`03`](../design/03-core-mechanics.md) and the designer checklist in [`05` §9](../design/05-level-walkthroughs.md).

## 7. User experience flow

```
Landing (web link / app icon)
  → 30-second intro: "Build it. Watch it run. Read the code."
  → Level map (5 nodes, linear)
     → Level: Scout card → Plan editor + board → Run / step / rewind
             → Charge (hidden test waves) → Victory screen (stars, code reveal, 1 "why" question)
  → After level 5: transfer test (plain code) → short survey
  → 24 h later: reminder (email on web if given, push on mobile) → transfer test #2
```

## 8. Functional requirements

### 8.1 Level flow
| ID | Requirement | Priority |
|---|---|---|
| FR-1 | Level map showing 5 levels with lock/unlock and earned stars | Must |
| FR-2 | Scout card: story text, example input(s), expected output, highlighted keywords | Must |
| FR-3 | **Hand Mode** (level 1): the player drags a pointer and sets a "best" banner by hand; their moves are recorded and offered as a draft plan | Must |
| FR-4 | Example inputs are editable (change values, randomize) | Should |

### 8.2 Plan editor (cards)
| ID | Requirement | Priority |
|---|---|---|
| FR-10 | Plan skeleton: **Setup**, **Loop** (while ⟨condition⟩ / for each tile), **After loop** | Must |
| FR-11 | Blocks: if / else if / else; move pointer (advance, retreat, jump); swap tiles; compare (=, ≠, <, ≤, >, ≥); arithmetic (+, −); value at pointer; variable set / record max; return | Must |
| FR-12 | Only blocks for the level's allowed tools appear in the tray | Must |
| FR-13 | Desktop: drag and drop. **Phone: tap a block, then tap a slot** (tap-to-place) | Must |
| FR-14 | Plans cannot be syntactically invalid (empty slots are highlighted before running) | Must |
| FR-15 | Undo / redo in the editor | Should |

### 8.3 Running and debugging
| ID | Requirement | Priority |
|---|---|---|
| FR-20 | Deterministic interpreter: one primitive operation = one step, recorded in an event log | Must |
| FR-21 | Animated board: tiles, pointers with footprints, variables as labels, comparisons highlighted | Must |
| FR-22 | Timeline controls: play, pause, step forward/back, scrub, speed (½×, 1×, 2×, instant) | Must |
| FR-23 | Currently executing card highlighted in sync with the board | Must |
| FR-24 | Operation counter + stamina bar against the level's budget | Must |
| FR-25 | Safety limits: infinite-loop and step caps end the run with a clear explanation | Must |
| FR-26 | Off-by-one detection: reading outside the array stops the run, shows the "imp" on the void tile and explains | Must |
| FR-27 | Breakpoints on a card | Could |

### 8.4 Hidden tests ("waves") and feedback
| ID | Requirement | Priority |
|---|---|---|
| FR-30 | **Charge** runs 3 waves: examples → edge cases (empty, single, duplicates, negatives, no answer) → large input (n ≈ 10⁵) | Must |
| FR-31 | Large input runs without animation; result shown via stamina bar and the **Ogre** (size proportional to operations / budget) | Must |
| FR-32 | On failure: show the smallest failing input and **rewind the board to the exact step where the output diverged** from the reference solution | Must |
| FR-33 | Simple random testing against the reference solution to find counterexamples, with shrinking to a minimal input | Should |
| FR-34 | Growth chart: your operation count vs n compared with n and n² curves | Should |

### 8.5 Victory and code
| ID | Requirement | Priority |
|---|---|---|
| FR-40 | Stars: ★ correct, ★★ within time budget, ★★★ within space target and ≤ par block count | Must |
| FR-41 | **Code reveal**: the player's plan shown as Python and JavaScript, each line linked to its card (tap a line → card highlights) | Must |
| FR-42 | One "War Council" multiple-choice question per level (e.g. complexity, "what if the input weren't sorted?") | Must |
| FR-43 | Option to replay the level or try for more stars | Must |

### 8.6 Transfer test
| ID | Requirement | Priority |
|---|---|---|
| FR-50 | Plain code editor (CodeMirror 6), Python (JavaScript deferred, see §14) | Must |
| FR-51 | Run against hidden tests: Python via Pyodide, lazy-loaded on this screen only | Must |
| FR-52 | 15-minute soft limit, then a "show solution" option | Must |
| FR-53 | 24-hour follow-up via a unique link (web) or local notification (mobile) | Should |

### 8.7 Platform and persistence
| ID | Requirement | Priority |
|---|---|---|
| FR-60 | Responsive layout: desktop (side-by-side board and plan), phone (board on top, plan as a bottom sheet) | Must |
| FR-61 | Progress saved locally (browser storage / device storage) | Must |
| FR-62 | Capacitor builds: iOS TestFlight and Android internal testing | Must |
| FR-63 | Works offline after first load (except Pyodide's first download) | Should |
| FR-64 | Anonymous analytics events (§10) with consent | Must |

## 9. Non-functional requirements

| Area | Requirement |
|---|---|
| Performance | Smooth animation on a mid-range phone from ~3 years ago (target 60 fps, never below 30). First load < 3 s on 4G; initial bundle < 2 MB excluding Pyodide |
| Accessibility | Full keyboard control on desktop; text log of every step ("Step 4: L moves 1 → 2, sum 18 > 9"); colour-blind-safe palette; minimum touch target 44 px |
| Reliability | The interpreter is deterministic; every reference solution and level is covered by automated tests |
| Privacy | No accounts; analytics anonymous with an install ID; no personal data beyond an optional email for the follow-up |
| Browsers / OS | Latest 2 versions of Chrome, Safari, Firefox, Edge; iOS 16+; Android 10+ |

## 10. Success metrics and analytics

**Decision metrics (from the playtest cohort):**
| Metric | Target | Hypothesis |
|---|---|---|
| Slice completion rate (all 5 levels) | ≥ 70% | H1 |
| "Would you keep playing?" (≥ 4 on a 5-point scale) | ≥ 60% of testers | H1 |
| Transfer test pass rate, immediately after the slice | ≥ 60% | H2 |
| Transfer test pass rate, 24 h later | ≥ 50% | H2 |
| War Council questions correct | ≥ 70% | H3 |
| Level 4 attempts that switch from brute force to two pointers after seeing the Ogre | ≥ 50% of those who tried brute force | H3 |
| Phone completion rate within 15 percentage points of desktop | Yes / No | H4 |

**Analytics events:** `level_start`, `plan_run` (block count, result), `step_back_used`, `charge` (wave reached, pass/fail), `ogre_shown`, `counterexample_shown`, `level_complete` (stars, time, runs), `code_reveal_line_tapped`, `war_council_answer`, `transfer_test_submit` (pass, time, language), `survey_submit`, plus device type on every event.

## 11. Playtest plan
- **10–15 testers** from the primary persona (university CS clubs, bootcamps, interview-prep communities); at least 5 on phones.
- **6 moderated sessions** (think-aloud, recorded with consent), the rest unmoderated via a link.
- Survey after the slice: fun, clarity, frustration points, comparison with LeetCode, willingness to pay (indicative only).
- Synthesis document with go / adjust / stop recommendation for each hypothesis.

## 12. Milestones

| Week | Deliverable |
|---|---|
| 1 | Monorepo, engine (plan language, interpreter, event log) with unit tests; levels 1–2 as data |
| 2 | Board rendering + timeline; plan editor (desktop drag and drop); levels 1–3 playable on web |
| 3 | Waves, counterexamples, Ogre, stars, code reveal; levels 4–5; phone layout + tap-to-place |
| 4 | Transfer test (Pyodide), analytics, Capacitor iOS/Android builds, polish, bug bash |
| 5 | Playtests and synthesis |

### Implementation status (end of week 4)

All **Must** requirements are implemented except part of **FR-62**: the native iOS and Android projects exist, but the signed TestFlight and Play builds still have to be produced on a Mac and with Android Studio ([mobile.md](../mobile.md)).

These **Should** items are also done: FR-4, FR-15, FR-33 (fuzzing with shrinking), FR-34 (growth chart), FR-53 (follow-up link and native reminder) and FR-63 (offline). Not built: FR-27 (breakpoints, a *Could*).

See [playtest.md](../playtest.md) for running week 5.

## 13. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Card editor feels slower than typing for players who already code | H1 fails for the main persona | Keep the block set tiny; fast keyboard shortcuts on desktop; measure time-per-level against the transfer test |
| Players learn the game, not the pattern | H2 fails | The transfer test is mandatory in the playtest; code reveal links lines to cards |
| Phone editing too fiddly | H4 fails | Tap-to-place; levels 2–3 (watch, fix) are naturally phone-friendly; accept "build on tablet/desktop" if needed |
| Scope creep into the fantasy layer | Delays the test | Non-goals list (§5) is binding for v0 |
| App-store review delays | Mobile testers blocked | Use TestFlight / internal testing only; the web link works on phones as a fallback |

## 14. Decisions and open questions

**Decided (proposed defaults adopted at approval; can be revisited):**
1. Transfer test: **Python only** for v0; JavaScript later.
2. Code panel: shown **only on victory** in levels 1–4, **live while building** in level 5 to test the transition.
3. Art direction: **plain geometric style + one Captain Ada portrait**.

**Still open:**
4. Recruiting channel and incentive for testers (gift cards, early access).
