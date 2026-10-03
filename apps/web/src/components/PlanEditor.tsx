import {
  containerKey,
  declaredNames,
  insertStmt,
  moveStmt,
  removeStmt,
  replaceExpr,
  updateStmt,
  type ContainerRef,
  type Expr,
  type NodeId,
  type Program,
  type Stmt,
  type StmtKind,
} from "@vicoding/engine";
import type { LevelDefinition } from "@vicoding/levels";
import { createContext, useContext, useState, type DragEvent, type ReactNode } from "react";
import { CARD_TEMPLATES, isValidName, newCard } from "../game/templates.ts";
import { ExprPicker } from "./ExprPicker.tsx";

type Picking = { kind: "new"; stmt: StmtKind } | { kind: "move"; id: NodeId };

interface EditorContextValue {
  program: Program;
  readOnly: boolean;
  arrays: string[];
  activeCard: NodeId | undefined;
  errorNodes: ReadonlySet<NodeId>;
  issueNodes: ReadonlySet<NodeId>;
  picking: Picking | null;
  setPicking: (p: Picking | null) => void;
  commit: (next: Program) => void;
  openExpr: (id: NodeId) => void;
  place: (ref: ContainerRef, index: number, picking: Picking) => void;
}

const EditorContext = createContext<EditorContextValue | null>(null);
const useEditor = () => {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error("useEditor outside PlanEditor");
  return ctx;
};

const DRAG_MIME = "application/x-vicoding-card";

export interface PlanEditorProps {
  program: Program;
  onChange: (next: Program) => void;
  level: LevelDefinition;
  readOnly: boolean;
  activeCard: NodeId | undefined;
  /** The card and slot where the run crashed. */
  errorNodes: ReadonlySet<NodeId>;
  issueNodes: ReadonlySet<NodeId>;
}

export function PlanEditor({ program, onChange, level, readOnly, activeCard, errorNodes, issueNodes }: PlanEditorProps) {
  const [picking, setPicking] = useState<Picking | null>(null);
  const [editingExpr, setEditingExpr] = useState<NodeId | null>(null);
  const arrays = level.inputs.filter((i) => i.type !== "number").map((i) => i.name);
  const scalars = level.inputs.filter((i) => i.type === "number").map((i) => i.name);

  const place = (ref: ContainerRef, index: number, what: Picking) => {
    if (what.kind === "new") onChange(insertStmt(program, ref, index, newCard(what.stmt, program, arrays)));
    else onChange(moveStmt(program, what.id, ref, index));
    setPicking(null);
  };

  const value: EditorContextValue = {
    program,
    readOnly,
    arrays,
    activeCard,
    errorNodes,
    issueNodes,
    picking,
    setPicking,
    commit: onChange,
    openExpr: (id) => !readOnly && setEditingExpr(id),
    place,
  };

  return (
    <EditorContext.Provider value={value}>
      <section className="plan" aria-label="Battle plan">
        {!readOnly && <Tray statements={level.tools.statements} />}
        {picking && (
          <div className="picking-hint" role="status">
            Tap a <strong>＋</strong> slot to place the card.{" "}
            <button type="button" className="link" onClick={() => setPicking(null)}>
              Cancel
            </button>
          </div>
        )}
        <div className="plan-cards">
          {program.body.length === 0 && !picking && (
            <p className="empty-plan">{readOnly ? "This plan is empty." : "Your plan is empty. Pick a card from the tray above."}</p>
          )}
          <CardList stmts={program.body} container={{ kind: "root" }} />
        </div>
        {editingExpr && (
          <ExprPicker
            program={program}
            exprId={editingExpr}
            tools={level.tools}
            arrays={arrays}
            scalars={scalars}
            onPick={(expr) => {
              onChange(replaceExpr(program, editingExpr, expr));
              setEditingExpr(null);
            }}
            onClose={() => setEditingExpr(null)}
          />
        )}
      </section>
    </EditorContext.Provider>
  );
}

