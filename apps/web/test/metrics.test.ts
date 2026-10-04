import { describe, expect, it } from "vitest";
import type { EventName, Props, TrackedEvent } from "../src/game/analytics.ts";
import { computeMetrics } from "../src/game/metrics.ts";

const LEVELS = ["arraia-01-tallest-scroll", "arraia-02-mirror-twins", "arraia-03-imp-on-the-bridge", "arraia-04-bridge-of-planks", "arraia-05-clearing-the-road"];

let clock = 0;
const ev = (install: string, name: EventName, props: Props = {}, device: TrackedEvent["device"] = "desktop"): TrackedEvent => ({
  name,
  props,
  at: clock++,
  install,
  session: "s",
  device,
  platform: "web",
});

/** A player who finishes every level, passes the trial and likes it. */
function champion(id: string, device: TrackedEvent["device"] = "desktop"): TrackedEvent[] {
  return [
    ev(id, "level_start", { level: LEVELS[0]! }, device),
    ...LEVELS.map((level) => ev(id, "level_complete", { level, stars: 3 }, device)),
    ev(id, "war_council_answer", { correct: true }, device),
    ev(id, "transfer_test_start", { mode: "first" }, device),
    ev(id, "transfer_test_submit", { mode: "first", passed: true }, device),
    ev(id, "survey_submit", { keep_playing: 5 }, device),
  ];
}

describe("playtest metrics", () => {
  it("computes the PRD decision metrics", () => {
    const events = [
      ...champion("a"),
      ...champion("b", "phone"),
      // c quits after level 1, fails the trial and wouldn't keep playing.
      ev("c", "level_start", { level: LEVELS[0]! }, "phone"),
      ev("c", "level_complete", { level: LEVELS[0]! }, "phone"),
      ev("c", "war_council_answer", { correct: false }, "phone"),
      ev("c", "transfer_test_start", { mode: "first" }, "phone"),
      ev("c", "transfer_test_submit", { mode: "first", passed: false }, "phone"),
      ev("c", "survey_submit", { keep_playing: 2 }, "phone"),
      // a meets the Ogre on level 4, then gets a fast plan.
      ev("a", "ogre_shown", { level: LEVELS[3]! }),
      ev("a", "charge", { level: LEVELS[3]!, stars: 3 }),
      // d meets the Ogre and never gets faster.
      ev("d", "ogre_shown", { level: LEVELS[3]! }),
      ev("d", "charge", { level: LEVELS[3]!, stars: 1 }),
    ];
    const m = computeMetrics(events);

    expect(m.installs).toBe(4);
    expect(m.sliceCompletion).toMatchObject({ numerator: 2, denominator: 3, met: false });
    expect(m.wouldKeepPlaying).toMatchObject({ numerator: 2, denominator: 3, met: true });
    expect(m.transferPassImmediate).toMatchObject({ numerator: 2, denominator: 3, met: true });
    expect(m.transferPass24h).toMatchObject({ denominator: 0, value: null, met: null });
    expect(m.warCouncilCorrect).toMatchObject({ numerator: 2, denominator: 3 });
    expect(m.bruteForceSwitch).toMatchObject({ numerator: 1, denominator: 2, met: true });
    expect(m.completionByDevice.desktop).toMatchObject({ numerator: 1, denominator: 1 });
    expect(m.completionByDevice.phone).toMatchObject({ numerator: 1, denominator: 2 });
    expect(m.phoneParity).toBe(false);
  });

  it("reports no data instead of zero when nothing was collected", () => {
    const m = computeMetrics([]);
    expect(m.installs).toBe(0);
    expect(m.sliceCompletion.value).toBeNull();
    expect(m.phoneParity).toBeNull();
  });
});
