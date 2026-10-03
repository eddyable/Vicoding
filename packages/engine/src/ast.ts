/**
 * The Battle Plan language.
 *
 * A program is a tree of cards. Every node has a stable `id` so the UI can
 * highlight the card that is executing and link it to generated code.
 */

export type NodeId = string;

/** Runtime values. Arrays hold primitives; lists appear only as return values. */
export type Value = number | string | boolean | null | Value[];

export type CompareOp = "==" | "!=" | "<" | "<=" | ">" | ">=";
export type ArithOp = "+" | "-" | "*" | "//" | "%";
export type LogicOp = "and" | "or";
export type BinaryOp = CompareOp | ArithOp | LogicOp;

export const COMPARE_OPS: readonly CompareOp[] = ["==", "!=", "<", "<=", ">", ">="];
export const ARITH_OPS: readonly ArithOp[] = ["+", "-", "*", "//", "%"];
export const LOGIC_OPS: readonly LogicOp[] = ["and", "or"];

export type Expr =
  | { kind: "num"; id: NodeId; value: number }
  | { kind: "bool"; id: NodeId; value: boolean }
  | { kind: "str"; id: NodeId; value: string }
  | { kind: "null"; id: NodeId }
  /** A named value: a banner (variable), a pointer's position, or a scalar input. */
  | { kind: "var"; id: NodeId; name: string }
  /** "value at": reads one tile of an array. */
  | { kind: "at"; id: NodeId; array: string; index: Expr }
  | { kind: "len"; id: NodeId; array: string }
  | { kind: "binary"; id: NodeId; op: BinaryOp; left: Expr; right: Expr }
  | { kind: "not"; id: NodeId; operand: Expr }
  | { kind: "neg"; id: NodeId; operand: Expr }
  | { kind: "list"; id: NodeId; items: Expr[] }
  /** An empty slot the player has not filled yet. */
  | { kind: "hole"; id: NodeId };

export interface Branch {
  cond: Expr;
  body: Stmt[];
}

export type Stmt =
  /** Raise or set a banner (variable). */
  | { kind: "set"; id: NodeId; name: string; value: Expr }
  /** Place a pointer on an array at a position. Declares the pointer. */
  | { kind: "place"; id: NodeId; pointer: string; array: string; at: Expr }
  /** Advance (+1) or retreat (-1) a pointer. */
  | { kind: "move"; id: NodeId; pointer: string; by: number }
  | { kind: "jump"; id: NodeId; pointer: string; to: Expr }
  | { kind: "swap"; id: NodeId; array: string; i: Expr; j: Expr }
  | { kind: "write"; id: NodeId; array: string; index: Expr; value: Expr }
  | { kind: "while"; id: NodeId; cond: Expr; body: Stmt[] }
  /** A pointer sweeps the array from the first tile to the last. */
  | { kind: "forEach"; id: NodeId; pointer: string; array: string; body: Stmt[] }
  | { kind: "if"; id: NodeId; branches: Branch[]; otherwise?: Stmt[] }
  | { kind: "return"; id: NodeId; value: Expr }
  | { kind: "break"; id: NodeId }
  | { kind: "continue"; id: NodeId };

export type StmtKind = Stmt["kind"];
export type ExprKind = Expr["kind"];

export interface Program {
  body: Stmt[];
}

/** Visits every statement in the program, depth first. */
export function walkStmts(stmts: readonly Stmt[], visit: (stmt: Stmt, loopDepth: number) => void, loopDepth = 0): void {
  for (const stmt of stmts) {
    visit(stmt, loopDepth);
    switch (stmt.kind) {
      case "while":
      case "forEach":
        walkStmts(stmt.body, visit, loopDepth + 1);
        break;
      case "if":
        for (const branch of stmt.branches) walkStmts(branch.body, visit, loopDepth);
        if (stmt.otherwise) walkStmts(stmt.otherwise, visit, loopDepth);
        break;
      default:
        break;
    }
  }
}

/** Expressions held directly by a statement (not nested statements). */
export function stmtExprs(stmt: Stmt): Expr[] {
  switch (stmt.kind) {
    case "set":
      return [stmt.value];
    case "place":
      return [stmt.at];
    case "jump":
      return [stmt.to];
    case "swap":
      return [stmt.i, stmt.j];
    case "write":
      return [stmt.index, stmt.value];
    case "while":
      return [stmt.cond];
    case "if":
      return stmt.branches.map((b) => b.cond);
    case "return":
      return [stmt.value];
    case "move":
    case "forEach":
    case "break":
    case "continue":
      return [];
  }
}

/** Visits an expression tree, depth first. */
export function walkExpr(expr: Expr, visit: (expr: Expr) => void): void {
  visit(expr);
  switch (expr.kind) {
    case "at":
      walkExpr(expr.index, visit);
      break;
    case "binary":
      walkExpr(expr.left, visit);
      walkExpr(expr.right, visit);
      break;
    case "not":
    case "neg":
      walkExpr(expr.operand, visit);
      break;
    case "list":
      for (const item of expr.items) walkExpr(item, visit);
      break;
    default:
      break;
  }
}

/** Number of cards (statements) in a plan; used for the "par" star. */
export function countCards(program: Program): number {
  let count = 0;
  walkStmts(program.body, () => {
    count += 1;
  });
  return count;
}
