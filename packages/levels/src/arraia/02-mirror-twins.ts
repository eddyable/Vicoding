import { createBuilder, type Inputs } from "@vicoding/engine";
import { randomInt } from "../random.ts";
import type { LevelModule } from "../types.ts";

const b = createBuilder("l2-");

/** Twins start at both ends, swap, and walk toward each other until they meet. */
const referencePlan = b.program(
  b.place("L", "letters", 0),
  b.place("R", "letters", b.sub(b.len("letters"), 1)),
  b.whileLoop(b.lt("L", "R"), b.swap("letters", "L", "R"), b.advance("L"), b.retreat("R")),
);

const letters = (input: Inputs) => input.letters as string[];
const ALPHABET = "abcdefghijklmnopqrstuvwxyz";

export const mirrorTwins: LevelModule = {
  definition: {
    id: "arraia-02-mirror-twins",
    order: 2,
    realm: "arraia",
    title: "Mirror Twins",
    source: "Reverse a string / array in place",
    step: "watch",
    mentor: {
      name: "Captain Ada Ironquill",
      intro: "The Mirror Twins guard the bridge. One starts on the left bank, one on the right. Watch how they work. Predict first, then press play.",
      hints: [
        "Follow L and R: each round they swap their tiles, then take one step toward each other.",
        "They stop as soon as L is no longer left of R.",
      ],
    },
    story: "A spell wrote the bridge's name backwards. The twins fix it by swapping letters from both ends, meeting in the middle.",
    keywords: ["both ends", "meeting in the middle"],
    inputs: [{ name: "letters", type: "char[]", label: "letters" }],
    size: { min: 0, max: 100_000 },
    output: { kind: "array", name: "letters" },
    examples: [{ input: { letters: [..."stressed"] } }, { input: { letters: [..."hello"] } }],
    tools: {
      statements: ["place", "while", "swap", "move"],
      expressions: ["var", "len", "num", "binary"],
      operators: ["<", "<=", "-"],
    },
    targets: {
      time: "O(n)",
      space: "O(1)",
      // Reference costs 2n + 4 on even lengths.
      stamina: { perN: 3, constant: 10 },
      parCards: 6,
      travelLight: true,
    },
    handMode: false,
    starterPlan: referencePlan,
    foresight: {
      question: 'The twins reverse "stressed" (8 letters, tiles 0–7). When they stop, which tile is L standing on?',
      options: ["Tile 3", "Tile 4", "Tile 7", "They never stop"],
      answer: 1,
      explanation: "After 4 swaps L has walked 0→4 and R has walked 7→3. L is no longer left of R, so they stop, having just crossed in the middle.",
    },
    warCouncil: {
      question: "How many swaps do the twins make on a word of 8 letters?",
      options: ["8", "4", "16", "7"],
      answer: 1,
      explanation: "Each swap fixes two letters at once, so n letters need n/2 swaps: still O(n), with no extra space.",
    },
    jester: {
      input: { letters: [] },
      teaches: "An empty bridge: R starts at -1, so the twins must not swap at all.",
    },
  },
  reference: (input) => letters(input).slice().reverse(),
  referencePlan,
  edgeCases: [
    { input: { letters: [] }, label: "an empty word" },
    { input: { letters: ["a"] }, label: "a single letter" },
    { input: { letters: ["a", "b"] }, label: "two letters" },
    { input: { letters: [..."racecar"] }, label: "an odd-length palindrome" },
  ],
  generate: (n, random) => ({
    letters: Array.from({ length: n }, () => ALPHABET[randomInt(random, 0, ALPHABET.length - 1)] as string),
  }),
  worstCase: (n) => ({ letters: Array.from({ length: n }, (_, i) => ALPHABET[i % ALPHABET.length] as string) }),
};
