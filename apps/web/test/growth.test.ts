import { createBuilder } from "@vicoding/engine";
import { getLevel } from "@vicoding/levels";
import { describe, expect, it } from "vitest";
import { growthShape, measureGrowth } from "../src/game/growth.ts";

describe("Ogre's Shadow", () => {
  const level = getLevel("arraia-01-tallest-scroll")!;

  it("measures a linear plan inside the budget at every size", () => {
    const points = measureGrowth(level, level.referencePlan);
    expect(points.every((p) => p.ticks !== undefined && p.ticks <= p.budget)).toBe(true);
    expect(growthShape(points)).toBe("linear");
  });

  it("measures the full curve of a quadratic plan, without the Horde's cap", () => {
    const b = createBuilder("g-");
    const bruteForce = b.program(
      b.forEach(
        "i",
        "scrolls",
        b.set("tallest", b.bool(true)),
        b.forEach("j", "scrolls", b.iff([b.when(b.gt(b.at("scrolls", "j"), b.at("scrolls", "i")), b.set("tallest", b.bool(false)))])),
        b.iff([b.when(b.eq("tallest", b.bool(true)), b.ret(b.at("scrolls", "i")))]),
      ),
    );
    const points = measureGrowth(level, bruteForce);
    expect(points.every((p) => p.ticks !== undefined)).toBe(true);
    // Doubling n roughly quadruples the work.
    const [a, b2] = points.slice(-2);
    expect(b2!.ticks! / a!.ticks!).toBeGreaterThan(3.5);
    expect(growthShape(points)).toBe("faster");
  });
});
