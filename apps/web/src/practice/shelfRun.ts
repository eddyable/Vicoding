import { buildBeats, nodeOwners, run, type Beat, type EngineEvent, type Inputs } from "@vicoding/engine";
import { getLevel } from "@vicoding/levels";
import { buildFrame } from "../game/frame.ts";

const level = getLevel("arraia-01-tallest-scroll")!;

export interface ShelfRun {
  inputs: Inputs;
  events: EngineEvent[];
  beats: Beat[];
  length: number;
  /** Timeline position where the walker first stands on scroll k (null if never). */
  arrivalAt: (k: number) => number | null;
  /** Last position of the walker's stay on scroll k, before it moves on. */
  leaveAt: (k: number) => number;
}

/** Runs the real reference plan on a shelf, so puzzles animate the same engine as the levels. */
export function makeShelfRun(shelf: readonly number[]): ShelfRun {
  const inputs: Inputs = { scrolls: [...shelf] };
  const result = run(level.referencePlan, inputs);
  const beats = buildBeats(result.events, nodeOwners(level.referencePlan));
  const length = beats.length;
  const standing: (number | undefined)[] = [];
  for (let p = 0; p <= length; p += 1) standing.push(buildFrame(inputs, result.events, beats, p).state.pointers.i?.index);
  const arrivalAt = (k: number) => {
    const p = standing.indexOf(k);
    return p < 0 ? null : p;
  };
  const leaveAt = (k: number) => {
    const from = arrivalAt(k);
    if (from === null) return length;
    let p = from;
    while (p < length && standing[p + 1] === k) p += 1;
    return p;
  };
  return { inputs, events: result.events, beats, length, arrivalAt, leaveAt };
}
