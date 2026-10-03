# 00 · The Big Picture: How a Player Moves Through Vicoding

> Start here. This page is the one-screen overview of the whole game; every other doc in [`design/`](.) zooms into one part of it. See [`../README.md`](../README.md) for the index.

The game is a set of **nested loops**, from a whole campaign down to a single run. Every level of play is one of these loops.

```
╔══════════════════════════════════════════════════════════════════════════╗
║ ① JOURNEY  (weeks–months)        "From Squire to Legend of Algoria"     ║
║                                                                          ║
║   Create hero ─► Arraia ─► Goblins / Dwarves / Gnomes ─► Elves / Orcs   ║
║   (race, class      (arrays)   (hashing, stacks,        (trees, greedy,  ║
║    = language)                  binary search)           heaps)          ║
║                ─► Dark Elves ─► Labyrinth ─► Memoria ─► Tangled Citadel  ║
║                   (graphs)      (backtracking) (DP)     (mock interviews ║
║                                                          + final boss)   ║
║  ┌────────────────────────────────────────────────────────────────────┐  ║
║  │ ② REALM  (1–2 weeks)   one race = one family of patterns           │  ║
║  │                                                                    │  ║
║  │  Mentor intro ─► levels get harder in 5 steps ─► Realm Boss        │  ║
║  │                  Watch → Fix → Complete → Build → Choose           │  ║
║  │                  + side levels: Bug Hunts, Jester's Gambit         │  ║
║  │  Reward: new weapon/armor, faction reputation, that race's power   │  ║
║  │  ┌──────────────────────────────────────────────────────────────┐  │  ║
║  │  │ ③ LEVEL  (3–10 min)   one problem = one monster              │  │  ║
║  │  │                                                              │  │  ║
║  │  │  Scout ─► Arm ─► Plan ─► Forge ─► Battle ─► Spoils           │  │  ║
║  │  │  read     pick    build   write    run &     see your code,  │  │  ║
║  │  │  problem  tools   logic   tests    survive   stars, loot     │  │  ║
║  │  │  ┌────────────────────────────────────────────────────────┐  │  │  ║
║  │  │  │ ④ TRY LOOP  (seconds)                                  │  │  │  ║
║  │  │  │  tweak plan ─► ▶ run ─► watch it animate ─► fail? ─┐   │  │  │  ║
║  │  │  │      ▲                                              │   │  │  │  ║
║  │  │  │      └──── rewind to the exact broken step ◄────────┘   │  │  │  ║
║  │  │  └────────────────────────────────────────────────────────┘  │  │  ║
║  │  └──────────────────────────────────────────────────────────────┘  │  ║
║  └────────────────────────────────────────────────────────────────────┘  ║
╚══════════════════════════════════════════════════════════════════════════╝
```

---

## ① The Journey: what the whole game is about

The story is that the Compiler Crystal was shattered. Each race holds one piece of programming wisdom, and the player is the hero who learns from all of them. In real terms, that means learning every major interview pattern.

- **Start:** pick a race and a class. Race decides the hero's look and first power; class is the coding language (Mage = Python, Paladin = Java). → [`01`](01-world-and-characters.md)
- **Progress:** travel through realms on a world map. Each realm opens only after the realms it builds on are done, so arrays come before hashing and trees come before graphs.
- **Measure:** reputation with each race (how well the player knows that pattern) and the hero rank:

  | Rank | Interview level |
  |---|---|
  | Squire | Easy |
  | Knight | Easy and some Medium |
  | Champion | Medium |
  | Warlord / Archmage | Hard |
  | Legend of Algoria | Ready for a big-tech interview |

  → [`02`](02-gear-and-progression.md)
- **Finish:** in the Tangled Citadel, pass the Council Trials (45-minute AI mock interviews) and beat Gordian, a final boss that mixes every pattern. → [`03` §12](03-core-mechanics.md)

## ② The Realm: one pattern family

Each realm is one chapter, about 10–15 levels on a path.

1. **The mentor** (for example Captain Ada for arrays) introduces the idea and hands over its weapon (for example Twin Daggers, which are two pointers).
2. **Levels ramp up in five steps:**

   | Step | What the player does |
   |---|---|
   | Watch | Watch a finished solution run and predict the result |
   | Fix | Fix a solution with a bug hidden in it |
   | Complete | Fill in the missing pieces |
   | Build | Build a solution from scratch with given tools |
   | Choose | Pick the right tools from the full armory, which is the real interview skill |

3. **Optional side levels** sit along the path:
   - Bug Hunts: catch the bug in someone else's solution.
   - Jester's Gambit: design the input that breaks a solution.
4. **The Realm Boss** is a hard problem with several phases. Each phase is an interview follow-up, such as "now the input is a stream."
5. **Rewards:** a new weapon and armor, rare variants, faction reputation, and that race's special view, which the player keeps for good.

## ③ The Level: one problem

| Phase | What the player does | What they really learn |
|---|---|---|
| **Scout** | Read the monster's story; its traits hint at the pattern ("sorted" points to two pointers). Can solve a small example by hand | Recognizing the pattern |
| **Arm** | Choose weapons and containers | Choosing the approach and data structures |
| **Plan** | Snap cards together into a battle plan | Designing the algorithm |
| **Forge** | Add their own test cases and rules that must always hold | Testing and checking correctness |
| **Battle** | Run it and watch it animate. Hidden tests arrive as waves: examples → edge cases → huge inputs → the Jester's custom attack | Debugging, edge cases, complexity |
| **Spoils** | See **their solution as real code**, earn stars and loot, answer one "why" question | Turning visuals into code, analysis |

Stars: ★ the solution works · ★★ it's fast enough (Big-O the Ogre never shows up) · ★★★ it uses little memory and is compact.

→ Full rules in [`03`](03-core-mechanics.md); worked examples in [`05`](05-level-walkthroughs.md).

## ④ The Try Loop: the moment-to-moment fun

Tweak the plan, press ▶, and watch the pointers move. If it fails, the game rewinds to the exact step where it went wrong and shows the smallest input that breaks it. There are **no lives and no game over**. Failing is fast and shows the player something, which keeps them experimenting.

How each pattern looks while it runs: [`04`](04-pattern-visual-language.md).

---

## Alongside it: the daily loop (habit and retention)

```
Open app ─► Bounty Board (1–2 review levels of old patterns, retold with new stories)
         ─► continue the campaign (1–3 levels)
         ─► optional: Oracle quick quiz (60 s) / Arena / weekly mock interview
         ─► streak + reputation updated
```

Patterns the player hasn't practiced slowly lose reputation, and a review level brings it back. That is spaced repetition with a story reason.

## Over time, the visual help fades

| Stage | How the player solves problems |
|---|---|
| Early realms | Cards only; the code is revealed on victory |
| Middle realms | Build with cards while the code updates live beside them |
| Later realms | Edit either the cards or the code, and the other side updates |
| Late game | Type code; the visuals are only the debugger |
| Council Trial | Plain editor and a sketch board, like a real interview |

---

## In one sentence

> The player travels through race realms, each one a pattern family; every level is a monster they beat by building a visual algorithm and watching it run; the game slowly turns their pictures into real code, until they can pass a full mock interview without the visuals.
