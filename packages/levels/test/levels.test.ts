import { describe, expect, it } from "vitest";
import {
  countCards,
  createBuilder,
  run,
  staminaFor,
  stmtExprs,
  validate,
  walkExpr,
  walkStmts,
  type NodeId,
  type Program,
} from "@vicoding/engine";
import { getLevel, levels, runCase, seededRandom, randomInt, type LevelModule } from "../src/index.ts";

function validationContext(level: LevelModule) {
  const { inputs } = level.definition;
  return {
    arrays: inputs.filter((i) => i.type !== "number").map((i) => i.name),
    scalars: inputs.filter((i) => i.type === "number").map((i) => i.name),
  };
}

function usage(program: Program) {
  const statements = new Set<string>();
  const expressions = new Set<string>();
  const operators = new Set<string>();
  const ids: NodeId[] = [];
  walkStmts(program.body, (stmt) => {
    statements.add(stmt.kind);
    ids.push(stmt.id);
    for (const root of stmtExprs(stmt)) {
      walkExpr(root, (expr) => {
        expressions.add(expr.kind);
        ids.push(expr.id);
        if (expr.kind === "binary") operators.add(expr.op);
      });
    }
  });
  return { statements, expressions, operators, ids };
}

describe.each(levels.map((level) => [level.definition.id, level] as const))("level %s", (_id, level) => {
  const { definition, referencePlan } = level;

  it("has a valid reference plan with unique card ids", () => {
    expect(validate(referencePlan, validationContext(level))).toEqual([]);
    const { ids } = usage(referencePlan);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("solves the level using only the tools in its tray", () => {
    const used = usage(referencePlan);
    expect([...used.statements].every((k) => (definition.tools.statements as string[]).includes(k))).toBe(true);
    expect([...used.expressions].every((k) => (definition.tools.expressions as string[]).includes(k))).toBe(true);
    expect([...used.operators].every((k) => (definition.tools.operators as string[]).includes(k))).toBe(true);
  });

  it("stays within par", () => {
    expect(countCards(referencePlan)).toBeLessThanOrEqual(definition.targets.parCards);
  });

  it("passes the examples, edge cases and the Jester's attack", () => {
    const cases = [...definition.examples, ...level.edgeCases, { input: definition.jester.input, label: "jester" }];
    for (const testCase of cases) {
      const outcome = runCase(level, referencePlan, testCase.input);
      expect(outcome.passed, testCase.label ?? JSON.stringify(testCase.input)).toBe(true);
    }
  });

  it("matches the reference on 300 random inputs", () => {
    const random = seededRandom(definition.order * 7919);
    for (let i = 0; i < 300; i += 1) {
      const n = randomInt(random, definition.size.min, Math.min(definition.size.max, 40));
      const input = level.generate(n, random);
      expect(runCase(level, referencePlan, input).passed, JSON.stringify(input)).toBe(true);
    }
  });

  it("fits the stamina budget on worst-case inputs up to the Horde size", () => {
    for (const n of [definition.size.min, 10, 1_000, definition.size.max]) {
      const { ticks, outcome } = run(referencePlan, level.worstCase(n), { record: false });
      expect(outcome.kind).not.toBe("error");
      expect(ticks, `n=${n}`).toBeLessThanOrEqual(staminaFor(definition.targets.stamina, n));
    }
  });

  it("has well-formed questions", () => {
    for (const q of [definition.warCouncil, definition.foresight].filter((q) => q !== undefined)) {
      expect(q.answer).toBeGreaterThanOrEqual(0);
      expect(q.answer).toBeLessThan(q.options.length);
    }
  });

  it("ships a valid starter plan when the step needs one", () => {
    const needsStarter = definition.step === "watch" || definition.step === "fix" || definition.step === "complete";
    expect(definition.starterPlan !== undefined).toBe(needsStarter);
    if (definition.starterPlan) expect(validate(definition.starterPlan, validationContext(level))).toEqual([]);
  });
});

describe("level-specific design promises", () => {
  it("Tallest Scroll: the Jester beats a banner that starts at 0", () => {
    const level = getLevel("arraia-01-tallest-scroll")!;
    const b = createBuilder("bug-");
    const startsAtZero = b.program(
      b.set("best", 0),
      b.forEach("i", "scrolls", b.iff([b.when(b.gt(b.at("scrolls", "i"), "best"), b.set("best", b.at("scrolls", "i")))])),
      b.ret("best"),
    );

    expect(runCase(level, startsAtZero, { scrolls: [3, 7, 2, 9, 4] }).passed).toBe(true);
    const attack = runCase(level, startsAtZero, level.definition.jester.input);
    expect(attack.passed).toBe(false);
    expect(attack.actual).toBe(0);
    expect(attack.expected).toBe(-1);
  });

  it("Mirror Twins: the foresight answer matches what actually happens", () => {
    const level = getLevel("arraia-02-mirror-twins")!;
    const { foresight, starterPlan } = level.definition;
    const result = run(starterPlan!, { letters: [..."stressed"] });

    expect(result.finalArrays.letters?.join("")).toBe("desserts");
    expect(foresight!.options[foresight!.answer]).toBe(`Tile ${result.finalVars.L}`);
  });

  it("levels are in campaign order with unique ids", () => {
    expect(levels.map((l) => l.definition.order)).toEqual([1, 2]);
    expect(new Set(levels.map((l) => l.definition.id)).size).toBe(levels.length);
  });
});
