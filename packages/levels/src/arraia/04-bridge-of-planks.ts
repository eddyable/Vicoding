import { createBuilder, type Inputs, type Value } from "@vicoding/engine";
import { randomInt } from "../random.ts";
import type { LevelModule } from "../types.ts";

const b = createBuilder("l4-");

const sum = () => b.add(b.at("planks", "L"), b.at("planks", "R"));

/** Converging blades: too long → R retreats, too short → L advances. */
const referencePlan = b.program(
  b.place("L", "planks", 0),
  b.place("R", "planks", b.sub(b.len("planks"), 1)),
  b.whileLoop(
    b.lt("L", "R"),
    b.iff([b.when(b.eq(sum(), "target"), b.ret(b.list("L", "R"))), b.when(b.lt(sum(), "target"), b.advance("L"))], [b.retreat("R")]),
  ),
  b.ret(b.nil()),
);

const planks = (input: Inputs) => input.planks as number[];
const target = (input: Inputs) => input.target as number;

/** Any pair (i < j) whose planks add up to the target, or null if there is none. */
function findPair(input: Inputs): Value {
  const seen = new Map<number, number>();
  for (const [j, value] of planks(input).entries()) {
    const i = seen.get(target(input) - value);
    if (i !== undefined) return [i, j];
    if (!seen.has(value)) seen.set(value, j);
  }
  return null;
}

export const bridgeOfPlanks: LevelModule = {
  definition: {
    id: "arraia-04-bridge-of-planks",
    order: 4,
    realm: "arraia",
    title: "The Bridge of Planks",
    source: "Two Sum II — input array is sorted",
    step: "build",
    mentor: {
      name: "Captain Ada Ironquill",
      intro: "The bridge is broken. Two builders, one on each bank, must find two planks that together span the gap exactly.",
      hints: [
        "If two planks are too long together, which one would you swap for a shorter one?",
        "Put L on the shortest plank and R on the longest. Too long? R steps left. Too short? L steps right.",
        "Return the two positions as a pair: [L, R]. If the builders meet, there is no pair: return nothing.",
      ],
    },
    story:
      "The planks are laid out from shortest to longest. Find two planks that together are exactly the target length, and report their positions. If no two planks fit, report nothing.",
    keywords: ["shortest to longest", "two planks", "together"],
    inputs: [
      { name: "planks", type: "number[]", label: "planks" },
      { name: "target", type: "number", label: "target" },
    ],
    size: { min: 0, max: 100_000 },
    output: { kind: "return" },
    examples: [{ input: { planks: [1, 3, 4, 6, 8, 11, 15], target: 14 } }, { input: { planks: [2, 7, 11, 15], target: 9 } }],
    tools: {
      statements: ["place", "while", "if", "move", "return"],
      expressions: ["var", "at", "len", "num", "binary", "list", "null"],
      operators: ["+", "-", "==", "<", ">", "<="],
    },
    targets: {
      time: "O(n)",
      space: "O(1)",
      // Reference worst case (no pair, R walks the whole bridge) costs about 10n.
      stamina: { perN: 12, constant: 20 },
      parCards: 8,
      travelLight: true,
    },
    codeVisibility: "victory",
    handMode: false,
    warCouncil: {
      question: "Would the builders' trick still work if the planks were NOT sorted?",
      options: [
        "Yes, always",
        "No: stepping L right only makes the sum bigger because the planks are sorted",
        "Only for small bridges",
        "Only if no two planks have the same length",
      ],
      answer: 1,
      explanation:
        "Every step throws away a plank that can't be part of the answer, and that's only safe because of the order. Unsorted planks need a different weapon (the Goblin Ledger, a hash map).",
    },
    jester: {
      input: { planks: [1, 2, 3, 5, 8, 13, 21, 34], target: 35 },
      teaches: "The only pair is the very first and the very last plank. A builder who starts one plank in misses it.",
    },
  },
  reference: findPair,
  accepts: (input, actual) => {
    const expected = findPair(input);
    if (expected === null) return actual === null;
    if (!Array.isArray(actual) || actual.length !== 2) return false;
    const [i, j] = actual;
    const list = planks(input);
    return typeof i === "number" && typeof j === "number" && 0 <= i && i < j && j < list.length && list[i]! + list[j]! === target(input);
  },
  referencePlan,
  edgeCases: [
    { input: { planks: [2, 2], target: 4 }, label: "two planks of the same length" },
    { input: { planks: [-5, -1, 0, 3], target: -6 }, label: "negative lengths" },
    { input: { planks: [1, 2], target: 5 }, label: "no pair fits" },
    { input: { planks: [], target: 1 }, label: "no planks at all" },
    { input: { planks: [7], target: 14 }, label: "a single plank can't pair with itself" },
  ],
  generate: (n, random) => {
    const list = Array.from({ length: n }, () => randomInt(random, -30, 30)).sort((x, y) => x - y);
    let goal = randomInt(random, -60, 60);
    if (n >= 2 && random() < 0.8) {
      const i = randomInt(random, 0, n - 2);
      const j = randomInt(random, i + 1, n - 1);
      goal = list[i]! + list[j]!;
    }
    return { planks: list, target: goal };
  },
  // No pair exists, so R walks the whole bridge: the longest possible battle.
  worstCase: (n) => ({ planks: Array.from({ length: n }, (_, i) => i), target: -1 }),
};
