import { walkStmts, type BinaryOp, type Expr, type NodeId, type Program, type Stmt } from "@vicoding/engine";

/**
 * Turns a Battle Plan into real code (the Spell Scroll). Every line remembers
 * the card it came from, so tapping a line can highlight the card and the
 * running card can highlight its line.
 */

export type Language = "python" | "javascript";

export interface CodeLine {
  text: string;
  indent: number;
  /** The card this line comes from (closing braces have none). */
  node?: NodeId;
}

export interface CodegenOptions {
  language: Language;
  /** Function name, written in the language's style by the caller. */
  name: string;
  /** Input names, in order. */
  params: string[];
}

export function generate(program: Program, options: CodegenOptions): CodeLine[] {
  return options.language === "python" ? python(program, options) : javascript(program, options);
}

export function toSource(lines: readonly CodeLine[], indentUnit = "    "): string {
  return lines.map((line) => indentUnit.repeat(line.indent) + line.text).join("\n") + "\n";
}

// ── expressions ──────────────────────────────────────────────────────────────

/** Higher binds tighter. */
const PRECEDENCE: Record<BinaryOp, number> = {
  or: 1,
  and: 2,
  "==": 4,
  "!=": 4,
  "<": 4,
  "<=": 4,
  ">": 4,
  ">=": 4,
  "+": 5,
  "-": 5,
  "*": 6,
  "//": 6,
  "%": 6,
};
const UNARY = 7;
const ATOM = 9;

interface Dialect {
  op: (op: BinaryOp) => string;
  not: string;
  null: string;
  bool: (value: boolean) => string;
  len: (array: string) => string;
  floorDiv?: (left: string, right: string) => string;
}

const PY: Dialect = {
  op: (op) => op,
  not: "not ",
  null: "None",
  bool: (v) => (v ? "True" : "False"),
  len: (a) => `len(${a})`,
};

const JS: Dialect = {
  op: (op) => ({ and: "&&", or: "||", "==": "===", "!=": "!==" })[op as string] ?? op,
  not: "!",
  null: "null",
  bool: (v) => String(v),
  len: (a) => `${a}.length`,
  floorDiv: (l, r) => `Math.floor(${l} / ${r})`,
};

function expr(e: Expr, d: Dialect, parent = 0): string {
  const wrap = (text: string, own: number) => (own < parent ? `(${text})` : text);
  switch (e.kind) {
    case "num":
      return e.value < 0 ? wrap(String(e.value), UNARY) : String(e.value);
    case "str":
      return JSON.stringify(e.value);
    case "bool":
      return d.bool(e.value);
    case "null":
      return d.null;
    case "var":
      return e.name;
    case "at":
      return `${e.array}[${expr(e.index, d)}]`;
    case "len":
      return d.len(e.array);
    case "list":
      return `[${e.items.map((item) => expr(item, d)).join(", ")}]`;
    case "not":
      return wrap(`${d.not}${expr(e.operand, d, UNARY)}`, UNARY);
    case "neg":
      return wrap(`-${expr(e.operand, d, UNARY)}`, UNARY);
    case "hole":
      return "___";
    case "binary": {
      if (e.op === "//" && d.floorDiv) return d.floorDiv(expr(e.left, d), expr(e.right, d));
      const own = PRECEDENCE[e.op];
      // Left-associative: the right operand needs parentheses at equal precedence.
      return wrap(`${expr(e.left, d, own)} ${d.op(e.op)} ${expr(e.right, d, own + 1)}`, own);
    }
  }
}

// ── Python ───────────────────────────────────────────────────────────────────

function python(program: Program, { name, params }: CodegenOptions): CodeLine[] {
  const lines: CodeLine[] = [{ text: `def ${name}(${params.join(", ")}):`, indent: 0 }];
  const e = (x: Expr) => expr(x, PY);

  const block = (stmts: readonly Stmt[], indent: number): void => {
    if (stmts.length === 0) lines.push({ text: "pass", indent });
    for (const s of stmts) {
      const line = (text: string, at = indent) => lines.push({ text, indent: at, node: s.id });
      switch (s.kind) {
        case "set":
          line(`${s.name} = ${e(s.value)}`);
          break;
        case "place":
          line(`${s.pointer} = ${e(s.at)}`);
          break;
        case "move":
          line(`${s.pointer} ${s.by >= 0 ? "+" : "-"}= ${Math.abs(s.by)}`);
          break;
        case "jump":
          line(`${s.pointer} = ${e(s.to)}`);
          break;
        case "swap": {
          const i = e(s.i);
          const j = e(s.j);
          line(`${s.array}[${i}], ${s.array}[${j}] = ${s.array}[${j}], ${s.array}[${i}]`);
          break;
        }
        case "write":
          line(`${s.array}[${e(s.index)}] = ${e(s.value)}`);
          break;
        case "while":
          line(`while ${e(s.cond)}:`);
          block(s.body, indent + 1);
          break;
        case "forEach":
          line(`for ${s.pointer} in range(len(${s.array})):`);
          block(s.body, indent + 1);
          break;
        case "if":
          s.branches.forEach((branch, k) => {
            line(`${k === 0 ? "if" : "elif"} ${e(branch.cond)}:`);
            block(branch.body, indent + 1);
          });
          if (s.otherwise) {
            line("else:");
            block(s.otherwise, indent + 1);
          }
          break;
        case "return":
          line(`return ${e(s.value)}`);
          break;
        case "break":
          line("break");
          break;
        case "continue":
          line("continue");
          break;
      }
    }
  };

  block(program.body, 1);
  return lines;
}

