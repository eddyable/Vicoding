import { declaredNames, findExpr, type Expr, type NodeId, type Program } from "@vicoding/engine";
import type { LevelDefinition } from "@vicoding/levels";
import { useEffect, useState } from "react";
import { editorBuilder as b } from "../game/templates.ts";

interface ExprPickerProps {
  program: Program;
  exprId: NodeId;
  tools: LevelDefinition["tools"];
  arrays: string[];
  scalars: string[];
  onPick: (expr: Expr) => void;
  onClose: () => void;
}

const OP_LABELS: Record<string, string> = { "//": "÷", "==": "=", "!=": "≠", "<=": "≤", ">=": "≥" };

/** Lists what can go into a slot, limited to the level's tools. */
export function ExprPicker({ program, exprId, tools, arrays, scalars, onPick, onClose }: ExprPickerProps) {
  const current = findExpr(program, exprId);
  const [number, setNumber] = useState("");
  const { pointers, banners } = declaredNames(program);
  const allows = (kind: Expr["kind"]) => tools.expressions.includes(kind);
  /** Operators wrap what is already in the slot, so "L" becomes "L + ▢". */
  const seed = current && current.kind !== "hole" ? current : b.hole();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const names = allows("var") ? [...scalars, ...pointers, ...banners] : [];
  const parsed = Number(number);
  const numberOk = number.trim() !== "" && Number.isFinite(parsed);

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label="Fill the slot" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <strong>Fill the slot</strong>
          <button type="button" className="icon" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {names.length > 0 && (
          <PickerSection title="Names">
            {names.map((name) => (
              <button key={name} type="button" className="chip chip-name" onClick={() => onPick(b.v(name))}>
                {name}
              </button>
            ))}
          </PickerSection>
        )}

        {(allows("at") || allows("len")) && (
          <PickerSection title="Tiles">
            {arrays.flatMap((array) => [
              ...(allows("at")
                ? [
                    ...pointers.map((p) => (
                      <button key={`${array}-${p}`} type="button" className="chip chip-expr" onClick={() => onPick(b.at(array, p))}>
                        {array}[{p}]
                      </button>
                    )),
                    <button key={`${array}-hole`} type="button" className="chip chip-expr" onClick={() => onPick(b.at(array, b.hole()))}>
                      {array}[▢]
                    </button>,
                  ]
                : []),
              ...(allows("len")
                ? [
                    <button key={`${array}-len`} type="button" className="chip chip-expr" onClick={() => onPick(b.len(array))}>
                      length of {array}
                    </button>,
                  ]
                : []),
            ])}
          </PickerSection>
        )}

        {allows("num") && (
          <PickerSection title="Numbers">
            {[0, 1].map((n) => (
              <button key={n} type="button" className="chip chip-num" onClick={() => onPick(b.num(n))}>
                {n}
              </button>
            ))}
            <form
              className="number-form"
              onSubmit={(e) => {
                e.preventDefault();
                if (numberOk) onPick(b.num(parsed));
              }}
            >
              <input inputMode="decimal" placeholder="other…" value={number} onChange={(e) => setNumber(e.target.value)} aria-label="Number" />
              <button type="submit" disabled={!numberOk}>
                Use
              </button>
            </form>
          </PickerSection>
        )}

        {allows("binary") && tools.operators.length > 0 && (
          <PickerSection title="Operators">
            {tools.operators.map((op) => (
              <button key={op} type="button" className="chip chip-expr" onClick={() => onPick(b.bin(op, seed, b.hole()))}>
                {seed.kind === "hole" ? "▢" : "…"} {OP_LABELS[op] ?? op} ▢
              </button>
            ))}
          </PickerSection>
        )}

        {(allows("not") || allows("bool") || allows("null") || allows("list")) && (
          <PickerSection title="More">
            {allows("not") && (
              <button type="button" className="chip chip-expr" onClick={() => onPick(b.not(seed))}>
                not …
              </button>
            )}
            {allows("bool") && (
              <>
                <button type="button" className="chip chip-num" onClick={() => onPick(b.bool(true))}>
                  yes
                </button>
                <button type="button" className="chip chip-num" onClick={() => onPick(b.bool(false))}>
                  no
                </button>
              </>
            )}
            {allows("null") && (
              <button type="button" className="chip chip-num" onClick={() => onPick(b.nil())}>
                nothing
              </button>
            )}
            {allows("list") && (
              <button type="button" className="chip chip-expr" onClick={() => onPick(b.list(b.hole(), b.hole()))}>
                [▢, ▢]
              </button>
            )}
          </PickerSection>
        )}

        {current && current.kind !== "hole" && (
          <div className="sheet-foot">
            <button type="button" className="link danger" onClick={() => onPick(b.hole())}>
              Clear this slot
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function PickerSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="picker-section">
      <div className="picker-title">{title}</div>
      <div className="picker-options">{children}</div>
    </div>
  );
}
