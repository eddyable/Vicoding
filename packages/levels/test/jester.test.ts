import { createBuilder, run } from "@vicoding/engine";
import { describe, expect, it } from "vitest";
import { charge, findDivergence, fuzz, getLevel, runCase } from "../src/index.ts";

const b = createBuilder("jt-");

describe("the Jester's fuzzing", () => {
  const tallest = getLevel("arraia-01-tallest-scroll")!;

  // Subtle bug: the sweep stops one tile early, so the last scroll is never checked.
  const ignoresLast = b.program(
    b.set("best", b.at("scrolls", 0)),
    b.place("i", "scrolls", 0),
    b.whileLoop(
      b.lt("i", b.sub(b.len("scrolls"), 1)),
      b.iff([b.when(b.gt(b.at("scrolls", "i"), "best"), b.set("best", b.at("scrolls", "i")))]),
      b.advance("i"),
    ),
    b.ret("best"),
  );

  it("finds a failing input and shrinks it to the smallest trap", () => {
    const found = fuzz(tallest, ignoresLast);
    expect(found).toBeDefined();
    const scrolls = found!.input.scrolls as number[];
    // Smallest possible trap: two scrolls where the last one is taller.
    expect(scrolls).toHaveLength(2);
    expect(scrolls[1]!).toBeGreaterThan(scrolls[0]!);
    expect(runCase(tallest, ignoresLast, found!.input).passed).toBe(false);
  });

  it("finds nothing wrong with a correct plan", () => {
    expect(fuzz(tallest, tallest.referencePlan)).toBeUndefined();
  });

  it("is deterministic for a given seed", () => {
    expect(fuzz(tallest, ignoresLast, { seed: 7 })?.input).toEqual(fuzz(tallest, ignoresLast, { seed: 7 })?.input);
  });
});

describe("findDivergence", () => {
  it("points at the crash", () => {
    const level = getLevel("arraia-03-imp-on-the-bridge")!;
    const input = { letters: [..."bridge"] };
    const result = run(level.definition.starterPlan!, input);
    expect(result.events[findDivergence(level, input, result)!]?.type).toBe("error");
  });

  it("points at the last move that left a tile wrong", () => {
    const level = getLevel("arraia-05-clearing-the-road")!;
    // Bug: W steps forward on every tile, not only after placing a cart.
    const writerAlwaysMoves = b.program(
      b.place("W", "road", 0),
      b.forEach("R", "road", b.iff([b.when(b.ne(b.at("road", "R"), 0), b.swap("road", "W", "R"))]), b.advance("W")),
    );
    const input = level.definition.jester.input;
    const result = run(writerAlwaysMoves, input);
    const at = findDivergence(level, input, result)!;
    const event = result.events[at]!;
    expect(event.type).toBe("array.swap");
    expect(event.type === "array.swap" && [event.i, event.j]).toEqual([3, 3]);
  });

  it("is undefined for a correct run, and points at a wrong return", () => {
    const level = getLevel("arraia-04-bridge-of-planks")!;
    const input = level.definition.examples[0]!.input;
    expect(findDivergence(level, input, run(level.referencePlan, input))).toBeUndefined();

    const wrong = b.program(b.ret(b.list(0, 1)));
    const result = run(wrong, input);
    expect(result.events[findDivergence(level, input, result)!]?.type).toBe("return");
  });
});

describe("Bridge of Planks", () => {
  const level = getLevel("arraia-04-bridge-of-planks")!;

  it("accepts any valid pair and rejects invalid ones", () => {
    const input = { planks: [1, 2, 3, 4], target: 5 };
    expect(level.accepts!(input, [0, 3])).toBe(true);
    expect(level.accepts!(input, [1, 2])).toBe(true);
    expect(level.accepts!(input, [2, 1])).toBe(false);
    expect(level.accepts!(input, [0, 0])).toBe(false);
    expect(level.accepts!(input, null)).toBe(false);
    expect(level.accepts!({ planks: [1, 2], target: 9 }, null)).toBe(true);
  });

  it("the Jester catches a builder who starts one plank in", () => {
    const sum = () => b.add(b.at("planks", "L"), b.at("planks", "R"));
    const startsEarly = b.program(
      b.place("L", "planks", 0),
      b.place("R", "planks", b.sub(b.len("planks"), 2)),
      b.whileLoop(
        b.lt("L", "R"),
        b.iff([b.when(b.eq(sum(), "target"), b.ret(b.list("L", "R"))), b.when(b.lt(sum(), "target"), b.advance("L"))], [b.retreat("R")]),
      ),
      b.ret(b.nil()),
    );
    const report = charge(level, startsEarly);
    expect(report.cases.find((c) => c.label === "The Jester's attack")?.passed).toBe(false);
  });

  it("Grukk's nested loops are correct but summon the Ogre", () => {
    const bruteForce = b.program(
      b.forEach(
        "i",
        "planks",
        b.place("j", "planks", b.add("i", 1)),
        b.whileLoop(
          b.lt("j", b.len("planks")),
          b.iff([b.when(b.eq(b.add(b.at("planks", "i"), b.at("planks", "j")), "target"), b.ret(b.list("i", "j")))]),
          b.advance("j"),
        ),
      ),
      b.ret(b.nil()),
    );
    const report = charge(level, bruteForce);
    expect(report.firstFailure).toBeUndefined();
    expect(report.horde.overwhelmed).toBe(true);
    expect(report.stars).toBe(1);
  });
});
