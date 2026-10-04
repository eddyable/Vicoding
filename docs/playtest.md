# Running the v0 playtest

How to run the playtest from [PRD v0 §11](prd/PRD-v0-vertical-slice.md#11-playtest-plan) and turn it into the go / adjust / stop decision.

## 1. Host the web build

```bash
pnpm install
VITE_ANALYTICS_URL="https://your-collector.example/events" pnpm build   # endpoint optional, see §3
# deploy apps/web/dist to any static host (Netlify, Vercel, Cloudflare Pages, GitHub Pages, S3)
```

The site is a static, installable web app: testers open a link on desktop or phone, and after the first visit it works offline. Phone testers can also get the native test builds ([mobile.md](mobile.md)).

## 2. What testers do

1. Open the link; answer the consent prompt (anonymous usage data).
2. Play the five Arraia levels (~30–45 minutes).
3. Take the **Final Trial**: Valid Palindrome in plain Python (no cards).
4. Fill in the two-minute survey.
5. **24 hours later**, open the follow-up link shown after the survey (`…/?trial=followup`), or tap the reminder in the mobile app, and take the trial again.

For moderated sessions, use think-aloud and record the screen with consent.

## 3. Collecting the data

Two options. Neither needs accounts.

| Option | How |
|---|---|
| **Collector endpoint** (unmoderated testers) | Build with `VITE_ANALYTICS_URL`. The app sends batches of events as JSON arrays (`POST`, via `navigator.sendBeacon`). Any endpoint that appends the request body to storage works, e.g. a small serverless function. |
| **Device export** (moderated sessions) | At the end of the session, open `…/?export=1` on the tester's device and press **Download JSON**. |

Events are anonymous: a random install id, device type (phone, tablet or desktop), platform, and the events listed in PRD §10. The only optional personal data is an email address a tester may type into the survey for the follow-up invitation.

## 4. Computing the decision metrics

Put all exports (or the collector's JSON arrays) into one folder and run:

```bash
node tools/analyze-playtest.ts path/to/exports/
```

It prints each PRD target with ✔ / ✘:

| Hypothesis | Metric | Target |
|---|---|---|
| H1 Fun | Completed all 5 levels | ≥ 70% |
| H1 Fun | Would keep playing (4–5 of 5) | ≥ 60% |
| H2 Transfer | Passed the trial right after the slice | ≥ 60% |
| H2 Transfer | Passed the trial 24 hours later | ≥ 50% |
| H3 Understanding | War Council answers correct | ≥ 70% |
| H3 Understanding | Switched to a fast plan after meeting the Ogre on level 4 | ≥ 50% |
| H4 Mobile | Phone completion within 15 points of desktop | yes |

Combine these with the session notes and the survey's free-text answers in the synthesis document.

## 5. Before inviting testers: checklist

- [ ] Deployed build loads on desktop and a real phone; the Final Trial shows "Python is ready."
- [ ] Analytics: either the collector receives events, or you've practised the export on a test device.
- [ ] The follow-up link works from a fresh browser.
- [ ] Recruiting channel and incentive decided (PRD §14, still open).
