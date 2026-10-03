import type { Value } from "./ast.ts";
import type { EngineFault } from "./errors.ts";
import type { EngineEvent } from "./events.ts";
import type { Inputs } from "./interpreter.ts";

export interface PointerState {
  array: string;
  index: number;
}

/** Everything the board needs to draw one frame of the timeline. */
export interface BoardState {
  arrays: Record<string, Value[]>;
  /** Banners (variables) and scalar inputs. Pointer positions live in `pointers`. */
  vars: Record<string, Value>;
  pointers: Record<string, PointerState>;
  tick: number;
  returned?: Value;
  fault?: EngineFault;
}

/** The board before any event has happened. */
export function initialState(inputs: Inputs): BoardState {
  const arrays: Record<string, Value[]> = {};
  const vars: Record<string, Value> = {};
  for (const [name, value] of Object.entries(inputs)) {
    if (Array.isArray(value)) arrays[name] = value.slice();
    else vars[name] = value;
  }
  return { arrays, vars, pointers: {}, tick: 0 };
}

/**
 * Rebuilds the board after applying events `0..upTo` (inclusive).
 * Pass `upTo = -1` for the initial board.
 */
export function stateAt(inputs: Inputs, events: readonly EngineEvent[], upTo: number): BoardState {
  const state = initialState(inputs);
  const last = Math.min(upTo, events.length - 1);
  for (let i = 0; i <= last; i += 1) applyEvent(state, events[i] as EngineEvent);
  return state;
}

/** Applies one event to a board state in place. */
export function applyEvent(state: BoardState, event: EngineEvent): void {
  state.tick = event.tick;
  switch (event.type) {
    case "var.set":
      state.vars[event.name] = event.value;
      return;
    case "agent.place":
      state.pointers[event.agent] = { array: event.array, index: event.index };
      return;
    case "agent.move":
      state.pointers[event.agent] = { array: event.array, index: event.to };
      return;
    case "array.write": {
      const arr = state.arrays[event.array];
      if (arr) arr[event.index] = event.value;
      return;
    }
    case "array.swap": {
      const arr = state.arrays[event.array];
      if (arr) {
        const tmp = arr[event.i] as Value;
        arr[event.i] = arr[event.j] as Value;
        arr[event.j] = tmp;
      }
      return;
    }
    case "return":
      state.returned = event.value;
      return;
    case "error":
      state.fault = event.fault;
      return;
    default:
      return;
  }
}
