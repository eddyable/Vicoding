import { stmtExprs, walkExpr, walkStmts, type Expr, type NodeId, type Program } from "./ast.ts";
import type { ErrorCode } from "./errors.ts";

export interface ValidationIssue {
  code: ErrorCode;
  node: NodeId;
  message: string;
}

export interface ValidationContext {
  /** Names of array inputs (tile rows). */
  arrays: readonly string[];
  /** Names of scalar inputs (e.g. `target`). */
  scalars: readonly string[];
}

/**
 * Static checks run before a plan is allowed to start, so that obviously
 * unfinished plans are flagged on the cards instead of failing mid-battle.
 */
export function validate(program: Program, context: ValidationContext): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const arrays = new Set(context.arrays);
  const pointers = new Set<string>();
  const assigned = new Set<string>(context.scalars);

  walkStmts(program.body, (stmt) => {
    if (stmt.kind === "set") assigned.add(stmt.name);
    if (stmt.kind === "place" || stmt.kind === "forEach") {
      pointers.add(stmt.pointer);
      assigned.add(stmt.pointer);
    }
  });

  const checkArray = (name: string, node: NodeId): void => {
    if (!arrays.has(name)) issues.push({ code: "UNKNOWN_ARRAY", node, message: `There is no row of tiles called "${name}".` });
  };

  const checkExpr = (expr: Expr): void => {
    walkExpr(expr, (e) => {
      if (e.kind === "hole") issues.push({ code: "HOLE", node: e.id, message: "This slot is still empty." });
      if (e.kind === "at" || e.kind === "len") checkArray(e.array, e.id);
      if (e.kind === "var" && !assigned.has(e.name)) {
        issues.push({ code: "UNDEFINED_VARIABLE", node: e.id, message: `"${e.name}" is never given a value.` });
      }
    });
  };

  walkStmts(program.body, (stmt, loopDepth) => {
    for (const expr of stmtExprs(stmt)) checkExpr(expr);
    switch (stmt.kind) {
      case "place":
      case "forEach":
      case "swap":
      case "write":
        checkArray(stmt.array, stmt.id);
        break;
      case "move":
      case "jump":
        if (!pointers.has(stmt.pointer)) {
          issues.push({ code: "NOT_A_POINTER", node: stmt.id, message: `"${stmt.pointer}" is never placed on a row of tiles.` });
        }
        break;
      case "break":
      case "continue":
        if (loopDepth === 0) {
          issues.push({ code: "BREAK_OUTSIDE_LOOP", node: stmt.id, message: `"${stmt.kind}" only works inside a loop.` });
        }
        break;
      default:
        break;
    }
  });

  return issues;
}
