import { countCards, staminaFor, type EngineFault, type Inputs, type Program, type Value } from "@vicoding/engine";
import { runCase } from "./check.ts";
import type { LevelModule } from "./types.ts";

/** Size of the large "Horde" input in the prototype. */
export const HORDE_SIZE = 10_000;
/** The Horde stops a plan once it spends this many times its budget (the Ogre wins). */
export const HARD_CAP_MULTIPLIER = 20;

export type Wave = "vanguard" | "skirmishers" | "jester";

export interface ChargeCase {
  wave: Wave;
  label: string;
  input: Inputs;
  passed: boolean;
  expected: Value;
  actual: Value | undefined;
  fault?: EngineFault;
}

export interface HordeReport {
  n: number;
  ticks: number;
  budget: number;
  withinBudget: boolean;
  /** The plan ran past the hard cap, so its answer is unknown. */
  overwhelmed: boolean;
  passed: boolean;
}

export interface ChargeReport {
  cases: ChargeCase[];
  /** First failing case, if any (shown and replayed on the board). */
  firstFailure: ChargeCase | undefined;
  horde: HordeReport;
  cards: number;
  par: number;
  stars: 0 | 1 | 2 | 3;
}

/**
 * Runs a plan against the level's waves and awards stars:
 * ★ correct on every case, ★★ also within the stamina budget on the Horde,
 * ★★★ also within par cards. A slow but correct plan still earns ★.
 */
export function charge(level: LevelModule, program: Program): ChargeReport {
  const { definition } = level;
  const cases: ChargeCase[] = [];
  const add = (wave: Wave, label: string, input: Inputs) => {
    const outcome = runCase(level, program, input);
    const fault = outcome.result.outcome.kind === "error" ? outcome.result.outcome.fault : undefined;
    cases.push({ wave, label, input, passed: outcome.passed, expected: outcome.expected, actual: outcome.actual, ...(fault ? { fault } : {}) });
  };

  definition.examples.forEach((example, i) => add("vanguard", example.label ?? `Example ${i + 1}`, example.input));
  level.edgeCases.forEach((edge, i) => add("skirmishers", edge.label ?? `Edge case ${i + 1}`, edge.input));
  add("jester", "The Jester's attack", definition.jester.input);

  const n = Math.min(HORDE_SIZE, definition.size.max);
  const budget = staminaFor(definition.targets.stamina, n);
  const hordeInput = level.worstCase(n);
  const hordeRun = runCase(level, program, hordeInput, { record: false, maxTicks: budget * HARD_CAP_MULTIPLIER });
  const overwhelmed = hordeRun.result.outcome.kind === "error" && hordeRun.result.outcome.fault.code === "TICK_LIMIT";
  const horde: HordeReport = {
    n,
    ticks: hordeRun.result.ticks,
    budget,
    withinBudget: !overwhelmed && hordeRun.result.ticks <= budget,
    overwhelmed,
    passed: hordeRun.passed,
  };

  const cards = countCards(program);
  const correct = cases.every((c) => c.passed) && (horde.passed || horde.overwhelmed);
  let stars: ChargeReport["stars"] = 0;
  if (correct) {
    stars = 1;
    if (horde.withinBudget) {
      stars = 2;
      if (cards <= definition.targets.parCards) stars = 3;
    }
  }

  return { cases, firstFailure: cases.find((c) => !c.passed), horde, cards, par: definition.targets.parCards, stars };
}
