import type { ArithOp, CompareOp, Expr, NodeId, Program, Stmt, Value } from "./ast.ts";
import { EngineError, type EngineFault } from "./errors.ts";
import type { EngineEvent, EventPayload } from "./events.ts";

export type Inputs = Record<string, Value>;

export interface RunOptions {
  /** Hard cap on operations; exceeding it ends the run with TICK_LIMIT. */
  maxTicks?: number;
  /** Stop recording (but keep running) after this many events. */
  maxEvents?: number;
  /** Record events. Turn off for large inputs where only the result and tick count matter. */
  record?: boolean;
}

export type Outcome =
  | { kind: "returned"; value: Value }
  /** The plan ran to the end without a Victory card. */
  | { kind: "completed" }
  | { kind: "error"; fault: EngineFault };

export interface RunResult {
  outcome: Outcome;
  /** Operations spent (the stamina cost). */
  ticks: number;
  /** Total loop rounds across all loops. */
  rounds: number;
  events: EngineEvent[];
  /** True when recording stopped early because of `maxEvents`. */
  truncated: boolean;
  finalArrays: Record<string, Value[]>;
  finalVars: Record<string, Value>;
}

export const DEFAULT_MAX_TICKS = 5_000_000;
export const DEFAULT_MAX_EVENTS = 100_000;

class ReturnSignal {
  constructor(readonly value: Value) {}
}
const BREAK = Symbol("break");
const CONTINUE = Symbol("continue");

/** Runs a plan against inputs. Array inputs become tile rows; other inputs become read-only banners. */
export function run(program: Program, inputs: Inputs, options: RunOptions = {}): RunResult {
  const interpreter = new Interpreter({
    maxTicks: options.maxTicks ?? DEFAULT_MAX_TICKS,
    maxEvents: options.maxEvents ?? DEFAULT_MAX_EVENTS,
    record: options.record ?? true,
  });
  return interpreter.run(program, inputs);
}

class Interpreter {
  private ticks = 0;
  private rounds = 0;
  private loopDepth = 0;
  private truncated = false;
  private readonly events: EngineEvent[] = [];
  private readonly vars = new Map<string, Value>();
  private readonly arrays = new Map<string, Value[]>();
  /** Pointer name → the array it walks on. */
  private readonly pointers = new Map<string, string>();

  constructor(private readonly opts: Required<RunOptions>) {}

  run(program: Program, inputs: Inputs): RunResult {
    for (const [name, value] of Object.entries(inputs)) {
      if (Array.isArray(value)) this.arrays.set(name, value.slice());
      else this.vars.set(name, value);
    }

    let outcome: Outcome;
    try {
      this.execBlock(program.body);
      outcome = { kind: "completed" };
    } catch (signal) {
      if (signal instanceof ReturnSignal) {
        outcome = { kind: "returned", value: signal.value };
      } else if (signal instanceof EngineError) {
        const fault = signal.toFault();
        this.emit(fault.node, { type: "error", fault });
        outcome = { kind: "error", fault };
      } else {
        throw signal;
      }
    }

    return {
      outcome,
      ticks: this.ticks,
      rounds: this.rounds,
      events: this.events,
      truncated: this.truncated,
      finalArrays: Object.fromEntries(this.arrays),
      finalVars: Object.fromEntries(this.vars),
    };
  }

  // ── bookkeeping ────────────────────────────────────────────────────────────

  private emit(node: NodeId, payload: EventPayload): void {
    if (!this.opts.record) return;
    if (this.events.length >= this.opts.maxEvents) {
      this.truncated = true;
      return;
    }
    this.events.push({ ...payload, seq: this.events.length, tick: this.ticks, node } as EngineEvent);
  }

  private spend(node: NodeId, cost = 1): void {
    this.ticks += cost;
    if (this.ticks > this.opts.maxTicks) {
      throw new EngineError(
        "TICK_LIMIT",
        `Ouroboros! The plan ran more than ${this.opts.maxTicks.toLocaleString("en-US")} steps. Is a pointer stuck, or does a loop never end?`,
        node,
        { maxTicks: this.opts.maxTicks },
      );
    }
  }

