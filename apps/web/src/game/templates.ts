import { createBuilder, declaredNames, type Program, type Stmt, type StmtKind } from "@vicoding/engine";

/** Builder for cards created in the editor; a random prefix keeps ids unique across sessions. */
const b = createBuilder(`e${Math.random().toString(36).slice(2, 7)}-`);
export const editorBuilder = b;

export interface CardTemplate {
  kind: StmtKind;
  label: string;
  /** Short description for the tray tooltip / accessibility label. */
  hint: string;
}

export const CARD_TEMPLATES: Record<StmtKind, CardTemplate> = {
  set: { kind: "set", label: "Raise banner", hint: "Create or update a named value (a variable)" },
  place: { kind: "place", label: "Place pointer", hint: "Put a pointer on a tile" },
  move: { kind: "move", label: "Move pointer", hint: "Advance or retreat a pointer by one tile" },
  jump: { kind: "jump", label: "Jump pointer", hint: "Send a pointer to any tile" },
  swap: { kind: "swap", label: "Swap tiles", hint: "Exchange two tiles" },
  write: { kind: "write", label: "Write tile", hint: "Put a value into a tile" },
  while: { kind: "while", label: "Repeat while", hint: "Repeat cards while a condition holds (while loop)" },
  forEach: { kind: "forEach", label: "For each tile", hint: "A pointer visits every tile from first to last (for loop)" },
  if: { kind: "if", label: "If", hint: "Run cards only when a condition holds" },
  return: { kind: "return", label: "Victory", hint: "Finish and give the answer (return)" },
  break: { kind: "break", label: "Break formation", hint: "Leave the loop now (break)" },
  continue: { kind: "continue", label: "Skip round", hint: "Jump to the next round (continue)" },
};

function firstUnused(candidates: readonly string[], taken: readonly string[]): string {
  return candidates.find((name) => !taken.includes(name)) ?? `${candidates[0]}${taken.length + 1}`;
}

/** Creates a new card of `kind` with sensible default names for the current plan. */
export function newCard(kind: StmtKind, program: Program, arrays: readonly string[]): Stmt {
  const { pointers, banners } = declaredNames(program);
  const taken = [...pointers, ...banners];
  const array = arrays[0] ?? "tiles";
  switch (kind) {
    case "set":
      return b.set(firstUnused(["best", "count", "x", "y"], taken), b.hole());
    case "place":
      return b.place(firstUnused(["L", "R", "i", "j"], taken), array, b.hole());
    case "move":
      return b.advance(pointers[0] ?? "L");
    case "jump":
      return b.jump(pointers[0] ?? "L", b.hole());
    case "swap":
      return b.swap(array, b.hole(), b.hole());
    case "write":
      return b.write(array, b.hole(), b.hole());
    case "while":
      return b.whileLoop(b.hole());
    case "forEach":
      return b.forEach(firstUnused(["i", "j", "k"], taken), array);
    case "if":
      return b.iff([b.when(b.hole())]);
    case "return":
      return b.ret(b.hole());
    case "break":
      return b.brk();
    case "continue":
      return b.cont();
  }
}

/** Banner and pointer names must look like code identifiers. */
export function isValidName(name: string): boolean {
  return /^[A-Za-z_][A-Za-z0-9_]{0,15}$/.test(name);
}
