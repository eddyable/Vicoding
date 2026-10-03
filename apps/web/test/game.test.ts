import { buildBeats, insertStmt, nodeOwners, run, validate } from "@vicoding/engine";
import { getLevel } from "@vicoding/levels";
import { describe, expect, it } from "vitest";
import { buildFrame } from "../src/game/frame.ts";
import { describeEvent } from "../src/game/narrate.ts";
import { isUnlocked } from "../src/game/progress.ts";
import { isValidName, newCard } from "../src/game/templates.ts";

describe("buildFrame", () => {
  const level = getLevel("arraia-02-mirror-twins")!;
  const plan = level.definition.starterPlan!;
  const input = { letters: [..."stressed"] };
  const result = run(plan, input);
  const beats = buildBeats(result.events, nodeOwners(plan));

  it("starts with the untouched board", () => {
    const frame = buildFrame(input, result.events, beats, 0);
    expect(frame.state.arrays.letters?.join("")).toBe("stressed");
    expect(frame.activeCard).toBeUndefined();
    expect(frame.caption).toMatch(/press play/i);
  });

  it("highlights the active card and the swapped tiles", () => {
    const swapBeat = beats.findIndex((b) => result.events[b.start]?.type === "array.swap");
    const frame = buildFrame(input, result.events, beats, swapBeat + 1);
    const swapCard = plan.body[2]!.kind === "while" ? plan.body[2]!.body[0]! : undefined;

    expect(frame.activeCard).toBe(swapCard?.id);
    expect(frame.changed).toEqual([
      { array: "letters", index: 0 },
      { array: "letters", index: 7 },
    ]);
    expect(frame.caption).toBe("Swap tiles 0 and 7");
  });

  it("records pointer footprints and ends with the final board", () => {
    const frame = buildFrame(input, result.events, beats, beats.length);
    expect(frame.state.arrays.letters?.join("")).toBe("desserts");
    expect(frame.trails.L).toEqual([0, 1, 2, 3, 4]);
    expect(frame.trails.R).toEqual([7, 6, 5, 4, 3]);
  });

  it("clamps out-of-range positions", () => {
    expect(buildFrame(input, result.events, beats, 999).state.arrays.letters?.join("")).toBe("desserts");
    expect(buildFrame(input, result.events, beats, -5).activeCard).toBeUndefined();
  });
});

describe("narration", () => {
  it("describes every kind of event in plain words", () => {
    const level = getLevel("arraia-01-tallest-scroll")!;
    const { events } = run(level.referencePlan, { scrolls: [3, 7] });
    const lines = events.map(describeEvent);
    expect(lines.every((line) => typeof line === "string" && line.length > 0)).toBe(true);
    expect(lines).toContain("best = 3");
    expect(lines).toContain("7 > 3 → yes");
    expect(lines.at(-1)).toBe("Victory! Return 7");
  });
});

describe("card templates", () => {
  it("creates cards with fresh names and empty slots the validator flags", () => {
    let plan = { body: [] as ReturnType<typeof newCard>[] };
    plan = insertStmt(plan, { kind: "root" }, 0, newCard("place", plan, ["letters"]));
    plan = insertStmt(plan, { kind: "root" }, 1, newCard("place", plan, ["letters"]));
    const [first, second] = plan.body;

    expect(first?.kind === "place" && first.pointer).toBe("L");
    expect(second?.kind === "place" && second.pointer).toBe("R");
    expect(validate(plan, { arrays: ["letters"], scalars: [] }).map((i) => i.code)).toEqual(["HOLE", "HOLE"]);
  });

  it("gives every new card a unique id", () => {
    const plan = { body: [] };
    const ids = Array.from({ length: 20 }, () => newCard("if", plan, ["a"]).id);
    expect(new Set(ids).size).toBe(20);
  });

  it("accepts code-like names only", () => {
    expect(isValidName("best")).toBe(true);
    expect(isValidName("L2")).toBe(true);
    expect(isValidName("2L")).toBe(false);
    expect(isValidName("my best")).toBe(false);
    expect(isValidName("")).toBe(false);
  });
});

describe("progress", () => {
  it("unlocks a level once the previous one is completed", () => {
    const order = ["a", "b", "c"];
    expect(isUnlocked({}, order, "a")).toBe(true);
    expect(isUnlocked({}, order, "b")).toBe(false);
    expect(isUnlocked({ a: { stars: 1, completed: true } }, order, "b")).toBe(true);
    expect(isUnlocked({ a: { stars: 1, completed: true } }, order, "c")).toBe(false);
  });
});
