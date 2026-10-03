# Vicoding

A game where you learn coding-interview patterns by building algorithms visually, watching them run, and then reading the code you just wrote.

- **Design docs:** start with [`docs/design/00-big-picture.md`](docs/design/00-big-picture.md), or see the [docs index](docs/README.md).
- **Current milestone:** [PRD v0 — Vertical Slice](docs/prd/PRD-v0-vertical-slice.md). Tech stack: [ADR 0001](docs/adr/0001-tech-stack.md).

## Repository layout

```
packages/
  engine/   Battle Plan language, interpreter, event log (Battle Chronicle), replay, validation
  levels/   Level definitions, reference solutions, test-case generators
apps/       (coming) web app and Capacitor mobile shell
docs/       Game design, PRD, architecture decisions
```

## Development

Requires Node 22+ and pnpm 10.

```bash
pnpm install
pnpm test        # unit tests (Vitest)
pnpm typecheck   # TypeScript, strict
```
