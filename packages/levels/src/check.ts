import { run, valuesEqual, type Inputs, type Program, type RunOptions, type RunResult, type Value } from "@vicoding/engine";
import type { LevelModule } from "./types.ts";

export interface CaseResult {
  passed: boolean;
  expected: Value;
  /** The plan's answer; undefined when it crashed or never returned. */
  actual: Value | undefined;
  result: RunResult;
}

/** Runs a plan on one input and compares its answer with the level's reference. */
export function runCase(level: LevelModule, program: Program, input: Inputs, options?: RunOptions): CaseResult {
  const expected = level.reference(input);
  const result = run(program, input, options);
  const { output } = level.definition;

  let actual: Value | undefined;
  if (output.kind === "return") {
    actual = result.outcome.kind === "returned" ? result.outcome.value : undefined;
  } else {
    actual = result.outcome.kind === "error" ? undefined : result.finalArrays[output.name];
  }

  const passed = actual !== undefined && (level.accepts ? level.accepts(input, actual) : valuesEqual(actual, expected));
  return { passed, expected, actual, result };
}
