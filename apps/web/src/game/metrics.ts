import type { TrackedEvent } from "./analytics.ts";

/**
 * Computes the PRD's decision metrics (§10) from collected events, so the
 * playtest ends with numbers rather than impressions.
 */

export interface Rate {
  numerator: number;
  denominator: number;
  /** numerator / denominator, or null when there is no data. */
  value: number | null;
  target: number;
  met: boolean | null;
}

export interface PlaytestMetrics {
  installs: number;
  sliceCompletion: Rate;
  wouldKeepPlaying: Rate;
  transferPassImmediate: Rate;
  transferPass24h: Rate;
  warCouncilCorrect: Rate;
  bruteForceSwitch: Rate;
  completionByDevice: Record<string, Rate>;
  /** Phone completion within 15 percentage points of desktop (H4). */
  phoneParity: boolean | null;
}

const LEVELS = [
  "arraia-01-tallest-scroll",
  "arraia-02-mirror-twins",
  "arraia-03-imp-on-the-bridge",
  "arraia-04-bridge-of-planks",
  "arraia-05-clearing-the-road",
];

function rate(numerator: number, denominator: number, target: number): Rate {
  const value = denominator === 0 ? null : numerator / denominator;
  return { numerator, denominator, value, target, met: value === null ? null : value >= target };
}

export function computeMetrics(events: readonly TrackedEvent[]): PlaytestMetrics {
  const byInstall = new Map<string, TrackedEvent[]>();
  for (const e of [...events].sort((a, b) => a.at - b.at)) {
    byInstall.set(e.install, [...(byInstall.get(e.install) ?? []), e]);
  }
  const installs = [...byInstall.values()];

  const started = installs.filter((list) => list.some((e) => e.name === "level_start" && e.props.level === LEVELS[0]));
  const completedAll = (list: TrackedEvent[]) => LEVELS.every((id) => list.some((e) => e.name === "level_complete" && e.props.level === id));
  const sliceCompletion = rate(started.filter(completedAll).length, started.length, 0.7);

  const surveys = events.filter((e) => e.name === "survey_submit");
  const wouldKeepPlaying = rate(surveys.filter((e) => Number(e.props.keep_playing) >= 4).length, surveys.length, 0.6);

  const transferRate = (mode: "first" | "followup", target: number) => {
    const tried = installs.filter((list) => list.some((e) => e.name === "transfer_test_start" && e.props.mode === mode));
    const passed = tried.filter((list) => list.some((e) => e.name === "transfer_test_submit" && e.props.mode === mode && e.props.passed === true));
    return rate(passed.length, tried.length, target);
  };

  const answers = events.filter((e) => e.name === "war_council_answer");
  const warCouncilCorrect = rate(answers.filter((e) => e.props.correct === true).length, answers.length, 0.7);

  // Level 4: of players who met the Ogre, how many went on to a fast (2★+) plan?
  const metOgre = installs.filter((list) => list.some((e) => e.name === "ogre_shown" && e.props.level === LEVELS[3]));
  const switched = metOgre.filter((list) => {
    const firstOgre = list.findIndex((e) => e.name === "ogre_shown" && e.props.level === LEVELS[3]);
    return list.slice(firstOgre).some((e) => e.name === "charge" && e.props.level === LEVELS[3] && Number(e.props.stars) >= 2);
  });
  const bruteForceSwitch = rate(switched.length, metOgre.length, 0.5);

  const completionByDevice: Record<string, Rate> = {};
  for (const device of ["phone", "tablet", "desktop"]) {
    const group = started.filter((list) => list[0]!.device === device);
    if (group.length > 0) completionByDevice[device] = rate(group.filter(completedAll).length, group.length, 0.7);
  }
  const phone = completionByDevice.phone?.value;
  const desktop = completionByDevice.desktop?.value;
  const phoneParity = phone == null || desktop == null ? null : desktop - phone <= 0.15;

  return {
    installs: installs.length,
    sliceCompletion,
    wouldKeepPlaying,
    transferPassImmediate: transferRate("first", 0.6),
    transferPass24h: transferRate("followup", 0.5),
    warCouncilCorrect,
    bruteForceSwitch,
    completionByDevice,
    phoneParity,
  };
}
