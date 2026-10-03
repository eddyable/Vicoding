import {
  applyEvent,
  initialState,
  type Beat,
  type BoardState,
  type CompareOp,
  type EngineEvent,
  type Inputs,
  type NodeId,
  type Value,
} from "@vicoding/engine";
import { describeEvents } from "./narrate.ts";

export interface TileRef {
  array: string;
  index: number;
}

/** Everything the board draws at one position of the timeline. */
export interface Frame {
  state: BoardState;
  /** The card that just ran (highlighted in the plan). */
  activeCard: NodeId | undefined;
  /** Tiles read in this step (amber). */
  reads: TileRef[];
  /** Tiles written or swapped in this step. */
  changed: TileRef[];
  /** Banners changed in this step. */
  changedVars: string[];
  compare: { op: CompareOp; left: Value; right: Value; result: boolean } | undefined;
  /** Every tile each pointer has stood on so far, in order (footprints). */
  trails: Record<string, number[]>;
  /** Narration of this step. */
  caption: string;
}

/**
 * Builds the frame after `position` beats (0 = before the first card runs).
 * Replays events from the start, which is fast for prototype-sized runs.
 */
export function buildFrame(inputs: Inputs, events: readonly EngineEvent[], beats: readonly Beat[], position: number): Frame {
  const state = initialState(inputs);
  const trails: Record<string, number[]> = {};
  const clamped = Math.max(0, Math.min(position, beats.length));
  const beat = clamped > 0 ? beats[clamped - 1] : undefined;
  const lastEvent = beat ? beat.end : -1;

  for (let i = 0; i <= lastEvent; i += 1) {
    const event = events[i] as EngineEvent;
    applyEvent(state, event);
    if (event.type === "agent.place") trails[event.agent] = [...(trails[event.agent] ?? []), event.index];
    if (event.type === "agent.move") trails[event.agent] = [...(trails[event.agent] ?? []), event.to];
  }

  const reads: TileRef[] = [];
  const changed: TileRef[] = [];
  const changedVars: string[] = [];
  let compare: Frame["compare"];
  const beatEvents = beat ? events.slice(beat.start, beat.end + 1) : [];
  for (const event of beatEvents) {
    if (event.type === "array.read") reads.push({ array: event.array, index: event.index });
    if (event.type === "array.write") changed.push({ array: event.array, index: event.index });
    if (event.type === "array.swap") changed.push({ array: event.array, index: event.i }, { array: event.array, index: event.j });
    if (event.type === "var.set") changedVars.push(event.name);
    if (event.type === "compare") compare = { op: event.op, left: event.left, right: event.right, result: event.result };
  }

  return {
    state,
    activeCard: beat?.stmt,
    reads,
    changed,
    changedVars,
    compare,
    trails,
    caption: beat ? describeEvents(beatEvents) : "Ready. Press play to start.",
  };
}