// ── JavaScript ───────────────────────────────────────────────────────────────

/**
 * Names whose first assignment is nested inside a block must be declared at
 * the top of the function so they stay visible after the block ends.
 */
function hoistedNames(program: Program): { hoisted: string[]; topLevel: Set<NodeId> } {
  const firstAssignment = new Map<string, { node: NodeId; depth: number }>();
  const topLevelIds = new Set(program.body.map((s) => s.id));
  walkStmts(program.body, (s) => {
    const name = s.kind === "set" ? s.name : s.kind === "place" || s.kind === "forEach" ? s.pointer : undefined;
    if (name !== undefined && !firstAssignment.has(name)) {
      firstAssignment.set(name, { node: s.id, depth: topLevelIds.has(s.id) ? 0 : 1 });
    }
  });
  const hoisted: string[] = [];
  const topLevel = new Set<NodeId>();
  for (const [name, first] of firstAssignment) {
    if (first.depth === 0) topLevel.add(first.node);
    else hoisted.push(name);
  }
  return { hoisted, topLevel };
}

function javascript(program: Program, { name, params }: CodegenOptions): CodeLine[] {
  const lines: CodeLine[] = [{ text: `function ${name}(${params.join(", ")}) {`, indent: 0 }];
  const { hoisted, topLevel } = hoistedNames(program);
  const e = (x: Expr) => expr(x, JS);
  if (hoisted.length > 0) lines.push({ text: `let ${hoisted.join(", ")};`, indent: 1 });

  const block = (stmts: readonly Stmt[], indent: number): void => {
    for (const s of stmts) {
      const line = (text: string, at = indent, node: NodeId | undefined = s.id) =>
        lines.push(node === undefined ? { text, indent: at } : { text, indent: at, node });
      const declare = topLevel.has(s.id) ? "let " : "";
      switch (s.kind) {
        case "set":
          line(`${declare}${s.name} = ${e(s.value)};`);
          break;
        case "place":
          line(`${declare}${s.pointer} = ${e(s.at)};`);
          break;
        case "move":
          line(`${s.pointer} ${s.by >= 0 ? "+" : "-"}= ${Math.abs(s.by)};`);
          break;
        case "jump":
          line(`${s.pointer} = ${e(s.to)};`);
          break;
        case "swap": {
          const i = e(s.i);
          const j = e(s.j);
          line(`[${s.array}[${i}], ${s.array}[${j}]] = [${s.array}[${j}], ${s.array}[${i}]];`);
          break;
        }
        case "write":
          line(`${s.array}[${e(s.index)}] = ${e(s.value)};`);
          break;
        case "while":
          line(`while (${e(s.cond)}) {`);
          block(s.body, indent + 1);
          line("}", indent, undefined);
          break;
        case "forEach": {
          const v = hoisted.includes(s.pointer) || !topLevel.has(s.id) ? "" : "let ";
          line(`for (${v}${s.pointer} = 0; ${s.pointer} < ${s.array}.length; ${s.pointer}++) {`);
          block(s.body, indent + 1);
          line("}", indent, undefined);
          break;
        }
        case "if":
          s.branches.forEach((branch, k) => {
            line(`${k === 0 ? "if" : "} else if"} (${e(branch.cond)}) {`);
            block(branch.body, indent + 1);
          });
          if (s.otherwise) {
            line("} else {");
            block(s.otherwise, indent + 1);
          }
          line("}", indent, undefined);
          break;
        case "return":
          line(`return ${e(s.value)};`);
          break;
        case "break":
          line("break;");
          break;
        case "continue":
          line("continue;");
          break;
      }
    }
  };

  block(program.body, 1);
  lines.push({ text: "}", indent: 0 });
  return lines;
}

/** "The Bridge of Planks" → `bridge_of_planks` (Python) or `bridgeOfPlanks` (JavaScript). */
export function functionName(title: string, language: Language): string {
  const words = title
    .replace(/^the\s+/i, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  if (words.length === 0) return "solution";
  return language === "python" ? words.join("_") : words.map((w, i) => (i === 0 ? w : w[0]!.toUpperCase() + w.slice(1))).join("");
}
