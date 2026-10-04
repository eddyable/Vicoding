# Vicoding Design Docs

| Doc | What's inside |
|---|---|
| [STATUS.md](STATUS.md) | **Where the project stands and the prioritized next steps** |
| [design/00-big-picture.md](design/00-big-picture.md) | **Start here.** One-screen overview of the player's journey: journey → realm → level → try loop, the daily loop, and how visual help fades |
| [GAME_DESIGN.md](GAME_DESIGN.md) | Original high-level game design: vision, core loop, scaffolding fade, tech overview, MVP, monetization |
| [design/01-world-and-characters.md](design/01-world-and-characters.md) | Lore of Algoria, playable races & Traits, classes (= languages), mentors, villains, factions, world map, Bestiary of Bugs, monster traits (pattern cues) |
| [design/02-gear-and-progression.md](design/02-gear-and-progression.md) | Golden rule of gear, loadout slots, weapons (agents), containers (weight = space), spells, armor (testing/invariants), stats, ranks, economy, Grimoire |
| [design/03-core-mechanics.md](design/03-core-mechanics.md) | Encounter phases, Battle Plan visual language, execution semantics, stamina & the Ogre, waves & the Jester, scoring, difficulty ramp, game modes, bosses, co-op, Council Trial, screen layout, Classic Mode |
| [design/04-pattern-visual-language.md](design/04-pattern-visual-language.md) | Visual signature of 20 patterns, how alternative solutions look different, Seer's Eye proof views, semantic-event rendering |
| [design/05-level-walkthroughs.md](design/05-level-walkthroughs.md) | First 15 minutes, 6 detailed level walkthroughs with traces, a multi-phase realm boss, a Council Trial sample, designer checklist |
| [adr/0001-tech-stack.md](adr/0001-tech-stack.md) | Technology decision: web-first TypeScript (React + SVG boards + PixiJS) with Capacitor for iOS/Android; comparison with board/card game stacks |
| [prd/PRD-v0-vertical-slice.md](prd/PRD-v0-vertical-slice.md) | PRD for the first playable prototype: 5 Arraia levels on web + mobile, hypotheses, requirements, metrics, playtest plan, milestones |
| [mobile.md](mobile.md) | Building and shipping the iOS and Android test builds |
| [playtest.md](playtest.md) | Running the v0 playtest, collecting data, computing the decision metrics |

> Where the world/realm structure in `design/` differs from §7 of `GAME_DESIGN.md`, the `design/` docs take precedence.
