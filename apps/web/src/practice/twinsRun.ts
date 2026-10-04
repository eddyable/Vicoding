import { buildBeats, nodeOwners, run, type Beat, type EngineEvent, type Inputs } from "@vicoding/engine";
import { getLevel } from "@vicoding/levels";

const level = getLevel("arraia-02-mirror-twins")!;

export const TWINS_INPUTS = level.definition.inputs;

export interface TwinsRun {
  inputs: Inputs;
  events: EngineEvent[];
  beats: Beat[];
  length: number;
}

/** Runs the real Mirror Twins reference plan on a word. */
export function makeTwinsRun(word: string): TwinsRun {
  const inputs: Inputs = { letters: [...word] };
  const result = run(level.referencePlan, inputs);
  const beats = buildBeats(result.events, nodeOwners(level.referencePlan));
  return { inputs, events: result.events, beats, length: beats.length };
}
