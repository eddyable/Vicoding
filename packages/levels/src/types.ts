import type { BinaryOp, ExprKind, Inputs, Program, StaminaBudget, StmtKind, Value } from "@vicoding/engine";

/** The five-step difficulty ramp (design doc 03 §8.1, PRD §6). */
export type RampStep = "watch" | "fix" | "complete" | "build" | "choose";

export type InputType = "number[]" | "char[]" | "number";

export interface InputSpec {
  name: string;
  type: InputType;
  /** What the board calls this input, e.g. "scrolls". */
  label: string;
}

export interface TestCase {
  input: Inputs;
  /** Why this case exists, shown when it fails ("all negative heights"). */
  label?: string;
}

export interface ChoiceQuestion {
  question: string;
  options: string[];
  /** Index into `options`. */
  answer: number;
  explanation: string;
}

/**
 * Serializable level definition: everything the game needs to present and
 * score a level. Behaviour that can't be data (reference solution, input
 * generators) lives next to it in a `LevelModule`.
 */
export interface LevelDefinition {
  id: string;
  order: number;
  realm: "arraia";
  title: string;
  /** The interview problem this level is adapted from. */
  source: string;
  step: RampStep;
  mentor: { name: string; intro: string; hints: string[] };
  story: string;
  /** Words in the story that point at the pattern; highlighted on the Scout card. */
  keywords: string[];
  inputs: InputSpec[];
  /** Allowed length of the array input(s); hidden tests stay within it. */
  size: { min: number; max: number };
  /** What counts as the answer: the returned value, or the final state of an array. */
  output: { kind: "return" } | { kind: "array"; name: string };
  examples: TestCase[];
  /** Blocks available in the tray for this level. */
  tools: { statements: StmtKind[]; expressions: ExprKind[]; operators: BinaryOp[] };
  targets: {
    time: string;
    space: string;
    stamina: StaminaBudget;
    /** Maximum cards for the third star. */
    parCards: number;
    /** Third star also requires O(1) extra space ("Travel Light"). */
    travelLight: boolean;
  };
  /** Level 1 starts with the player moving the pointer by hand. */
  handMode: boolean;
  /**
   * The plan offered after solving by hand: the player's moves, generalised,
   * with the one rule they must state themselves left as an empty slot.
   */
  handDraft?: Program;
  /** When the player sees their plan as code: after winning, or live while building. */
  codeVisibility: "victory" | "live";
  /** Pre-built plan for watch / fix / complete levels. */
  starterPlan?: Program;
  /** Predict-before-run question (Amulet of Foresight). */
  foresight?: ChoiceQuestion;
  warCouncil: ChoiceQuestion;
  /** The Jester's signature attack and what it teaches. */
  jester: { input: Inputs; teaches: string };
}

export interface LevelModule {
  definition: LevelDefinition;
  /** Ground truth: an expected answer for any valid input. */
  reference: (input: Inputs) => Value;
  /**
   * For problems with several correct answers (e.g. any pair that sums to the
   * target): decides whether `actual` is acceptable. Defaults to equality with `reference`.
   */
  accepts?: (input: Inputs, actual: Value) => boolean;
  /** A plan that solves the level at target complexity and within par. */
  referencePlan: Program;
  /** Hidden edge cases (the Skirmisher wave). */
  edgeCases: TestCase[];
  /** Random valid input of size n (used by the Horde wave and fuzzing). */
  generate: (n: number, random: () => number) => Inputs;
  /** The input that maximises the reference plan's cost at size n (stamina is checked against it). */
  worstCase: (n: number) => Inputs;
}
