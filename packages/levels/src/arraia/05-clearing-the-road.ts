import { createBuilder, type Inputs } from "@vicoding/engine";
import { randomInt } from "../random.ts";
import type { LevelModule } from "../types.ts";

const b = createBuilder("l5-");

/** R scouts every tile; each cart it finds is swapped back to W, the next free spot. */
const referencePlan = b.program(
  b.place("W", "road", 0),
  b.forEach("R", "road", b.iff([b.when(b.ne(b.at("road", "R"), 0), b.swap("road", "W", "R"), b.advance("W"))])),
);

const road = (input: Inputs) => input.road as number[];

export const clearingTheRoad: LevelModule = {
  definition: {
    id: "arraia-05-clearing-the-road",
    order: 5,
    realm: "arraia",
    title: "Clearing the Road",
    source: "Move Zeroes",
    step: "build",
    mentor: {
      name: "Captain Ada Ironquill",
      intro: "A rockfall! Boulders (the zeros) block the road. Push them all to the far end, but keep the carts in their order.",
      hints: [
        "Use two pointers walking the same way: a scout R that checks every tile, and a writer W that marks where the next cart belongs.",
        "When R finds a cart (not 0), swap it back to W, then move W one step forward.",
      ],
    },
    story:
      "The road is a row of carts and boulders. Move every boulder (0) to the end of the road, keeping the carts in the same order as before. Do it in place: no second road.",
    keywords: ["in place", "same order"],
    inputs: [{ name: "road", type: "number[]", label: "road" }],
    size: { min: 0, max: 100_000 },
    output: { kind: "array", name: "road" },
    examples: [{ input: { road: [0, 1, 0, 3, 12] } }, { input: { road: [4, 0, 5, 0, 0, 6] } }],
    tools: {
      statements: ["place", "forEach", "while", "if", "swap", "write", "move"],
      expressions: ["var", "at", "len", "num", "binary"],
      operators: ["==", "!=", "<", "+"],
    },
    targets: {
      time: "O(n)",
      space: "O(1)",
      // Reference worst case (no boulders: a swap on every tile) costs 6n + 2.
      stamina: { perN: 8, constant: 10 },
      parCards: 6,
      travelLight: true,
    },
    codeVisibility: "live",
    handMode: false,
    warCouncil: {
      question: "Why does W only move forward after placing a cart?",
      options: [
        "To save memory",
        "So W always marks the first spot that doesn't hold a cart yet",
        "Because R is faster than W",
        "It doesn't matter when W moves",
      ],
      answer: 1,
      explanation:
        "Everything left of W is a cart, in order. W moves only when it gains a cart, so it always points at the next free spot. That rule (the invariant) is what makes one pass enough.",
    },
    jester: {
      input: { road: [4, 0, 0, 5] },
      teaches: "Two boulders in a row: a writer that steps forward on every tile leaves a boulder stuck between the carts.",
    },
  },
  reference: (input) => {
    const carts = road(input).filter((v) => v !== 0);
    return [...carts, ...Array.from({ length: road(input).length - carts.length }, () => 0)];
  },
  referencePlan,
  edgeCases: [
    { input: { road: [] }, label: "an empty road" },
    { input: { road: [0] }, label: "a single boulder" },
    { input: { road: [7] }, label: "a single cart" },
    { input: { road: [0, 0, 0] }, label: "only boulders" },
    { input: { road: [1, 2, 3] }, label: "no boulders" },
    { input: { road: [-2, 0, -1] }, label: "negative carts" },
  ],
  generate: (n, random) => ({ road: Array.from({ length: n }, () => (random() < 0.4 ? 0 : randomInt(random, -9, 20))) }),
  // No boulders: every tile triggers a swap and a step of W.
  worstCase: (n) => ({ road: Array.from({ length: n }, (_, i) => i + 1) }),
};
