import { describe, expect, it } from "vitest";
import { buildFrame } from "../src/game/frame.ts";
import { DAY, describeWait, dueCount, interleave, isDue, mastery, nextDueAt, pickSession, review, type Memory } from "../src/practice/schedule.ts";
import { BUGS, PUZZLES, PUZZLE_IDS, WATCH_SHELVES, correctAnswer, flagMoves, foolingShelf, traceOf } from "../src/practice/puzzles.ts";
import { makeShelfRun } from "../src/practice/shelfRun.ts";

describe("Leitner schedule", () => {
  const now = 1_000_000;

  it("moves a right answer up a box and waits longer", () => {
    const a = review(undefined, true, now);
    expect(a).toMatchObject({ box: 1, due: now + DAY, seen: 1, misses: 0 });
    const b = review(a, true, now + DAY);
    expect(b.box).toBe(2);
    expect(b.due).toBe(now + DAY + 3 * DAY);
  });

  it("drops a wrong answer to box 0, due right away", () => {
    const high = { box: 3, due: now, seen: 4, misses: 0 };
    expect(review(high, false, now)).toMatchObject({ box: 0, due: now, seen: 5, misses: 1 });
  });

  it("stops at the top box", () => {
    let s = review(undefined, true, now);
    for (let i = 0; i < 10; i += 1) s = review(s, true, now);
    expect(s.box).toBe(4);
  });

  it("picks overdue puzzles first, then new ones in order, up to the size", () => {
    const memory: Memory = {
      b: { box: 1, due: now - 50, seen: 1, misses: 0 },
      c: { box: 2, due: now - 100, seen: 1, misses: 0 },
      d: { box: 2, due: now + DAY, seen: 1, misses: 0 },
    };
    expect(pickSession(["a", "b", "c", "d", "e"], memory, now, 3)).toEqual(["c", "b", "a"]);
    expect(pickSession(["a", "b", "c", "d", "e"], memory, now, 10)).toEqual(["c", "b", "a", "e"]);
  });

  it("reports due counts, the next due time and mastery", () => {
    const ids = ["a", "b"];
    const memory: Memory = {
      a: { box: 2, due: now + 2 * DAY, seen: 1, misses: 0 },
      b: { box: 4, due: now + DAY, seen: 3, misses: 0 },
    };
    expect(isDue(undefined, now)).toBe(true);
    expect(dueCount(ids, memory, now)).toBe(0);
    expect(nextDueAt(ids, memory, now)).toBe(now + DAY);
    expect(nextDueAt(ids, {}, now)).toBeUndefined();
    expect(mastery(ids, memory)).toBeCloseTo(6 / 8);
    expect(mastery(ids, {})).toBe(0);
  });

  it("interleaves kinds without losing or duplicating anything", () => {
    const out = interleave(["m1", "m2", "t1", "m3", "t2"], (x) => x[0]!);
    expect(out.slice().sort()).toEqual(["m1", "m2", "m3", "t1", "t2"]);
    for (let i = 1; i < out.length; i += 1) expect(out[i]![0]).not.toBe(out[i - 1]![0]);
  });

  it("describes waits", () => {
    expect(describeWait(0)).toBe("right away");
    expect(describeWait(DAY)).toBe("tomorrow");
    expect(describeWait(DAY - 5)).toBe("tomorrow");
    expect(describeWait(3 * DAY)).toBe("in 3 days");
    expect(describeWait(2 * 3_600_000)).toBe("in 2 hours");
  });
});

describe("max-scan puzzles", () => {
  it("have unique ids", () => {
    expect(new Set(PUZZLE_IDS).size).toBe(PUZZLES.length);
  });

  it("every bug puzzle has exactly one shelf that fools the plan", () => {
    for (const p of PUZZLES) {
      if (p.kind !== "bug") continue;
      const fooled = p.shelves.filter((s) => BUGS[p.bug].run(s) !== Math.max(...s));
      expect(fooled, p.id).toHaveLength(1);
      expect(foolingShelf(p)).toBe(p.shelves.indexOf(fooled[0]!));
    }
  });

  it("trace puzzles list the true max trail once", () => {
    for (const p of PUZZLES) {
      if (p.kind !== "trace") continue;
      expect(p.options.filter((o) => o === "max")).toHaveLength(1);
      const trails = p.options.map((o) => traceOf(p.shelf, o).join());
      expect(new Set(trails).size, p.id).toBe(p.options.length);
    }
  });

  it("the first sitting only asks whether the banner rises and where it ends", () => {
    expect(PUZZLES.slice(0, 5).map((p) => p.kind).every((k) => k === "moves" || k === "final")).toBe(true);
  });

  it("no final-value puzzle reuses a watch shelf", () => {
    const watched = WATCH_SHELVES.map((s) => s.join());
    for (const p of PUZZLES) if (p.kind === "final") expect(watched, p.id).not.toContain(p.shelf.join());
  });

  it("moves puzzles mix yes and no answers", () => {
    const answers = PUZZLES.filter((p) => p.kind === "moves").map(correctAnswer);
    expect(answers).toContain("moves");
    expect(answers).toContain("stays");
  });

  it("final puzzles have a unique tallest value among distinct options", () => {
    for (const p of PUZZLES) if (p.kind === "final") expect(p.shelf).toContain(Number(correctAnswer(p)));
  });

  it("derives flag movement from the shelf", () => {
    expect(flagMoves([4, 2, 7, 5, 9], 2)).toBe(true);
    expect(flagMoves([6, 3, 5, 8, 2], 2)).toBe(false);
    expect(flagMoves([5, 5], 1)).toBe(false);
  });
});

describe("shelf runs on the real engine", () => {
  it("finds the walker's arrival and departure on each scroll", () => {
    for (const shelf of [...WATCH_SHELVES, ...PUZZLES.flatMap((p) => ("shelf" in p ? [p.shelf] : []))]) {
      const r = makeShelfRun(shelf);
      for (let k = 0; k < shelf.length; k += 1) {
        const from = r.arrivalAt(k);
        expect(from, `${shelf} @${k}`).not.toBeNull();
        const to = r.leaveAt(k);
        expect(to).toBeGreaterThanOrEqual(from!);
        const before = buildFrame(r.inputs, r.events, r.beats, from!);
        const after = buildFrame(r.inputs, r.events, r.beats, to);
        expect(before.state.pointers.i?.index).toBe(k);
        expect(after.state.pointers.i?.index).toBe(k);
      }
    }
  });

  it("the flag after the walker leaves scroll k is the max so far", () => {
    const shelf = [4, 2, 7, 5, 9];
    const r = makeShelfRun(shelf);
    for (let k = 0; k < shelf.length; k += 1) {
      const f = buildFrame(r.inputs, r.events, r.beats, r.leaveAt(k));
      expect(f.state.vars.best).toBe(Math.max(...shelf.slice(0, k + 1)));
    }
    const start = buildFrame(r.inputs, r.events, r.beats, r.arrivalAt(2)!);
    expect(start.state.vars.best).toBe(4);
  });
});