function Tray({ statements }: { statements: StmtKind[] }) {
  const { picking, setPicking } = useEditor();
  return (
    <div className="tray" aria-label="Card tray">
      {statements.map((kind) => {
        const template = CARD_TEMPLATES[kind];
        const selected = picking?.kind === "new" && picking.stmt === kind;
        return (
          <button
            key={kind}
            type="button"
            className={`tray-card card-${kind} ${selected ? "selected" : ""}`}
            title={template.hint}
            draggable
            onDragStart={(e) => e.dataTransfer.setData(DRAG_MIME, JSON.stringify({ kind: "new", stmt: kind }))}
            onClick={() => setPicking(selected ? null : { kind: "new", stmt: kind })}
            aria-pressed={selected}
          >
            {template.label}
          </button>
        );
      })}
    </div>
  );
}

function CardList({ stmts, container }: { stmts: Stmt[]; container: ContainerRef }) {
  const { readOnly } = useEditor();
  return (
    <div className="card-list" data-container={containerKey(container)}>
      {stmts.map((stmt, index) => (
        <div key={stmt.id}>
          {!readOnly && <Slot container={container} index={index} />}
          <Card stmt={stmt} />
        </div>
      ))}
      {!readOnly && <Slot container={container} index={stmts.length} last />}
    </div>
  );
}