  private array(name: string, node: NodeId): Value[] {
    const arr = this.arrays.get(name);
    if (!arr) throw new EngineError("UNKNOWN_ARRAY", `There is no row of tiles called "${name}".`, node, { array: name });
    return arr;
  }

  private pointerArray(pointer: string, node: NodeId): string {
    const array = this.pointers.get(pointer);
    if (array === undefined) {
      throw new EngineError("NOT_A_POINTER", `"${pointer}" is not a pointer. Place it on a row of tiles first.`, node, { name: pointer });
    }
    return array;
  }

  private checkBounds(arrayName: string, arr: Value[], index: number, node: NodeId, indexExpr?: Expr): void {
    if (index >= 0 && index < arr.length) return;
    const who = indexExpr?.kind === "var" ? `"${indexExpr.name}"` : "The plan";
    const range = arr.length === 0 ? `"${arrayName}" has no tiles at all` : `"${arrayName}" only has tiles 0–${arr.length - 1}`;
    throw new EngineError("OUT_OF_BOUNDS", `Off-by-One Imp! ${who} reached for tile ${index}, but ${range}.`, node, {
      array: arrayName,
      index,
      length: arr.length,
      pointer: indexExpr?.kind === "var" ? indexExpr.name : undefined,
    });
  }

  // ── statements ─────────────────────────────────────────────────────────────

  private execBlock(stmts: readonly Stmt[]): void {
    for (const stmt of stmts) this.exec(stmt);
  }

  private exec(stmt: Stmt): void {
    switch (stmt.kind) {
      case "set": {
        if (this.pointers.has(stmt.name)) {
          throw new EngineError("TYPE_ERROR", `"${stmt.name}" is a pointer. Use jump to move it.`, stmt.id, { name: stmt.name });
        }
        const value = this.eval(stmt.value);
        const prev = this.vars.get(stmt.name);
        this.spend(stmt.id);
        this.vars.set(stmt.name, value);
        this.emit(stmt.id, { type: "var.set", name: stmt.name, value, prev });
        return;
      }
      case "place":
        this.place(stmt.id, stmt.pointer, stmt.array, this.evalIndex(stmt.at));
        return;
      case "move": {
        const array = this.pointerArray(stmt.pointer, stmt.id);
        const from = this.vars.get(stmt.pointer) as number;
        const to = from + stmt.by;
        this.spend(stmt.id);
        this.vars.set(stmt.pointer, to);
        this.emit(stmt.id, { type: "agent.move", agent: stmt.pointer, array, from, to });
        return;
      }
      case "jump": {
        const array = this.pointerArray(stmt.pointer, stmt.id);
        const to = this.evalIndex(stmt.to);
        const from = this.vars.get(stmt.pointer) as number;
        this.spend(stmt.id);
        this.vars.set(stmt.pointer, to);
        this.emit(stmt.id, { type: "agent.move", agent: stmt.pointer, array, from, to });
        return;
      }
      case "swap": {
        const arr = this.array(stmt.array, stmt.id);
        const i = this.evalIndex(stmt.i);
        const j = this.evalIndex(stmt.j);
        this.checkBounds(stmt.array, arr, i, stmt.id, stmt.i);
        this.checkBounds(stmt.array, arr, j, stmt.id, stmt.j);
        this.spend(stmt.id);
        const tmp = arr[i] as Value;
        arr[i] = arr[j] as Value;
        arr[j] = tmp;
        this.emit(stmt.id, { type: "array.swap", array: stmt.array, i, j });
        return;
      }
      case "write": {
        const arr = this.array(stmt.array, stmt.id);
        const index = this.evalIndex(stmt.index);
        const value = this.eval(stmt.value);
        this.checkBounds(stmt.array, arr, index, stmt.id, stmt.index);
        this.spend(stmt.id);
        const prev = arr[index] as Value;
        arr[index] = value;
        this.emit(stmt.id, { type: "array.write", array: stmt.array, index, value, prev });
        return;
      }
      case "while":
        this.loop(stmt.id, () => this.evalBool(stmt.cond), stmt.body);
        return;
      case "forEach": {
        const arr = this.array(stmt.array, stmt.id);
        this.place(stmt.id, stmt.pointer, stmt.array, 0);
        this.loop(
          stmt.id,
          () => {
            const index = this.vars.get(stmt.pointer) as number;
            const result = index < arr.length;
            this.spend(stmt.id);
            this.emit(stmt.id, { type: "compare", op: "<", left: index, right: arr.length, result });
            return result;
          },
          stmt.body,
          () => this.exec({ kind: "move", id: stmt.id, pointer: stmt.pointer, by: 1 }),
        );
        return;
      }
      case "if": {
        for (const [index, branch] of stmt.branches.entries()) {
          if (this.evalBool(branch.cond)) {
            this.emit(stmt.id, { type: "branch", taken: index });
            this.execBlock(branch.body);
            return;
          }
        }
        if (stmt.otherwise) {
          this.emit(stmt.id, { type: "branch", taken: "otherwise" });
          this.execBlock(stmt.otherwise);
        } else {
          this.emit(stmt.id, { type: "branch", taken: "none" });
        }
        return;
      }
      case "return": {
        const value = this.eval(stmt.value);
        this.spend(stmt.id);
        this.emit(stmt.id, { type: "return", value });
        throw new ReturnSignal(value);
      }
      case "break":
      case "continue":
        if (this.loopDepth === 0) {
          throw new EngineError("BREAK_OUTSIDE_LOOP", `"${stmt.kind}" only works inside a loop.`, stmt.id);
        }
        throw stmt.kind === "break" ? BREAK : CONTINUE;
    }
  }

