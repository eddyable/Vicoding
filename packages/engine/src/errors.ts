import type { NodeId } from "./ast.ts";

export type ErrorCode =
  /** Off-by-One Imp: reading or writing a tile that does not exist. */
  | "OUT_OF_BOUNDS"
  /** Ouroboros: the plan ran past the step limit (usually an infinite loop). */
  | "TICK_LIMIT"
  /** Null Wraith / Stale Ghost family: reading a banner that was never raised. */
  | "UNDEFINED_VARIABLE"
  | "UNKNOWN_ARRAY"
  | "NOT_A_POINTER"
  | "TYPE_ERROR"
  | "DIVISION_BY_ZERO"
  /** An empty slot in the plan. */
  | "HOLE"
  | "BREAK_OUTSIDE_LOOP";

/** Serializable description of what went wrong and where. */
export interface EngineFault {
  code: ErrorCode;
  message: string;
  node: NodeId;
  details: Record<string, unknown>;
}

export class EngineError extends Error {
  readonly code: ErrorCode;
  readonly node: NodeId;
  readonly details: Record<string, unknown>;

  constructor(code: ErrorCode, message: string, node: NodeId, details: Record<string, unknown> = {}) {
    super(message);
    this.name = "EngineError";
    this.code = code;
    this.node = node;
    this.details = details;
  }

  toFault(): EngineFault {
    return { code: this.code, message: this.message, node: this.node, details: this.details };
  }
}
