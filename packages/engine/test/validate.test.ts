import { describe, expect, it } from "vitest";
import { createBuilder, validate } from "../src/index.ts";

const b = createBuilder();
const context = { arrays: ["nums"], scalars: ["target"] };

describe("validate", () => {
  it("accepts a complete plan", () => {
    const plan = b.program(
      b.set("best", b.at("nums", 0)),
      b.forEach("i", "nums", b.iff([b.when(b.gt(b.at("nums", "i"), "best"), b.set("best", b.at("nums", "i")))])),
      b.ret("best"),
    );
    expect(validate(plan, context)).toEqual([]);
  });

  it("flags every empty slot", () => {
    const first = b.hole();
    const second = b.hole();
    const plan = b.program(b.set("x", first), b.whileLoop(second));
    expect(validate(plan, context).map((i) => [i.code, i.node])).toEqual([
      ["HOLE", first.id],
      ["HOLE", second.id],
    ]);
  });

  it("flags unknown arrays, unknown names, non-pointers and stray breaks", () => {
    const plan = b.program(b.ret(b.at("planks", 0)), b.ret("ghost"), b.advance("target"), b.brk());
    expect(validate(plan, context).map((i) => i.code)).toEqual([
      "UNKNOWN_ARRAY",
      "UNDEFINED_VARIABLE",
      "NOT_A_POINTER",
      "BREAK_OUTSIDE_LOOP",
    ]);
  });

  it("knows scalar inputs and pointers declared anywhere", () => {
    const plan = b.program(b.forEach("i", "nums", b.iff([b.when(b.eq(b.at("nums", "i"), "target"), b.ret("i"))])), b.ret(-1));
    expect(validate(plan, context)).toEqual([]);
  });
});
