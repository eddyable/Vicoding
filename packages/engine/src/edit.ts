import { stmtExprs, walkExpr, walkStmts, type Branch, type Expr, type NodeId, type Program, type Stmt } from "./ast.ts";

/**
 * Pure, immutable editing operations on a plan, used by the card editor.
 * Every function returns a new Program and leaves its input untouched.
 */

/** Where a card list lives: the top level, a loop body, an if branch, or an if's "otherwise". */
export type ContainerRef =
  | { kind: "root" }
  | { kind: "body"; stmt: NodeId }
  | { kind: "branch"; stmt: NodeId; branch: number }
  | { kind: "otherwise"; stmt: NodeId };

export function containerKey(ref: ContainerRef): string {
  switch (ref.kind) {
    case "root":
      return "root";
    case "body":
      return `${ref.stmt}:body`;
    case "branch":
      return `${ref.stmt}:branch:${ref.branch}`;
    case "otherwise":
      return `${ref.stmt}:otherwise`;
  }
}

/** Applies `fn` to the card list identified by `ref`. */
function editContainer(program: Program, ref: ContainerRef, fn: (stmts: Stmt[]) => Stmt[]): Program {
  if (ref.kind === "root") return { body: fn(program.body) };
  const visit = (stmts: Stmt[]): Stmt[] =>
    stmts.map((stmt) => {
      if (stmt.id === ref.stmt) {
        if (ref.kind === "body" && (stmt.kind === "while" || stmt.kind === "forEach")) return { ...stmt, body: fn(stmt.body) };
        if (ref.kind === "branch" && stmt.kind === "if") {
          return { ...stmt, branches: stmt.branches.map((b, i) => (i === ref.branch ? { ...b, body: fn(b.body) } : b)) };
        }
        if (ref.kind === "otherwise" && stmt.kind === "if" && stmt.otherwise) return { ...stmt, otherwise: fn(stmt.otherwise) };
        return stmt;
      }
      return mapChildren(stmt, visit);
    });
  return { body: visit(program.body) };
}

/** Rebuilds a statement with its nested card lists transformed by `visit`. */
function mapChildren(stmt: Stmt, visit: (stmts: Stmt[]) => Stmt[]): Stmt {
  switch (stmt.kind) {
    case "while":
    case "forEach":
      return { ...stmt, body: visit(stmt.body) };
    case "if": {
      const branches: Branch[] = stmt.branches.map((b) => ({ ...b, body: visit(b.body) }));
      return stmt.otherwise ? { ...stmt, branches, otherwise: visit(stmt.otherwise) } : { ...stmt, branches };
    }
    default:
      return stmt;
  }
}

export function insertStmt(program: Program, ref: ContainerRef, index: number, stmt: Stmt): Program {
  return editContainer(program, ref, (stmts) => {
    const at = Math.max(0, Math.min(index, stmts.length));
    return [...stmts.slice(0, at), stmt, ...stmts.slice(at)];
  });
}

export function removeStmt(program: Program, id: NodeId): Program {
  const visit = (stmts: Stmt[]): Stmt[] => stmts.filter((s) => s.id !== id).map((s) => mapChildren(s, visit));
  return { body: visit(program.body) };
}

export function findStmt(program: Program, id: NodeId): Stmt | undefined {
  let found: Stmt | undefined;
  walkStmts(program.body, (stmt) => {
    if (stmt.id === id) found = stmt;
  });
  return found;
}

/** Finds the container and index of a card. */
export function locateStmt(program: Program, id: NodeId): { ref: ContainerRef; index: number } | undefined {
  const search = (stmts: Stmt[], ref: ContainerRef): { ref: ContainerRef; index: number } | undefined => {
    for (const [index, stmt] of stmts.entries()) {
      if (stmt.id === id) return { ref, index };
      let hit: { ref: ContainerRef; index: number } | undefined;
      if (stmt.kind === "while" || stmt.kind === "forEach") hit = search(stmt.body, { kind: "body", stmt: stmt.id });
      if (stmt.kind === "if") {
        for (const [i, b] of stmt.branches.entries()) hit ??= search(b.body, { kind: "branch", stmt: stmt.id, branch: i });
        if (stmt.otherwise) hit ??= search(stmt.otherwise, { kind: "otherwise", stmt: stmt.id });
      }
      if (hit) return hit;
    }
    return undefined;
  };
  return search(program.body, { kind: "root" });
}

