import type { ArithOp, CompareOp, NodeId, Value } from "./ast.ts";
import type { EngineFault } from "./errors.ts";

/**
 * Semantic events emitted by the interpreter (the "Battle Chronicle").
 *
 * Renderers map these to animations; the timeline scrubs over them; replaying
 * them from the initial input reconstructs the full state at any point.
 */
export interface EventBase {
  /** Position in the event log. */
  seq: number;
  /** Operations spent so far, including this event's own cost. */
  tick: number;
  /** The card or expression that produced the event. */
  node: NodeId;
}

export type EventPayload =
  | { type: "var.set"; name: string; value: Value; prev: Value | undefined }
  | { type: "agent.place"; agent: string; array: string; index: number; prev: number | undefined }
  | { type: "agent.move"; agent: string; array: string; from: number; to: number }
  | { type: "array.read"; array: string; index: number; value: Value }
  | { type: "array.write"; array: string; index: number; value: Value; prev: Value }
  | { type: "array.swap"; array: string; i: number; j: number }
  | { type: "compare"; op: CompareOp; left: Value; right: Value; result: boolean }
  | { type: "arith"; op: ArithOp; left: number; right: number; result: number }
  | { type: "logic"; op: "and" | "or" | "not"; result: boolean }
  /** Which branch of an if card ran: its index, "otherwise", or "none". */
  | { type: "branch"; taken: number | "otherwise" | "none" }
  /** A loop starts a new round. `depth` 1 is the outermost loop. */
  | { type: "loop.round"; round: number; depth: number }
  | { type: "return"; value: Value }
  | { type: "error"; fault: EngineFault };

export type EngineEvent = EventBase & EventPayload;
export type EventType = EngineEvent["type"];
