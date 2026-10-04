/**
 * Micro-puzzles for the "keep the best so far" pattern (the tallest scroll).
 * They are data; every answer is derived from the shelf, never typed in twice.
 */
export type PuzzleKind = "moves" | "final" | "trace" | "bug";
export type TraceId = "max" | "min" | "latest";
export type BugId = "zeroStart" | "skipLast";

export interface MovesPuzzle {
  id: string;
  kind: "moves";
  shelf: number[];
  /** Index the walker stands on; the flag has seen only the scrolls before it. */
  at: number;
}
export interface FinalPuzzle {
  id: string;
  kind: "final";
  shelf: number[];
}
export interface TracePuzzle {
  id: string;
  kind: "trace";
  shelf: number[];
  /** Candidate trails, in display order. The flag's real trail is "max". */
  options: TraceId[];
}
export interface BugPuzzle {
  id: string;
  kind: "bug";
  bug: BugId;
  /** Candidate shelves; exactly one fools the buggy plan. */
  shelves: number[][];
}
export type Puzzle = MovesPuzzle | FinalPuzzle | TracePuzzle | BugPuzzle;

/** Sneaky almost-right plans: what each returns for a shelf. */
export const BUGS: Record<BugId, { label: string; run: (shelf: readonly number[]) => number }> = {
  zeroStart: {
    label: "starts the flag at 0",
    run: (shelf) => shelf.reduce((best, v) => (v > best ? v : best), 0),
  },
  skipLast: {
    label: "never looks at the last scroll",
    run: (shelf) => Math.max(...shelf.slice(0, -1)),
  },
};

export const WATCH_SHELVES: number[][] = [
  [3, 8, 5, 9, 4],
  [6, 2, 7, 7, 3, 10],
  [4, 4, 9, 1, 6],
];

export const PUZZLES: Puzzle[] = [
  { id: "max/moves-1", kind: "moves", shelf: [4, 2, 7, 5, 9], at: 2 },
  { id: "max/final-1", kind: "final", shelf: [3, 8, 5, 9, 4] },
  { id: "max/trace-1", kind: "trace", shelf: [2, 5, 3, 7, 4], options: ["latest", "max", "min"] },
  { id: "max/moves-2", kind: "moves", shelf: [6, 3, 5, 8, 2], at: 2 },
  { id: "max/bug-1", kind: "bug", bug: "zeroStart", shelves: [[3, 5, 2], [-3, -1, -7], [4, 0, 6]] },
  { id: "max/final-2", kind: "final", shelf: [5, 1, 9, 6, 9, 2] },
  { id: "max/trace-2", kind: "trace", shelf: [8, 6, 9, 5, 9], options: ["min", "latest", "max"] },
  { id: "max/bug-2", kind: "bug", bug: "skipLast", shelves: [[2, 9, 4], [1, 3, 8], [7, 7, 7]] },
];

export const PUZZLE_IDS = PUZZLES.map((p) => p.id);

export function getPuzzle(id: string): Puzzle | undefined {
  return PUZZLES.find((p) => p.id === id);
}

export function traceOf(shelf: readonly number[], id: TraceId): number[] {
  if (id === "latest") return [...shelf];
  const pick = id === "max" ? Math.max : Math.min;
  return shelf.map((_, i) => pick(...shelf.slice(0, i + 1)));
}

/** Does the flag rise when the walker stands on `shelf[at]`? */
export function flagMoves(shelf: readonly number[], at: number): boolean {
  return at === 0 || (shelf[at] as number) > Math.max(...shelf.slice(0, at));
}

/** The flag height before the walker's step at `at`. */
export function flagBefore(shelf: readonly number[], at: number): number {
  return Math.max(...shelf.slice(0, Math.max(1, at)));
}

/** Index of the shelf that fools the buggy plan. */
export function foolingShelf(puzzle: BugPuzzle): number {
  const bug = BUGS[puzzle.bug];
  return puzzle.shelves.findIndex((s) => bug.run(s) !== Math.max(...s));
}

/** The correct option for a puzzle, as the index/value its answer buttons use. */
export function correctAnswer(puzzle: Puzzle): string {
  switch (puzzle.kind) {
    case "moves":
      return flagMoves(puzzle.shelf, puzzle.at) ? "moves" : "stays";
    case "final":
      return String(Math.max(...puzzle.shelf));
    case "trace":
      return "max";
    case "bug":
      return String(foolingShelf(puzzle));
  }
}
