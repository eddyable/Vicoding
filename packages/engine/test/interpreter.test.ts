import { describe, expect, it } from "vitest";
import { countCards, createBuilder, run, stateAt, type EngineEvent, type Program } from "../src/index.ts";

const b = createBuilder();

/** The converging two-pointer plan from "The Bridge of Planks" (walkthrough 05 §1). */
function bridgePlan(): Program {
  const sum = () => b.add(b.at("planks", "L"), b.at("planks", "R"));
  return b.program(
    b.place("L", "planks", 0),
    b.place("R", "planks", b.sub(b.len("planks"), 1)),
    b.whileLoop(
      b.lt("L", "R"),
      b.iff([b.when(b.eq(sum(), "target"), b.ret(b.list("L", "R"))), b.when(b.lt(sum(), "target"), b.advance("L"))], [b.retreat("R")]),
    ),
    b.ret(b.nil()),
  );
}

/** Grukk's way: try every pair with nested loops. */
function bruteForcePlan(): Program {
  return b.program(
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
}

const moves = (events: EngineEvent[]) =>
  events.filter((e) => e.type === "agent.move").map((e) => (e.type === "agent.move" ? `${e.agent}:${e.from}->${e.to}` : ""));

describe("The Bridge of Planks (two pointers)", () => {
  const inputs = { planks: [1, 3, 4, 6, 8, 11, 15], target: 14 };

  it("finds the pair exactly as in the walkthrough trace", () => {
    const result = run(bridgePlan(), inputs);

    expect(result.outcome).toEqual({ kind: "returned", value: [1, 5] });
    expect(result.rounds).toBe(3);
    // Round 1: 1+15=16 > 14 → R retreats. Round 2: 1+11=12 < 14 → L advances. Round 3: 3+11=14 ✔
    expect(moves(result.events)).toEqual(["R:6->5", "L:0->1"]);
  });

  it("returns null when no pair exists", () => {
    const result = run(bridgePlan(), { planks: [1, 2, 3], target: 100 });
    expect(result.outcome).toEqual({ kind: "returned", value: null });
  });

  it("grows linearly while brute force grows quadratically (the Ogre's lesson)", () => {
    const ticksFor = (plan: Program, n: number) =>
      run(plan, { planks: Array.from({ length: n }, (_, i) => i), target: -1 }, { record: false }).ticks;

    const linearRatio = ticksFor(bridgePlan(), 400) / ticksFor(bridgePlan(), 200);
    const quadraticRatio = ticksFor(bruteForcePlan(), 400) / ticksFor(bruteForcePlan(), 200);

    expect(linearRatio).toBeGreaterThan(1.8);
    expect(linearRatio).toBeLessThan(2.2);
    expect(quadraticRatio).toBeGreaterThan(3.6);
    expect(quadraticRatio).toBeLessThan(4.4);
  });

  it("agrees with brute force on the answer", () => {
    expect(run(bruteForcePlan(), inputs).outcome).toEqual({ kind: "returned", value: [1, 5] });
  });
});

describe("errors explain what went wrong", () => {
  it("summons the Off-by-One Imp when a pointer reads past the last tile", () => {
    const plan = b.program(b.place("R", "planks", b.len("planks")), b.ret(b.at("planks", "R")));
    const result = run(plan, { planks: [1, 2, 3] });

    expect(result.outcome.kind).toBe("error");
    if (result.outcome.kind !== "error") return;
    expect(result.outcome.fault.code).toBe("OUT_OF_BOUNDS");
    expect(result.outcome.fault.details).toMatchObject({ array: "planks", index: 3, length: 3, pointer: "R" });
    expect(result.outcome.fault.message).toContain("Off-by-One Imp");
    expect(result.events.at(-1)?.type).toBe("error");
  });

  it("stops an endless loop with the Ouroboros (tick limit)", () => {
    const plan = b.program(b.place("L", "planks", 0), b.whileLoop(b.lt("L", 10), b.set("x", 1)));
    const result = run(plan, { planks: [1] }, { maxTicks: 1_000 });

    expect(result.outcome.kind).toBe("error");
    if (result.outcome.kind === "error") expect(result.outcome.fault.code).toBe("TICK_LIMIT");
    expect(result.ticks).toBe(1_001);
  });

  it("refuses to run an empty slot", () => {
    const result = run(b.program(b.ret(b.hole())), {});
    expect(result.outcome.kind === "error" && result.outcome.fault.code).toBe("HOLE");
  });

  it("reports banners used before they are raised", () => {
    const result = run(b.program(b.ret("best")), {});
    expect(result.outcome.kind === "error" && result.outcome.fault.code).toBe("UNDEFINED_VARIABLE");
  });

  it("rejects comparing a number with text", () => {
    const result = run(b.program(b.ret(b.lt(1, b.str("a")))), {});
    expect(result.outcome.kind === "error" && result.outcome.fault.code).toBe("TYPE_ERROR");
  });

  it("rejects moving something that is not a pointer", () => {
    const result = run(b.program(b.set("x", 0), b.advance("x")), {});
    expect(result.outcome.kind === "error" && result.outcome.fault.code).toBe("NOT_A_POINTER");
  });

  it("rejects division by zero", () => {
    const result = run(b.program(b.ret(b.div(1, 0))), {});
    expect(result.outcome.kind === "error" && result.outcome.fault.code).toBe("DIVISION_BY_ZERO");
  });
});

describe("language semantics", () => {
  it("uses Python-style floor division and modulo", () => {
    expect(run(b.program(b.ret(b.list(b.div(-7, 2), b.mod(-7, 2), b.div(7, 2), b.mod(7, -2)))), {}).outcome).toEqual({
      kind: "returned",
      value: [-4, 1, 3, -1],
    });
  });

  it("supports skip (continue) and break inside a sweep", () => {
    // Sum the even tiles until the first tile above 5.
    const plan = b.program(
      b.set("sum", 0),
      b.forEach(
        "i",
        "nums",
        b.iff([b.when(b.gt(b.at("nums", "i"), 5), b.brk())]),
        b.iff([b.when(b.eq(b.mod(b.at("nums", "i"), 2), 1), b.cont())]),
        b.set("sum", b.add("sum", b.at("nums", "i"))),
      ),
      b.ret("sum"),
    );
    expect(run(plan, { nums: [2, 3, 4, 6, 8] }).outcome).toEqual({ kind: "returned", value: 6 });
  });

  it("short-circuits and/or", () => {
    // The right side would read out of bounds; short-circuiting must skip it.
    const plan = b.program(b.ret(b.and(b.lt(5, b.len("a")), b.eq(b.at("a", 5), 1))));
    expect(run(plan, { a: [1] }).outcome).toEqual({ kind: "returned", value: false });
  });

  it("completes without a victory card when there is no return", () => {
    expect(run(b.program(b.set("x", 1)), {}).outcome).toEqual({ kind: "completed" });
  });

  it("does not mutate the caller's inputs", () => {
    const letters = ["a", "b"];
    run(b.program(b.swap("letters", 0, 1)), { letters });
    expect(letters).toEqual(["a", "b"]);
  });
});

describe("the Battle Chronicle (events)", () => {
  const reverse = b.program(
    b.place("L", "letters", 0),
    b.place("R", "letters", b.sub(b.len("letters"), 1)),
    b.whileLoop(b.lt("L", "R"), b.swap("letters", "L", "R"), b.advance("L"), b.retreat("R")),
  );
  const inputs = { letters: ["s", "t", "r", "e", "s", "s", "e", "d"] };

  it("replays to the same final board as the run", () => {
    const result = run(reverse, inputs);
    const final = stateAt(inputs, result.events, result.events.length - 1);

    expect(result.finalArrays.letters?.join("")).toBe("desserts");
    expect(final.arrays.letters).toEqual(result.finalArrays.letters);
    expect(final.pointers).toEqual({ L: { array: "letters", index: 4 }, R: { array: "letters", index: 3 } });
    expect(final.tick).toBe(result.ticks);
  });

  it("can rebuild any earlier frame for scrubbing", () => {
    const result = run(reverse, inputs);
    const firstSwap = result.events.findIndex((e) => e.type === "array.swap");

    expect(stateAt(inputs, result.events, firstSwap - 1).arrays.letters?.join("")).toBe("stressed");
    expect(stateAt(inputs, result.events, firstSwap).arrays.letters?.join("")).toBe("dtresses");
    expect(stateAt(inputs, result.events, -1).pointers).toEqual({});
  });

  it("numbers events in order with non-decreasing ticks", () => {
    const { events } = run(reverse, inputs);
    events.forEach((event, i) => expect(event.seq).toBe(i));
    for (let i = 1; i < events.length; i += 1) expect(events[i]!.tick).toBeGreaterThanOrEqual(events[i - 1]!.tick);
  });

  it("costs the same with recording off, and records nothing", () => {
    const recorded = run(reverse, inputs);
    const silent = run(reverse, inputs, { record: false });
    expect(silent.events).toEqual([]);
    expect(silent.ticks).toBe(recorded.ticks);
    expect(silent.finalArrays).toEqual(recorded.finalArrays);
  });

  it("stops recording at maxEvents but keeps running", () => {
    const result = run(reverse, inputs, { maxEvents: 5 });
    expect(result.events).toHaveLength(5);
    expect(result.truncated).toBe(true);
    expect(result.finalArrays.letters?.join("")).toBe("desserts");
  });

  it("marks loop rounds for the timeline", () => {
    const { events, rounds } = run(reverse, inputs);
    const roundEvents = events.filter((e) => e.type === "loop.round");
    expect(rounds).toBe(4);
    expect(roundEvents.map((e) => (e.type === "loop.round" ? e.round : 0))).toEqual([1, 2, 3, 4]);
  });
});

describe("countCards", () => {
  it("counts every card, including nested ones", () => {
    expect(countCards(bridgePlan())).toBe(8);
  });
});
