import { createBuilder, type Inputs } from "@vicoding/engine";
import { randomInt } from "../random.ts";
import type { LevelModule } from "../types.ts";

const b = createBuilder("l1-");

/** best = first scroll; sweep; keep the taller one; return best. */
const referencePlan = b.program(
  b.set("best", b.at("scrolls", 0)),
  b.forEach("i", "scrolls", b.iff([b.when(b.gt(b.at("scrolls", "i"), "best"), b.set("best", b.at("scrolls", "i")))])),
  b.ret("best"),
);

const scrolls = (input: Inputs) => input.scrolls as number[];

export const tallestScroll: LevelModule = {
  definition: {
    id: "arraia-01-tallest-scroll",
    order: 1,
    realm: "arraia",
    title: "The Tallest Scroll",
    source: "Find the maximum element of an array",
    step: "build",
    mentor: {
      name: "Captain Ada Ironquill",
      intro: "A Bug is loose in the archive. Find the tallest scroll before it eats them. March down the shelf and never lose your place.",
      hints: [
        "If you could only remember one scroll while you walk, which one would it be?",
        "Raise a banner for the tallest scroll seen so far, and update it when you meet a taller one.",
        "Start the banner at the first scroll, not at 0. Some shelves only hold negative heights.",
      ],
    },
    story: "The archive shelf holds scrolls of different heights. Walk the shelf once and report the height of the tallest scroll.",
    keywords: ["walk the shelf once", "tallest"],
    inputs: [{ name: "scrolls", type: "number[]", label: "scrolls" }],
    size: { min: 1, max: 100_000 },
    output: { kind: "return" },
    examples: [{ input: { scrolls: [3, 7, 2, 9, 4] } }, { input: { scrolls: [5, 1, 4] } }],
    tools: {
      statements: ["set", "forEach", "if", "return"],
      expressions: ["var", "at", "num", "binary"],
      operators: [">", ">=", "<", "<="],
    },
    targets: {
      time: "O(n)",
      space: "O(1)",
      // Reference worst case (ascending shelf) costs 6n + 5.
      stamina: { perN: 8, constant: 10 },
      parCards: 6,
      travelLight: true,
    },
    handMode: true,
    warCouncil: {
      question: "The shelf doubles in length. Roughly how much longer does your sweep take?",
      options: ["The same time", "About twice as long", "About four times as long", "It depends on the tallest scroll's position"],
      answer: 1,
      explanation: "One step per scroll: the work grows in a straight line with the shelf. That's O(n).",
    },
    jester: {
      input: { scrolls: [-3, -1, -7] },
      teaches: "A banner that starts at 0 is taller than every scroll on an all-negative shelf. Start from the first scroll instead.",
    },
  },
  reference: (input) => Math.max(...scrolls(input)),
  referencePlan,
  edgeCases: [
    { input: { scrolls: [5] }, label: "a single scroll" },
    { input: { scrolls: [2, 2, 2] }, label: "all scrolls the same height" },
    { input: { scrolls: [-3, -1, -7] }, label: "all negative heights" },
    { input: { scrolls: [9, 1, 2] }, label: "tallest scroll first" },
    { input: { scrolls: [1, 2, 9] }, label: "tallest scroll last" },
  ],
  generate: (n, random) => ({ scrolls: Array.from({ length: n }, () => randomInt(random, -1_000, 1_000)) }),
  // Ascending heights force a banner update on every step.
  worstCase: (n) => ({ scrolls: Array.from({ length: n }, (_, i) => i) }),
};
