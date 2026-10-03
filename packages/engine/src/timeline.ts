import type { NodeId } from "./ast.ts";
import type { EngineEvent } from "./events.ts";

/**
 * A beat is one step of the timeline: the consecutive events produced by a
 * single card (e.g. reading two tiles, adding them and comparing the sum).
 * Stepping by beats feels like "one card at a time" instead of one micro-op.
 */
export interface Beat {
  /** Index of the first event in the beat. */
  start: number;
  /** Index of the last event in the beat (inclusive). */
  end: number;
  /** The card that produced the beat. */
  stmt: NodeId;
}

export function buildBeats(events: readonly EngineEvent[], owners: ReadonlyMap<NodeId, NodeId>): Beat[] {
  const beats: Beat[] = [];
  for (const [index, event] of events.entries()) {
    const stmt = owners.get(event.node) ?? event.node;
    const current = beats.at(-1);
    // Same card keeps extending the beat (e.g. a loop's condition check plus its
    // round marker), but nothing joins a beat after a round has started.
    if (current && current.stmt === stmt && events[current.end]?.type !== "loop.round") {
      current.end = index;
    } else {
      beats.push({ start: index, end: index, stmt });
    }
  }
  return beats;
}
