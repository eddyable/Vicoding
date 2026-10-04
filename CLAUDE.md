# Vicoding: guide for Claude Code sessions

A game that teaches coding-interview patterns: players build algorithms from cards, watch them run on an animated board, and see the code they wrote. A prototype of the first realm ("Arraia", 5 levels plus a plain-Python Final Trial) is built and ready for playtesting.

**Start here:** read [`docs/STATUS.md`](docs/STATUS.md) for where the project stands and the prioritized next steps. When the user asks "what's next?", answer from that file.

## Map of the repo

| Path | What it is |
|---|---|
| `packages/engine` | Card language (AST), interpreter (1 primitive op = 1 tick, emits semantic events), replay/scrubbing, validation, immutable plan editing, timeline beats. Pure TypeScript, no UI. |
| `packages/levels` | Level definitions (`src/arraia/*.ts`), reference solutions, `charge()` scoring (waves, Horde, stars), the Jester's fuzzing and shrinking, `findDivergence()`, the Final Trial (`src/trials/`). |
| `packages/codegen` | Plan → readable Python / JavaScript, each line linked to its card. |
| `apps/web` | Vite + React app: map, level screen (board, timeline, card editor, charge panel, growth chart, hand mode), Final Trial (Pyodide in a Web Worker), survey, consent + analytics, PWA. |
| `apps/mobile` | Capacitor iOS/Android projects wrapping the web build. |
| `tools/analyze-playtest.ts` | Computes the PRD decision metrics from exported events. |
| `docs/` | Design docs (`design/00-big-picture.md` first), PRD, ADR, mobile and playtest guides. |

## Commands

```bash
pnpm install
pnpm dev                          # web app at http://localhost:5173
pnpm test                         # Vitest: all packages + web unit tests
pnpm typecheck                    # strict TS for packages and the web app
pnpm build                        # production web build (apps/web/dist)
pnpm --filter @vicoding/web e2e   # Playwright, desktop + phone (builds and serves on :4173 itself)
node tools/analyze-playtest.ts <exports>   # playtest metrics
```

Before committing: `pnpm typecheck && pnpm test`, plus the e2e suite for UI changes.

## Conventions

- TypeScript strict everywhere; imports use explicit `.ts`/`.tsx` extensions; packages export `src/index.ts` directly (no build step).
- The engine stays UI-free. The UI renders from engine **events**, never by re-implementing semantics.
- Levels are TypeScript modules whose `definition` is plain serializable data. Every level must keep passing the generic checks in `packages/levels/test/levels.test.ts`: reference plan valid, within par and the stamina budget, uses only its tray's tools, and correct on examples, edge cases, the Jester's attack and random inputs. Follow the designer checklist in `docs/design/05-level-walkthroughs.md` §9.
- Generated code is tested by **executing** it (JavaScript in-process, Python via `python3`).
- UI text is plain and friendly; the fantasy layer is light in v0 (PRD non-goals).
- Accessibility: keyboard reachable, 44 px touch targets, no nested interactive elements, text alternative for visuals (narration, chart table).
- Phone layout: grid items need `min-width: 0` or wide content stretches the page. Check overflow against the **device width** (mobile browsers widen `window.innerWidth`).

## Gotchas learned the hard way

- **Stale servers:** the e2e config uses `reuseExistingServer: false` on purpose. An old `vite preview` once served a stale build and tests passed against old code. Kill leftover servers by port, and note the process shows as `vite.js preview`.
- **Visual checks matter:** several real bugs (phone overflow, chart clipping, label overlap) were only found by screenshotting with Playwright and looking at the result. Do that for UI changes.
- Pyodide is self-hosted (copied from `node_modules/pyodide` by a Vite plugin to `/pyodide/`); the `node:*` externalization warnings during build are expected.
- The service worker registers only on the web, never in the Capacitor app.
- Branch deletion is not possible from cloud sessions; ask the user to do it on GitHub.
