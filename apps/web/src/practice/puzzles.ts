/**
 * Micro-puzzles for two patterns: "keep the best so far" (the tallest scroll,
 * ids `max/...`) and "two pointers from both ends" (the mirror twins, ids
 * `twins/...`). They are data; every answer is derived from the shelf or word,
 * never typed in twice.
 */
export type PuzzleKind = "moves" | "final" | "trace" | "bug" | "swaps" | "result" | "twinbug";
export type Pattern = "max" | "twins";
export type TraceId = "max" | "min" | "latest";
export type BugId = "zeroStart" | "skipLast";

export interface MovesPuzzle {
  id: string;
  kind: "moves";
  shelf: number[];
  /** Index the walker stands on; the banner has seen only the scrolls before it. */
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
export interface SwapsPuzzle {
  id: string;
  kind: "swaps";
  word: string;
}
export type ResultId = "reverse" | "same" | "ends";
export interface ResultPuzzle {
  id: string;
  kind: "result";
  word: string;
  /** Candidate outcomes, in display order. The real one is "reverse". */
  options: ResultId[];
}
export type TwinsBugId = "stopEarly" | "walkAll";
export interface TwinsBugPuzzle {
  id: string;
  kind: "twinbug";
  bug: TwinsBugId;
  /** Candidate words; exactly one fools the buggy plan. */
  words: string[];
}
export type Puzzle = MovesPuzzle | FinalPuzzle | TracePuzzle | BugPuzzle | SwapsPuzzle | ResultPuzzle | TwinsBugPuzzle;

export function patternOf(id: string): Pattern {
  return id.startsWith("twins/") ? "twins" : "max";
}

export function reverseWord(word: string): string {
  return [...word].reverse().join("");
}

/** Swapping only the two end letters: a plausible but wrong result. */
function endsOnly(word: string): string {
  const w = [...word];
  if (w.length > 1) [w[0], w[w.length - 1]] = [w[w.length - 1]!, w[0]!];
  return w.join("");
}

export function resultWord(word: string, id: ResultId): string {
  return id === "reverse" ? reverseWord(word) : id === "same" ? word : endsOnly(word);
}

/** Swaps the twins make: each settles two letters, the middle one stays. */
export function swapCount(word: string): number {
  return Math.floor(word.length / 2);
}

/** Sneaky almost-right twin plans: what each returns for a word. */
export const TWIN_BUGS: Record<TwinsBugId, { why: string; steps: string[]; bad: number; run: (word: string) => string }> = {
  stopEarly: {
    why: "the twins stopped before swapping the middle pair",
    steps: ["Put one twin on each end.", "Swap them, then step both inward. Stop as soon as the twins are next to each other, before swapping them.", "Report the word."],
    bad: 1,
    run: (word) => {
      const w = [...word];
      let l = 0;
      let r = w.length - 1;
      while (l < r - 1) {
        [w[l], w[r]] = [w[r]!, w[l]!];
        l += 1;
        r -= 1;
      }
      return w.join("");
    },
  },
  walkAll: {
    why: "the twins kept going and swapped every pair back",
    steps: ["Put one twin on each end.", "Swap them, then step both inward. Never stop: keep going until the left twin walks off the far end.", "Report the word."],
    bad: 1,
    run: (word) => {
      const w = [...word];
      for (let l = 0; l < w.length; l += 1) {
        const r = w.length - 1 - l;
        [w[l], w[r]] = [w[r]!, w[l]!];
      }
      return w.join("");
    },
  },
};

/** Sneaky almost-right plans: what each returns for a shelf. */
export const BUGS: Record<BugId, { label: string; why: string; steps: string[]; bad: number; run: (shelf: readonly number[]) => number }> = {
  zeroStart: {
    label: "starts the banner at 0",
    why: "the banner started at 0, higher than every scroll",
    steps: ["Put the banner at 0.", "Walk the shelf. Raise the banner to any scroll taller than it.", "Report the banner's height."],
    bad: 0,
    run: (shelf) => shelf.reduce((best, v) => (v > best ? v : best), 0),
  },
  skipLast: {
    label: "never looks at the last scroll",
    why: "the last scroll was never checked",
    steps: ["Put the banner on the first scroll.", "Walk the shelf, but stop before the last scroll. Raise the banner to any taller scroll.", "Report the banner's height."],
    bad: 1,
    run: (shelf) => Math.max(...shelf.slice(0, -1)),
  },
};

export const WATCH_WORDS = ["marble", "pencil", "button"];

export const WATCH_SHELVES: number[][] = [
  [3, 8, 5, 9, 4],
  [6, 2, 7, 7, 3, 10],
  [4, 4, 9, 1, 6],
];

/**
 * Order is the order new puzzles are met. The first sitting is only "does it
 * rise" and "where does it end"; trails and bug-hunting arrive once the
 * banner is familiar. No final-value shelf repeats a watch shelf.
 */
export const PUZZLES: Puzzle[] = [
  { id: "max/moves-1", kind: "moves", shelf: [4, 2, 7, 5, 9], at: 2 },
  { id: "max/final-1", kind: "final", shelf: [5, 2, 8, 3, 6] },
  { id: "max/moves-2", kind: "moves", shelf: [6, 3, 5, 8, 2], at: 2 },
  { id: "max/final-2", kind: "final", shelf: [5, 1, 9, 6, 9, 2] },
  { id: "max/moves-3", kind: "moves", shelf: [3, 7, 1, 7, 9], at: 3 },
  { id: "max/trace-1", kind: "trace", shelf: [2, 5, 3, 7, 4], options: ["latest", "max", "min"] },
  { id: "max/final-3", kind: "final", shelf: [7, 3, 10, 4, 6] },
  { id: "max/bug-1", kind: "bug", bug: "zeroStart", shelves: [[3, 5, 2], [-3, -1, -7], [4, 0, 6]] },
  { id: "max/moves-4", kind: "moves", shelf: [2, 6, 3, 5, 9], at: 4 },
  { id: "max/trace-2", kind: "trace", shelf: [8, 6, 9, 5, 9], options: ["min", "latest", "max"] },
  { id: "max/bug-2", kind: "bug", bug: "skipLast", shelves: [[2, 9, 4], [1, 3, 8], [7, 7, 7]] },
  { id: "twins/swaps-1", kind: "swaps", word: "hello" },
  { id: "twins/result-1", kind: "result", word: "stone", options: ["ends", "reverse", "same"] },
  { id: "twins/swaps-2", kind: "swaps", word: "bridges" },
  { id: "twins/bug-1", kind: "twinbug", bug: "stopEarly", words: ["tower", "moat", "plank"] },
  { id: "twins/result-2", kind: "result", word: "wolf", options: ["same", "ends", "reverse"] },
  { id: "twins/bug-2", kind: "twinbug", bug: "walkAll", words: ["noon", "gate", "level"] },
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

/** Does the banner rise when the walker stands on `shelf[at]`? */
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

/** Index of the word that fools the buggy twin plan. */
export function foolingWord(puzzle: TwinsBugPuzzle): number {
  const bug = TWIN_BUGS[puzzle.bug];
  return puzzle.words.findIndex((w) => bug.run(w) !== reverseWord(w));
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
    case "swaps":
      return String(swapCount(puzzle.word));
    case "result":
      return "reverse";
    case "twinbug":
      return String(foolingWord(puzzle));
  }
}