  private place(node: NodeId, pointer: string, arrayName: string, index: number): void {
    this.array(arrayName, node);
    if (this.vars.has(pointer) && !this.pointers.has(pointer)) {
      throw new EngineError("TYPE_ERROR", `"${pointer}" is already a banner, so it can't also be a pointer.`, node, { name: pointer });
    }
    const prev = this.pointers.has(pointer) ? (this.vars.get(pointer) as number) : undefined;
    this.spend(node);
    this.vars.set(pointer, index);
    this.pointers.set(pointer, arrayName);
    this.emit(node, { type: "agent.place", agent: pointer, array: arrayName, index, prev });
  }

  private loop(node: NodeId, cond: () => boolean, body: readonly Stmt[], afterRound?: () => void): void {
    this.loopDepth += 1;
    let round = 0;
    try {
      while (cond()) {
        round += 1;
        this.rounds += 1;
        this.emit(node, { type: "loop.round", round, depth: this.loopDepth });
        try {
          this.execBlock(body);
        } catch (signal) {
          if (signal === BREAK) break;
          if (signal !== CONTINUE) throw signal;
        }
        afterRound?.();
      }
    } finally {
      this.loopDepth -= 1;
    }
  }

  // ── expressions ────────────────────────────────────────────────────────────

  private eval(expr: Expr): Value {
    switch (expr.kind) {
      case "num":
      case "bool":
      case "str":
        return expr.value;
      case "null":
        return null;
      case "var": {
        if (!this.vars.has(expr.name)) {
          if (this.arrays.has(expr.name)) {
            throw new EngineError("TYPE_ERROR", `"${expr.name}" is a row of tiles. Use "value at" to read one tile.`, expr.id, {
              name: expr.name,
            });
          }
          throw new EngineError("UNDEFINED_VARIABLE", `"${expr.name}" was used before it was given a value.`, expr.id, {
            name: expr.name,
          });
        }
        return this.vars.get(expr.name) as Value;
      }
      case "at": {
        const arr = this.array(expr.array, expr.id);
        const index = this.evalIndex(expr.index);
        this.checkBounds(expr.array, arr, index, expr.id, expr.index);
        this.spend(expr.id);
        const value = arr[index] as Value;
        this.emit(expr.id, { type: "array.read", array: expr.array, index, value });
        return value;
      }
      case "len":
        return this.array(expr.array, expr.id).length;
      case "binary":
        return this.evalBinary(expr);
      case "not": {
        const result = !this.evalBool(expr.operand);
        this.spend(expr.id);
        this.emit(expr.id, { type: "logic", op: "not", result });
        return result;
      }
      case "neg":
        return -this.evalNumber(expr.operand);
      case "list":
        return expr.items.map((item) => this.eval(item));
      case "hole":
        throw new EngineError("HOLE", "This slot is still empty. Fill it before running.", expr.id);
    }
  }

