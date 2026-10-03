import { createBuilder, type Inputs } from "@vicoding/engine";
import { randomInt } from "../random.ts";
import type { LevelModule } from "../types.ts";

const b = createBuilder("l3-");

/** The apprentice's plan: R starts one tile past the end (the Imp's hiding place). */
const buggyPlan = b.program(
  b.place("L", "letters", 0),
  b.place("R", "letters", b.len("letters")),
  b.whileLoop(b.lt("L", "R"), b.swap("letters", "L", "R"), b.advance("L"), b.retreat("R")),
);

const fixed = createBuilder("l3-ref-");
const referencePlan = fixed.program(
  fixed.place("L", "letters", 0),
  fixed.place("R", "letters", fixed.sub(fixed.len("letters"), 1)),
  fixed.whileLoop(fixed.lt("L", "R"), fixed.swap("letters", "L", "R"), fixed.advance("L"), fixed.retreat("R")),
);

const letters = (input: Inputs) => input.letters as string[];
const ALPHABET = "abcdefghijklmnopqrstuvwxyz";

export const impOnTheBridge: LevelModule = {
  definition: {
    id: "arraia-03-imp-on-the-bridge",
    order: 3,
    realm: "arraia",
    title: "The Imp on the Bridge",
    source: "Reverse an array in place (debugging an off-by-one error)",
    step: "fix",
    mentor: {
      name: "Captain Ada Ironquill",
      intro: "My apprentice copied the twins' plan, but an Off-by-One Imp crept in. Run it, find where it goes wrong, and fix it.",
      hints: [
        "Press play and watch R. Which tile does it reach for first?",
        "The tiles are numbered 0 to length − 1. Where should R start?",
      ],
    },
    story: "The apprentice's plan should reverse the bridge's name, but it crashes on the very first swap. Find the Imp and fix the plan.",
    keywords: ["crashes on the very first swap"],
    inputs: [{ name: "letters", type: "char[]", label: "letters" }],
    size: { min: 0, max: 100_000 },
    output: { kind: "array", name: "letters" },
    examples: [{ input: { letters: [..."bridge"] } }, { input: { letters: [..."imp"] } }],
    tools: {
      statements: ["place", "while", "swap", "move"],
      expressions: ["var", "len", "num", "binary"],
      operators: ["<", "<=", "-", "+"],
    },
    targets: {
      time: "O(n)",
      space: "O(1)",
      stamina: { perN: 3, constant: 10 },
      parCards: 6,
      travelLight: true,
    },
    handMode: false,
    starterPlan: buggyPlan,
    warCouncil: {
      question: "A row has 6 tiles. What is the position of the last tile?",
      options: ["6", "5", "7", "It depends on the letters"],
      answer: 1,
      explanation: "Positions start at 0, so 6 tiles are numbered 0–5. The last tile is always at length − 1.",
    },
    jester: {
      input: { letters: [] },
      teaches: "With no letters, R starts at −1 and the twins must not swap at all. A fix that special-cases the end can trip here.",
    },
  },
  reference: (input) => letters(input).slice().reverse(),
  referencePlan,
  edgeCases: [
    { input: { letters: [] }, label: "an empty word" },
    { input: { letters: ["a"] }, label: "a single letter" },
    { input: { letters: ["a", "b"] }, label: "two letters" },
  ],
  generate: (n, random) => ({
    letters: Array.from({ length: n }, () => ALPHABET[randomInt(random, 0, ALPHABET.length - 1)] as string),
  }),
  worstCase: (n) => ({ letters: Array.from({ length: n }, (_, i) => ALPHABET[i % ALPHABET.length] as string) }),
};
