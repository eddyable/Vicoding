import { describe, expect, it } from "vitest";
import {
  buildBeats,
  createBuilder,
  declaredNames,
  findExpr,
  findStmt,
  insertStmt,
  locateStmt,
  moveStmt,
  nodeOwners,
  removeStmt,
  replaceExpr,
  run,
  stateAt,
  updateStmt,
  type Program,
} from "../src/index.ts";

const b = createBuilder("t");

function sample() {
  const first = b.set("best", b.hole());
  const inner = b.set("best", b.at("nums", "i"));
  const cond = b.iff([b.when(b.gt(b.at("nums", "i"), "best"), inner)]);
  const loop = b.forEach("i", "nums", cond);
  const ret = b.ret("best");
  return { program: b.program(first, loop, ret), first, inner, cond, loop, ret };
}

const ids = (p: Program) => p.body.map((s) => s.id);

describe("plan editing", () => {
  it("inserts at the top level and inside containers without mutating the original", () => {
    const { program, loop, cond } = sample();
    const before = JSON.stringify(program);
    const card = b.advance("i");

    const top = insertStmt(program, { kind: "root" }, 1, card);
    expect(ids(top)[1]).toBe(card.id);

    const inBranch = insertStmt(program, { kind: "branch", stmt: cond.id, branch: 0 }, 0, card);
    expect(locateStmt(inBranch, card.id)).toEqual({ ref: { kind: "branch", stmt: cond.id, branch: 0 }, index: 0 });

    const inLoop = insertStmt(program, { kind: "body", stmt: loop.id }, 99, card);
    expect(locateStmt(inLoop, card.id)).toEqual({ ref: { kind: "body", stmt: loop.id }, index: 1 });

    expect(JSON.stringify(program)).toBe(before);
  });

  it("removes nested cards", () => {
    const { program, inner } = sample();
    const next = removeStmt(program, inner.id);
    expect(findStmt(next, inner.id)).toBeUndefined();
    expect(findStmt(program, inner.id)).toBeDefined();
  });

  it("moves cards within and across containers", () => {
    const { program, first, ret, loop } = sample();
    expect(ids(moveStmt(program, first.id, { kind: "root" }, 3))).toEqual([loop.id, ret.id, first.id]);
    expect(ids(moveStmt(program, ret.id, { kind: "root" }, 0))).toEqual([ret.id, first.id, loop.id]);

    const intoLoop = moveStmt(program, ret.id, { kind: "body", stmt: loop.id }, 0);
    expect(locateStmt(intoLoop, ret.id)?.ref).toEqual({ kind: "body", stmt: loop.id });
  });

  it("refuses to move a card into itself", () => {
    const { program, loop, cond } = sample();
    expect(moveStmt(program, loop.id, { kind: "branch", stmt: cond.id, branch: 0 }, 0)).toBe(program);
  });

  it("fills a slot and edits card fields", () => {
    const { program, first } = sample();
    const slot = first.kind === "set" ? first.value : undefined;
    const filled = replaceExpr(program, slot!.id, b.at("nums", 0));
    expect(findExpr(filled, slot!.id)).toBeUndefined();
    expect(run(filled, { nums: [4, 9, 2] }).outcome).toEqual({ kind: "returned", value: 9 });

    const renamed = updateStmt(filled, first.id, (s) => (s.kind === "set" ? { ...s, name: "top" } : s));
    expect(declaredNames(renamed)).toEqual({ pointers: ["i"], banners: ["top", "best"] });
  });
});

describe("timeline helpers", () => {
  const plan = b.program(
    b.place("L", "letters", 0),
    b.place("R", "letters", b.sub(b.len("letters"), 1)),
    b.whileLoop(b.lt("L", "R"), b.swap("letters", "L", "R"), b.advance("L"), b.retreat("R")),
  );
  const inputs = { letters: ["a", "b", "c"] };

  it("maps every node to its card", () => {
    const owners = nodeOwners(plan);
    const loop = plan.body[2]!;
    expect(loop.kind === "while" && owners.get(loop.cond.id)).toBe(loop.id);
  });

  it("groups events into one beat per card, splitting loop rounds", () => {
    const { events } = run(plan, inputs);
    const beats = buildBeats(events, nodeOwners(plan));
    const [placeL, placeR, loop, swap, advance, retreat] = plan.body.flatMap((s) => (s.kind === "while" ? [s, ...s.body] : [s]));

    expect(beats.map((beat) => beat.stmt)).toEqual([
      placeL!.id,
      placeR!.id,
      loop!.id, // L<R ✔ + round 1
      swap!.id,
      advance!.id,
      retreat!.id,
      loop!.id, // L<R ✘
    ]);
    // Beats cover every event exactly once, in order.
    expect(beats[0]!.start).toBe(0);
    expect(beats.at(-1)!.end).toBe(events.length - 1);
    beats.slice(1).forEach((beat, i) => expect(beat.start).toBe(beats[i]!.end + 1));
  });

  it("tracks tile identities through swaps", () => {
    const { events } = run(plan, inputs);
    const final = stateAt(inputs, events, events.length - 1);
    expect(final.arrays.letters).toEqual(["c", "b", "a"]);
    expect(final.tileIds.letters).toEqual([2, 1, 0]);
  });
});
