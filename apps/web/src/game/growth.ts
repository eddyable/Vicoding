import { run, staminaFor, type Program } from "@vicoding/engine";
import type { LevelModule } from "@vicoding/levels";

export interface GrowthPoint {
  n: number;
  /** Operations the plan spent on the worst-case input of size n; undefined if the Ogre stopped it. */
  ticks: number | undefined;
  budget: number;
  /** What a brute-force (n²) plan of the same per-step cost would spend, for reference. */
  quadratic: number;
}

export const GROWTH_SIZES = [8, 16, 32, 64, 128, 256, 512] as const;

/**
 * Generous per-size cap so the chart can show how a slow plan grows (unlike the
 * Horde, which stops it at 20× budget). A brute-force plan at n = 512 needs
 * well under this.
 */
const GROWTH_MAX_TICKS = 3_000_000;

/** "Ogre's Shadow": how the plan's cost grows with the input, next to the budget and an n² curve. */
export function measureGrowth(level: LevelModule, program: Program): GrowthPoint[] {
  const { stamina } = level.definition.targets;
  return GROWTH_SIZES.map((n) => {
    const budget = staminaFor(stamina, n);
    const { outcome, ticks } = run(program, level.worstCase(n), { record: false, maxTicks: GROWTH_MAX_TICKS });
    const stopped = outcome.kind === "error" && outcome.fault.code === "TICK_LIMIT";
    return { n, ticks: stopped ? undefined : ticks, budget, quadratic: (stamina.perN / 2) * n * n };
  });
}

export type GrowthShape = "linear" | "faster" | "overwhelmed";

/** Plain-language verdict on the curve's shape, from the last two measurements. */
export function growthShape(points: readonly GrowthPoint[]): GrowthShape {
  if (points.some((p) => p.ticks === undefined)) return "overwhelmed";
  const [a, b] = points.slice(-2);
  if (!a || !b || !a.ticks || !b.ticks) return "linear";
  // Doubling n: a linear plan roughly doubles its cost, a quadratic one quadruples it.
  return b.ticks / a.ticks > 2.8 ? "faster" : "linear";
}
