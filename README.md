# Vicoding

A game where you learn coding-interview patterns by building algorithms visually, watching them run, and then reading the code you just wrote.

- **Status and next steps:** [`docs/STATUS.md`](docs/STATUS.md). Working on this repo with Claude Code? See [`CLAUDE.md`](CLAUDE.md).
- **Design docs:** start with [`docs/design/00-big-picture.md`](docs/design/00-big-picture.md), or see the [docs index](docs/README.md).
- **Current milestone:** [PRD v0 — Vertical Slice](docs/prd/PRD-v0-vertical-slice.md). Tech stack: [ADR 0001](docs/adr/0001-tech-stack.md).

## Repository layout

```
packages/
  engine/   Battle Plan language, interpreter, event log (Battle Chronicle), replay, validation, editing
  levels/   The five Arraia levels, reference solutions, Charge scoring, the Jester's fuzzing
  codegen/  Battle Plan → readable Python and JavaScript, line-linked to cards
apps/
  web/      Vite + React web app (installable, offline): levels, Final Trial (Python via Pyodide), survey, analytics
  mobile/   Capacitor shell: iOS and Android projects around the web build
tools/      Playtest analysis (PRD decision metrics)
docs/       Game design, PRD, architecture decisions
```

## Development

Requires Node 22+ and pnpm 10.

```bash
pnpm install
pnpm dev         # play locally at http://localhost:5173
pnpm test        # unit tests (Vitest)
pnpm typecheck   # TypeScript, strict
pnpm build       # production build of the web app

# End-to-end tests (Playwright, desktop + phone viewports)
pnpm --filter @vicoding/web e2e
```

- **Mobile apps:** see [`docs/mobile.md`](docs/mobile.md).
- **Running the playtest and reading the results:** see [`docs/playtest.md`](docs/playtest.md).