function Slot({ container, index, last = false }: { container: ContainerRef; index: number; last?: boolean }) {
  const { picking, place } = useEditor();
  const [over, setOver] = useState(false);

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setOver(false);
    const raw = e.dataTransfer.getData(DRAG_MIME);
    if (raw) place(container, index, JSON.parse(raw) as Picking);
  };

  if (picking) {
    return (
      <button type="button" className="slot slot-active" onClick={() => place(container, index, picking)} aria-label="Place card here">
        ＋
      </button>
    );
  }
  return (
    <div
      className={`slot ${over ? "slot-over" : ""} ${last ? "slot-last" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={onDrop}
    />
  );
}

function Card({ stmt }: { stmt: Stmt }) {
  const { program, readOnly, activeCard, errorNodes, picking, setPicking, commit } = useEditor();
  const classes = [
    "card",
    `card-${stmt.kind}`,
    activeCard === stmt.id ? "card-active" : "",
    errorNodes.has(stmt.id) ? "card-error" : "",
    picking?.kind === "move" && picking.id === stmt.id ? "card-moving" : "",
  ].join(" ");

  return (
    <div className={classes} data-card={stmt.id}>
      <div className="card-head">
        <div className="card-content">
          <CardContent stmt={stmt} />
        </div>
        {!readOnly && (
          <div className="card-actions">
            <button
              type="button"
              className="icon"
              draggable
              onDragStart={(e) => e.dataTransfer.setData(DRAG_MIME, JSON.stringify({ kind: "move", id: stmt.id }))}
              onClick={() => setPicking({ kind: "move", id: stmt.id })}
              aria-label="Move card"
              title="Move (tap, then tap a ＋ slot; or drag)"
            >
              ⠿
            </button>
            <button type="button" className="icon" onClick={() => commit(removeStmt(program, stmt.id))} aria-label="Delete card" title="Delete">
              ✕
            </button>
          </div>
        )}
      </div>
      <CardBody stmt={stmt} />
    </div>
  );
}

function CardContent({ stmt }: { stmt: Stmt }) {
  const { program, commit } = useEditor();
  const update = (fn: (s: Stmt) => Stmt) => commit(updateStmt(program, stmt.id, fn));

  switch (stmt.kind) {
    case "set":
      return (
        <>
          <Label>⚑ Banner</Label>
          <NameField value={stmt.name} onCommit={(name) => update((s) => (s.kind === "set" ? { ...s, name } : s))} />
          <Label>=</Label>
          <ExprView expr={stmt.value} />
        </>
      );
    case "place":
      return (
        <>
          <Label>Place pointer</Label>
          <NameField value={stmt.pointer} onCommit={(pointer) => update((s) => (s.kind === "place" ? { ...s, pointer } : s))} />
          <Label>on</Label>
          <ArrayField value={stmt.array} onCommit={(array) => update((s) => (s.kind === "place" ? { ...s, array } : s))} />
          <Label>at tile</Label>
          <ExprView expr={stmt.at} />
        </>
      );
    case "move":
      return (
        <>
          <DirectionField
            value={stmt.by}
            onCommit={(by) => update((s) => (s.kind === "move" ? { ...s, by } : s))}
          />
          <PointerField value={stmt.pointer} onCommit={(pointer) => update((s) => (s.kind === "move" ? { ...s, pointer } : s))} />
        </>
      );
    case "jump":
      return (
        <>
          <Label>Jump</Label>
          <PointerField value={stmt.pointer} onCommit={(pointer) => update((s) => (s.kind === "jump" ? { ...s, pointer } : s))} />
          <Label>to tile</Label>
          <ExprView expr={stmt.to} />
        </>
      );
    case "swap":
      return (
        <>
          <Label>Swap tiles</Label>
          <ExprView expr={stmt.i} />
          <Label>and</Label>
          <ExprView expr={stmt.j} />
          <Label>of</Label>
          <ArrayField value={stmt.array} onCommit={(array) => update((s) => (s.kind === "swap" ? { ...s, array } : s))} />
        </>
      );
    case "write":
      return (
        <>
          <Label>Write</Label>
          <ExprView expr={stmt.value} />
          <Label>into tile</Label>
          <ExprView expr={stmt.index} />
          <Label>of</Label>
          <ArrayField value={stmt.array} onCommit={(array) => update((s) => (s.kind === "write" ? { ...s, array } : s))} />
        </>
      );
    case "while":
      return (
        <>
          <Label>⟳ Repeat while</Label>
          <ExprView expr={stmt.cond} />
        </>
      );
    case "forEach":
      return (
        <>
          <Label>⟳ For each tile of</Label>
          <ArrayField value={stmt.array} onCommit={(array) => update((s) => (s.kind === "forEach" ? { ...s, array } : s))} />
          <Label>with pointer</Label>
          <NameField value={stmt.pointer} onCommit={(pointer) => update((s) => (s.kind === "forEach" ? { ...s, pointer } : s))} />
        </>
      );
    case "if":
      return (
        <>
          <Label>⟐ If</Label>
          <ExprView expr={stmt.branches[0]!.cond} />
        </>
      );
    case "return":
      return (
        <>
          <Label>⚔ Victory: return</Label>
          <ExprView expr={stmt.value} />
        </>
      );
    case "break":
      return <Label>Break formation (leave the loop)</Label>;
    case "continue":
      return <Label>Skip to the next round</Label>;
  }
}

function CardBody({ stmt }: { stmt: Stmt }) {
  const { program, readOnly, commit } = useEditor();
  if (stmt.kind === "while" || stmt.kind === "forEach") {
    return (
      <div className="card-body">
        <CardList stmts={stmt.body} container={{ kind: "body", stmt: stmt.id }} />
      </div>
    );
  }
  if (stmt.kind !== "if") return null;

  const setIf = (fn: (s: Extract<Stmt, { kind: "if" }>) => Stmt) => commit(updateStmt(program, stmt.id, (s) => (s.kind === "if" ? fn(s) : s)));
  const addElseIf = () => setIf((s) => ({ ...s, branches: [...s.branches, newCardBranch(program)] }));
  const removeBranch = (i: number) => setIf((s) => ({ ...s, branches: s.branches.filter((_, k) => k !== i) }));
  const addOtherwise = () => setIf((s) => ({ ...s, otherwise: [] }));
  const removeOtherwise = () =>
    setIf((s) => {
      const { otherwise: _drop, ...rest } = s;
      return rest;
    });

  return (
    <div className="card-body">
      <CardList stmts={stmt.branches[0]!.body} container={{ kind: "branch", stmt: stmt.id, branch: 0 }} />
      {stmt.branches.slice(1).map((branch, k) => (
        <div key={k} className="branch">
          <div className="branch-head">
            <Label>⟐ Else if</Label>
            <ExprView expr={branch.cond} />
            {!readOnly && (
              <button type="button" className="icon" onClick={() => removeBranch(k + 1)} aria-label="Remove branch">
                ✕
              </button>
            )}
          </div>
          <CardList stmts={branch.body} container={{ kind: "branch", stmt: stmt.id, branch: k + 1 }} />
        </div>
      ))}
      {stmt.otherwise && (
        <div className="branch">
          <div className="branch-head">
            <Label>⟐ Otherwise</Label>
            {!readOnly && (
              <button type="button" className="icon" onClick={removeOtherwise} aria-label="Remove otherwise">
                ✕
              </button>
            )}
          </div>
          <CardList stmts={stmt.otherwise} container={{ kind: "otherwise", stmt: stmt.id }} />
        </div>
      )}
      {!readOnly && (
        <div className="branch-buttons">
          <button type="button" className="link" onClick={addElseIf}>
            ＋ else if
          </button>
          {!stmt.otherwise && (
            <button type="button" className="link" onClick={addOtherwise}>
              ＋ otherwise
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** A fresh "else if" branch with an empty condition slot. */
function newCardBranch(program: Program) {
  const card = newCard("if", program, []) as Extract<Stmt, { kind: "if" }>;
  return card.branches[0]!;
}

function Label({ children }: { children: ReactNode }) {
  return <span className="card-label">{children}</span>;
}

function NameField({ value, onCommit }: { value: string; onCommit: (name: string) => void }) {
  const { readOnly } = useEditor();
  const [draft, setDraft] = useState(value);
  const [prev, setPrev] = useState(value);
  if (value !== prev) {
    setPrev(value);
    setDraft(value);
  }
  if (readOnly) return <span className="chip chip-name">{value}</span>;
  const commit = () => {
    if (isValidName(draft) && draft !== value) onCommit(draft);
    else setDraft(value);
  };
  return (
    <input
      className={`name-field ${isValidName(draft) ? "" : "invalid"}`}
      value={draft}
      size={Math.max(2, draft.length)}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
      aria-label="Name"
    />
  );
}

function PointerField({ value, onCommit }: { value: string; onCommit: (name: string) => void }) {
  const { program, readOnly } = useEditor();
  if (readOnly) return <span className="chip chip-pointer">{value}</span>;
  const pointers = declaredNames(program).pointers;
  const options = pointers.includes(value) ? pointers : [value, ...pointers];
  return (
    <select className="field-select chip-pointer" value={value} onChange={(e) => onCommit(e.target.value)} aria-label="Pointer">
      {options.map((p) => (
        <option key={p} value={p}>
          {p}
        </option>
      ))}
    </select>
  );
}

function ArrayField({ value, onCommit }: { value: string; onCommit: (name: string) => void }) {
  const { arrays, readOnly } = useEditor();
  if (readOnly || arrays.length <= 1) return <span className="chip chip-array">{value}</span>;
  return (
    <select className="field-select" value={value} onChange={(e) => onCommit(e.target.value)} aria-label="Row of tiles">
      {arrays.map((a) => (
        <option key={a} value={a}>
          {a}
        </option>
      ))}
    </select>
  );
}

function DirectionField({ value, onCommit }: { value: number; onCommit: (by: number) => void }) {
  const { readOnly } = useEditor();
  const label = value >= 0 ? "➜ Advance" : "⬅ Retreat";
  if (readOnly) return <span className="card-label">{label}</span>;
  return (
    <button type="button" className="direction" onClick={() => onCommit(value >= 0 ? -1 : 1)} title="Tap to switch direction">
      {label}
    </button>
  );
}

const OP_LABELS: Record<string, string> = { "//": "÷", "==": "=", "!=": "≠", "<=": "≤", ">=": "≥" };

/** A chip that opens the slot picker; a span with the button role so chips can nest. */
function Chip({ className, onOpen, label, children }: { className: string; onOpen?: () => void; label?: string; children: ReactNode }) {
  if (!onOpen) {
    return (
      <span className={className} aria-label={label}>
        {children}
      </span>
    );
  }
  return (
    <span
      className={`${className} editable`}
      role="button"
      tabIndex={0}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onOpen();
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          onOpen();
        }
      }}
    >
      {children}
    </span>
  );
}

/** Plain-text form of an expression, used as the accessible name of its edit handle. */
export function exprText(expr: Expr): string {
  switch (expr.kind) {
    case "hole":
      return "empty slot";
    case "num":
      return String(expr.value);
    case "str":
      return `"${expr.value}"`;
    case "bool":
      return expr.value ? "yes" : "no";
    case "null":
      return "nothing";
    case "var":
      return expr.name;
    case "len":
      return `length of ${expr.array}`;
    case "at":
      return `${expr.array}[${exprText(expr.index)}]`;
    case "binary":
      return `${exprText(expr.left)} ${OP_LABELS[expr.op] ?? expr.op} ${exprText(expr.right)}`;
    case "not":
      return `not ${exprText(expr.operand)}`;
    case "neg":
      return `−${exprText(expr.operand)}`;
    case "list":
      return `[${expr.items.map(exprText).join(", ")}]`;
  }
}

/**
 * Renders an expression as chips. Leaf values are single tappable chips.
 * Composite expressions are a group of chips whose operator (or prefix) is
 * the handle that edits the whole expression, so buttons never nest.
 */
export function ExprView({ expr, nested = false }: { expr: Expr; nested?: boolean }) {
  const { openExpr, readOnly, issueNodes, errorNodes } = useEditor();
  const onOpen = readOnly ? undefined : () => openExpr(expr.id);
  const flag = issueNodes.has(expr.id) || errorNodes.has(expr.id) ? "chip-issue" : "";
  const leaf = (kind: string, children: ReactNode, label?: string) => (
    <Chip className={`chip ${kind} ${nested ? "nested" : ""} ${flag}`} onOpen={onOpen} label={label}>
      {children}
    </Chip>
  );
  const handle = (children: ReactNode) => (
    <Chip className="handle" onOpen={onOpen} label={onOpen ? `Edit ${exprText(expr)}` : undefined}>
      {children}
    </Chip>
  );
  const group = (children: ReactNode) => <span className={`chip chip-expr ${nested ? "nested" : ""} ${flag}`}>{children}</span>;

  switch (expr.kind) {
    case "hole":
      return leaf("chip-hole", "▢", "Empty slot");
    case "num":
      return leaf("chip-num", expr.value);
    case "str":
      return leaf("chip-num", `"${expr.value}"`);
    case "bool":
      return leaf("chip-num", expr.value ? "yes" : "no");
    case "null":
      return leaf("chip-num", "nothing");
    case "var":
      return leaf("chip-name", expr.name);
    case "len":
      return leaf("chip-expr", `length of ${expr.array}`);
    case "at":
      return group(
        <>
          {handle(`${expr.array}[`)}
          <ExprView expr={expr.index} nested />
          {handle("]")}
        </>,
      );
    case "binary":
      return group(
        <>
          <ExprView expr={expr.left} nested />
          {handle(<span className="op">{OP_LABELS[expr.op] ?? expr.op}</span>)}
          <ExprView expr={expr.right} nested />
        </>,
      );
    case "not":
      return group(
        <>
          {handle("not")}
          <ExprView expr={expr.operand} nested />
        </>,
      );
    case "neg":
      return group(
        <>
          {handle("−")}
          <ExprView expr={expr.operand} nested />
        </>,
      );
    case "list":
      return group(
        <>
          {handle("[")}
          {expr.items.map((item, i) => (
            <span key={item.id}>
              {i > 0 && ", "}
              <ExprView expr={item} nested />
            </span>
          ))}
          {handle("]")}
        </>,
      );
  }
}