/** True if `ref` is inside the card `id` (a card can't be moved into itself). */
function isInside(program: Program, ref: ContainerRef, id: NodeId): boolean {
  if (ref.kind === "root") return false;
  if (ref.stmt === id) return true;
  const parent = locateStmt(program, ref.stmt);
  return parent ? isInside(program, parent.ref, id) : false;
}

/** Moves a card to `index` in `ref` (index is counted before the card is removed). */
export function moveStmt(program: Program, id: NodeId, ref: ContainerRef, index: number): Program {
  const stmt = findStmt(program, id);
  const from = locateStmt(program, id);
  if (!stmt || !from || isInside(program, ref, id)) return program;
  const sameContainer = containerKey(from.ref) === containerKey(ref);
  const target = sameContainer && from.index < index ? index - 1 : index;
  return insertStmt(removeStmt(program, id), ref, target, stmt);
}

export function updateStmt(program: Program, id: NodeId, update: (stmt: Stmt) => Stmt): Program {
  const visit = (stmts: Stmt[]): Stmt[] => stmts.map((s) => (s.id === id ? update(s) : mapChildren(s, visit)));
  return { body: visit(program.body) };
}

function mapExpr(expr: Expr, id: NodeId, next: Expr): Expr {
  if (expr.id === id) return next;
  switch (expr.kind) {
    case "at":
      return { ...expr, index: mapExpr(expr.index, id, next) };
    case "binary":
      return { ...expr, left: mapExpr(expr.left, id, next), right: mapExpr(expr.right, id, next) };
    case "not":
    case "neg":
      return { ...expr, operand: mapExpr(expr.operand, id, next) };
    case "list":
      return { ...expr, items: expr.items.map((item) => mapExpr(item, id, next)) };
    default:
      return expr;
  }
}

function mapStmtExprs(stmt: Stmt, f: (e: Expr) => Expr): Stmt {
  switch (stmt.kind) {
    case "set":
      return { ...stmt, value: f(stmt.value) };
    case "place":
      return { ...stmt, at: f(stmt.at) };
    case "jump":
      return { ...stmt, to: f(stmt.to) };
    case "swap":
      return { ...stmt, i: f(stmt.i), j: f(stmt.j) };
    case "write":
      return { ...stmt, index: f(stmt.index), value: f(stmt.value) };
    case "while":
      return { ...stmt, cond: f(stmt.cond) };
    case "if":
      return { ...stmt, branches: stmt.branches.map((b) => ({ ...b, cond: f(b.cond) })) };
    case "return":
      return { ...stmt, value: f(stmt.value) };
    default:
      return stmt;
  }
}

/** Replaces the expression with id `id` anywhere in the plan. */
export function replaceExpr(program: Program, id: NodeId, next: Expr): Program {
  const visit = (stmts: Stmt[]): Stmt[] => stmts.map((s) => mapChildren(mapStmtExprs(s, (e) => mapExpr(e, id, next)), visit));
  return { body: visit(program.body) };
}

export function findExpr(program: Program, id: NodeId): Expr | undefined {
  let found: Expr | undefined;
  walkStmts(program.body, (stmt) => {
    for (const root of stmtExprs(stmt)) {
      walkExpr(root, (e) => {
        if (e.id === id) found = e;
      });
    }
  });
  return found;
}

/** Names the plan declares, in order of first appearance. */
export function declaredNames(program: Program): { pointers: string[]; banners: string[] } {
  const pointers: string[] = [];
  const banners: string[] = [];
  walkStmts(program.body, (stmt) => {
    if ((stmt.kind === "place" || stmt.kind === "forEach") && !pointers.includes(stmt.pointer)) pointers.push(stmt.pointer);
    if (stmt.kind === "set" && !banners.includes(stmt.name)) banners.push(stmt.name);
  });
  return { pointers, banners };
}

/**
 * Maps every node id (cards and the expressions inside them) to the id of the
 * card that owns it. The timeline uses this to highlight the running card.
 */
export function nodeOwners(program: Program): Map<NodeId, NodeId> {
  const owners = new Map<NodeId, NodeId>();
  walkStmts(program.body, (stmt) => {
    owners.set(stmt.id, stmt.id);
    for (const root of stmtExprs(stmt)) walkExpr(root, (e) => owners.set(e.id, stmt.id));
  });
  return owners;
}