  private evalBinary(expr: Extract<Expr, { kind: "binary" }>): Value {
    const { op, id } = expr;
    if (op === "and" || op === "or") {
      const left = this.evalBool(expr.left);
      const result = op === "and" ? left && this.evalBool(expr.right) : left || this.evalBool(expr.right);
      this.spend(id);
      this.emit(id, { type: "logic", op, result });
      return result;
    }

    if (op === "+" || op === "-" || op === "*" || op === "//" || op === "%") {
      const left = this.evalNumber(expr.left);
      const right = this.evalNumber(expr.right);
      const result = arith(op, left, right, id);
      this.spend(id);
      this.emit(id, { type: "arith", op, left, right, result });
      return result;
    }

    const left = this.eval(expr.left);
    const right = this.eval(expr.right);
    const result = compare(op, left, right, id);
    this.spend(id);
    this.emit(id, { type: "compare", op, left, right, result });
    return result;
  }

  private evalNumber(expr: Expr): number {
    const value = this.eval(expr);
    if (typeof value !== "number") {
      throw new EngineError("TYPE_ERROR", `Expected a number here, but got ${describe(value)}.`, expr.id, { value });
    }
    return value;
  }

  private evalIndex(expr: Expr): number {
    const value = this.evalNumber(expr);
    if (!Number.isInteger(value)) {
      throw new EngineError("TYPE_ERROR", `Tile positions must be whole numbers, but got ${value}.`, expr.id, { value });
    }
    return value;
  }

  private evalBool(expr: Expr): boolean {
    const value = this.eval(expr);
    if (typeof value !== "boolean") {
      throw new EngineError("TYPE_ERROR", `Expected yes/no here, but got ${describe(value)}.`, expr.id, { value });
    }
    return value;
  }
}

function arith(op: ArithOp, a: number, b: number, node: NodeId): number {
  switch (op) {
    case "+":
      return a + b;
    case "-":
      return a - b;
    case "*":
      return a * b;
    case "//":
    case "%": {
      if (b === 0) throw new EngineError("DIVISION_BY_ZERO", "Division by zero.", node);
      // Python semantics: floor division, and a remainder with the divisor's sign.
      return op === "//" ? Math.floor(a / b) : a - b * Math.floor(a / b);
    }
  }
}

function compare(op: CompareOp, a: Value, b: Value, node: NodeId): boolean {
  if (op === "==") return valuesEqual(a, b);
  if (op === "!=") return !valuesEqual(a, b);
  const ordered = (typeof a === "number" && typeof b === "number") || (typeof a === "string" && typeof b === "string");
  if (!ordered) {
    throw new EngineError("TYPE_ERROR", `Can't compare ${describe(a)} with ${describe(b)} using "${op}".`, node, { left: a, right: b });
  }
  const x = a as number | string;
  const y = b as number | string;
  switch (op) {
    case "<":
      return x < y;
    case "<=":
      return x <= y;
    case ">":
      return x > y;
    case ">=":
      return x >= y;
  }
}

/** Structural equality for values, including lists. */
export function valuesEqual(a: Value, b: Value): boolean {
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((item, i) => valuesEqual(item, b[i] as Value));
  }
  return a === b;
}

function describe(value: Value): string {
  if (value === null) return "nothing (null)";
  if (Array.isArray(value)) return "a list";
  if (typeof value === "string") return `the text "${value}"`;
  return `${typeof value === "boolean" ? "yes/no value" : "number"} ${String(value)}`;
}
