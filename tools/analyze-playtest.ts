// Prints the PRD's decision metrics from playtest event exports.
// Usage: node tools/analyze-playtest.ts <export.json | directory of exports> [...]
// Accepts files from the in-app export (?export=1) or a JSON array of events.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import type { TrackedEvent } from "../apps/web/src/game/analytics.ts";
import { computeMetrics, type Rate } from "../apps/web/src/game/metrics.ts";

function load(path: string): TrackedEvent[] {
  if (statSync(path).isDirectory()) return readdirSync(path).filter((f) => f.endsWith(".json")).flatMap((f) => load(join(path, f)));
  const data = JSON.parse(readFileSync(path, "utf8")) as TrackedEvent[] | { events: TrackedEvent[] };
  return Array.isArray(data) ? data : data.events;
}

const paths = process.argv.slice(2);
if (paths.length === 0) {
  console.error("Usage: node tools/analyze-playtest.ts <export.json | directory> [...]");
  process.exit(1);
}

const m = computeMetrics(paths.flatMap(load));
const show = (label: string, r: Rate) => {
  const pct = r.value === null ? "no data" : `${Math.round(r.value * 100)}%`;
  const verdict = r.met === null ? "" : r.met ? "✔ meets target" : "✘ below target";
  console.log(`${label.padEnd(44)} ${pct.padStart(8)}  (${r.numerator}/${r.denominator}, target ${Math.round(r.target * 100)}%)  ${verdict}`);
};

console.log(`Players (installs): ${m.installs}\n`);
show("H1 · Completed all 5 levels", m.sliceCompletion);
show("H1 · Would keep playing (4–5 of 5)", m.wouldKeepPlaying);
show("H2 · Passed the trial right after the slice", m.transferPassImmediate);
show("H2 · Passed the trial 24 hours later", m.transferPass24h);
show("H3 · War Council answers correct", m.warCouncilCorrect);
show("H3 · Switched to a fast plan after the Ogre", m.bruteForceSwitch);
for (const [device, r] of Object.entries(m.completionByDevice)) show(`H4 · Completion on ${device}`, r);
console.log(`H4 · Phone within 15 points of desktop: ${m.phoneParity === null ? "no data" : m.phoneParity ? "✔ yes" : "✘ no"}`);
