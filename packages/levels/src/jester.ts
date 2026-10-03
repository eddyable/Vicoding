import type { Inputs, Program, RunOptions, RunResult, Value } from "@vicoding/engine";
import { valuesEqual } from "@vicoding/engine";
import { runCase, type CaseResult } from "./check.ts";
import { randomInt, seededRandom } from "./random.ts";
import type { LevelModule } from "./types.ts";

export interface FuzzOptions {
  seed?: number;
  tries?: number;
  /** Largest input generated while fuzzing; small inputs make readable counterexamples. */
  maxSize?: number;
}

export interface Counterexample {
  input: Inputs;
  outcome: CaseResult;
}

const FUZZ_RUN: RunOptions = { record: false, maxTicks: 200_000 };

/**
 * The Jester's search: try many small random inputs, and if one breaks the
 * plan, shrink it to the smallest input that still breaks it.
 */
export function fuzz(level: LevelModule, program: Program, options: FuzzOptions = {}): Counterexample | undefined {
  const { seed = 1337, tries = 150, maxSize = 8 } = options;
  const random = seededRandom(seed);
  const { min, max } = level.definition.size;
  for (let i = 0; i < tries; i += 1) {
    const input = level.generate(randomInt(random, min, Math.min(max, Math.max(min, maxSize))), random);
    const outcome = runCase(level, program, input, FUZZ_RUN);
    if (!outcome.passed) return shrink(level, program, { input, outcome });
  }
  return undefined;
}

/**
 * Greedily removes tiles while the plan keeps failing. Removing tiles keeps
 * inputs valid for every prototype level (a sorted row stays sorted).
 */
export function shrink(level: LevelModule, program: Program, found: Counterexample): Counterexample {
  let best = found;
  let improved = true;
  while (improved) {
    improved = false;
    for (const [name, value] of Object.entries(best.input)) {
      if (!Array.isArray(value) || value.length <= level.definition.size.min) continue;
      for (let k = 0; k < value.length; k += 1) {
        const candidate: Inputs = { ...best.input, [name]: [...value.slice(0, k), ...value.slice(k + 1)] };
        const outcome = runCase(level, program, candidate, FUZZ_RUN);
        if (!outcome.passed) {
          best = { input: candidate, outcome };
          improved = true;
          break;
        }
      }
      if (improved) break;
    }
  }
  return best;
}

/**
 * Finds the event where a failed run went wrong, so the board can rewind to it:
 * the crash, the wrong return, or the last move that left a tile wrong.
 * Returns undefined when the run is correct.
 */
export function findDivergence(level: LevelModule, input: Inputs, result: RunResult): number | undefined {
  const { events, outcome } = result;
  if (events.length === 0) return undefined;
  const last = events.length - 1;
  if (outcome.kind === "error") return last;

  const output = level.definition.output;
  const expected = level.reference(input);

  if (output.kind === "return") {
    if (outcome.kind !== "returned") return last;
    const ok = level.accepts ? level.accepts(input, outcome.value) : valuesEqual(outcome.value, expected);
    return ok ? undefined : last;
  }

  const final = result.finalArrays[output.name] ?? [];
  const want = expected as Value[];
  const wrong = new Set<number>();
  final.forEach((v, i) => !valuesEqual(v, want[i] as Value) && wrong.add(i));
  if (wrong.size === 0) return undefined;

  for (let i = last; i >= 0; i -= 1) {
    const event = events[i]!;
    if (event.type === "array.write" && event.array === output.name && wrong.has(event.index)) return i;
    if (event.type === "array.swap" && event.array === output.name && (wrong.has(event.i) || wrong.has(event.j))) return i;
  }
  // The wrong tiles were never touched: the plan stopped too early.
  return last;
}
