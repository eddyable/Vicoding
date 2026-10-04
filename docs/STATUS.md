# Project status and next steps

_Last updated: 2026-10-04, at the end of the 4-week prototype build._

## Where we are

The **v0 vertical slice** from the [PRD](prd/PRD-v0-vertical-slice.md) is built and on `main`:

- 5 playable levels in Arraia (find max, reverse, fix an off-by-one, Two Sum II, Move Zeroes) with Hand Mode, an animated board and timeline, a card editor (tap and drag), Charge scoring with stars, the Jester's fuzzing, the growth chart and Ogre, rewind to the failing step, and code reveal in Python and JavaScript.
- The **Final Trial** (Valid Palindrome in plain Python via in-browser Pyodide), a survey, and the 24-hour follow-up link and reminder.
- Anonymous analytics with consent, a researcher export (`?export=1`), and an analysis CLI for the PRD metrics.
- Installable, offline web app; Capacitor iOS and Android projects.
- Tests: 141 unit tests and 32 Playwright end-to-end tests (desktop and phone).

What's **not** done:

- The signed iOS and Android builds: they need a Mac with Xcode and Android Studio ([mobile.md](mobile.md)).
- Breakpoints (FR-27, optional).
- No CI yet.

## Next steps, in order

The goal of v0 is a **go / adjust / stop decision** from a playtest (PRD §4 hypotheses). Everything below serves that, in this order.

### 1. Put it in front of testers
- [x] **CI:** a GitHub Actions workflow (`.github/workflows/ci.yml`) running `pnpm typecheck`, `pnpm test` and the e2e suite on every push and PR.
- [x] **Deploy the web build** to GitHub Pages (`.github/workflows/deploy.yml`, builds on push to `main`). The user still needs to flip Settings → Pages → Source to "GitHub Actions" once, the first time it runs.
- [ ] **Analytics collector:** a tiny endpoint that stores the JSON batches the app sends (`VITE_ANALYTICS_URL`), e.g. a serverless function. Alternatively, use only the device export in moderated sessions. Claude can write it; the user deploys it.
- [ ] **Native test builds** on the user's Mac and in Android Studio, following [mobile.md](mobile.md). Optional: the web link already works on phones.
- [ ] Walk through the pre-launch checklist in [playtest.md](playtest.md) §5.

### 2. Run the playtest (PRD week 5)
- [ ] Recruit 10–15 people preparing for interviews (at least 5 on phones) and decide on an incentive. This is still open (PRD §14).
- [ ] 6 moderated think-aloud sessions plus unmoderated testers via the link.
- [ ] Collect the 24-hour follow-up trials.
- [ ] Run `node tools/analyze-playtest.ts` and write a synthesis (`docs/playtest-results.md`) with a go / adjust / stop call per hypothesis (H1 fun, H2 transfer, H3 understanding, H4 mobile).

### 3. After the decision
- **If go:** write the full PRD (next realms per [design/01](design/01-world-and-characters.md) §5, starting with the Goblin Bazaar: hashing and sliding window), plus progression, accounts and a backend (Supabase per the ADR). Bring in the fantasy layer (races, gear: [design/02](design/02-gear-and-progression.md)) step by step, keeping Classic Mode.
- **If adjust:** fix what the data points at first. Likely candidates: card-editor speed for experienced coders, phone editing, hint quality.
- **If stop:** write down what was learned. The engine, codegen and level tooling are reusable.

## Open questions for the user
1. Tester recruiting channel and incentive (PRD §14).
2. Hosting choice for the analytics collector (the web build now deploys to GitHub Pages).
3. Whether native builds are wanted for the first playtest, or the web link is enough.
