import type { BinaryOp, Branch, Expr, Program, Stmt } from "./ast.ts";

/** An expression, or a bare string as shorthand for a variable/pointer name. */
export type ExprLike = Expr | string | number | boolean;

/**
 * Creates plan builders with deterministic ids (`${prefix}1`, `${prefix}2`, ...).
 * Used for reference plans, starter plans and tests; the editor builds the same shapes.
 */
export function createBuilder(prefix = "n") {
  let counter = 0;
  const id = () => `${prefix}${++counter}`;

  const expr = (value: ExprLike): Expr => {
    if (typeof value === "string") return { kind: "var", id: id(), name: value };
    if (typeof value === "number") return { kind: "num", id: id(), value };
    if (typeof value === "boolean") return { kind: "bool", id: id(), value };
    return value;
  };

  const binary = (op: BinaryOp) => (left: ExprLike, right: ExprLike): Expr => ({
    kind: "binary",
    id: id(),
    op,
    left: expr(left),
    right: expr(right),
  });

  return {
    program: (...body: Stmt[]): Program => ({ body }),

    // expressions
    num: (value: number): Expr => ({ kind: "num", id: id(), value }),
    bool: (value: boolean): Expr => ({ kind: "bool", id: id(), value }),
    str: (value: string): Expr => ({ kind: "str", id: id(), value }),
    nil: (): Expr => ({ kind: "null", id: id() }),
    v: (name: string): Expr => ({ kind: "var", id: id(), name }),
    /** "value at": `at("nums", "L")` reads the tile under pointer L. */
    at: (array: string, index: ExprLike): Expr => ({ kind: "at", id: id(), array, index: expr(index) }),
    len: (array: string): Expr => ({ kind: "len", id: id(), array }),
    /** Any binary operator, e.g. `bin("<", "L", "R")`. */
    bin: (op: BinaryOp, left: ExprLike, right: ExprLike): Expr => binary(op)(left, right),
    add: binary("+"),
    sub: binary("-"),
    mul: binary("*"),
    div: binary("//"),
    mod: binary("%"),
    eq: binary("=="),
    ne: binary("!="),
    lt: binary("<"),
    le: binary("<="),
    gt: binary(">"),
    ge: binary(">="),
    and: binary("and"),
    or: binary("or"),
    not: (operand: ExprLike): Expr => ({ kind: "not", id: id(), operand: expr(operand) }),
    neg: (operand: ExprLike): Expr => ({ kind: "neg", id: id(), operand: expr(operand) }),
    list: (...items: ExprLike[]): Expr => ({ kind: "list", id: id(), items: items.map(expr) }),
    hole: (): Expr => ({ kind: "hole", id: id() }),

    // statements (cards)
    set: (name: string, value: ExprLike): Stmt => ({ kind: "set", id: id(), name, value: expr(value) }),
    place: (pointer: string, array: string, at: ExprLike): Stmt => ({ kind: "place", id: id(), pointer, array, at: expr(at) }),
    advance: (pointer: string): Stmt => ({ kind: "move", id: id(), pointer, by: 1 }),
    retreat: (pointer: string): Stmt => ({ kind: "move", id: id(), pointer, by: -1 }),
    jump: (pointer: string, to: ExprLike): Stmt => ({ kind: "jump", id: id(), pointer, to: expr(to) }),
    swap: (array: string, i: ExprLike, j: ExprLike): Stmt => ({ kind: "swap", id: id(), array, i: expr(i), j: expr(j) }),
    write: (array: string, index: ExprLike, value: ExprLike): Stmt => ({
      kind: "write",
      id: id(),
      array,
      index: expr(index),
      value: expr(value),
    }),
    whileLoop: (cond: ExprLike, ...body: Stmt[]): Stmt => ({ kind: "while", id: id(), cond: expr(cond), body }),
    forEach: (pointer: string, array: string, ...body: Stmt[]): Stmt => ({ kind: "forEach", id: id(), pointer, array, body }),
    /** `when(cond, ...body)` creates one branch for `iff`. */
    when: (cond: ExprLike, ...body: Stmt[]): Branch => ({ cond: expr(cond), body }),
    iff: (branches: Branch[], otherwise?: Stmt[]): Stmt =>
      otherwise ? { kind: "if", id: id(), branches, otherwise } : { kind: "if", id: id(), branches },
    ret: (value: ExprLike): Stmt => ({ kind: "return", id: id(), value: expr(value) }),
    brk: (): Stmt => ({ kind: "break", id: id() }),
    cont: (): Stmt => ({ kind: "continue", id: id() }),
  };
}

export type PlanBuilder = ReturnType<typeof createBuilder>;
