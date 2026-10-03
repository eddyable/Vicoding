import { execFileSync } from "node:child_process";
import { createBuilder, valuesEqual, walkStmts, type Inputs, type Program, type Value } from "@vicoding/engine";
import { levels, seededRandom, randomInt, type LevelModule } from "@vicoding/levels";
import { describe, expect, it } from "vitest";
import { functionName, generate, toSource, type Language } from "../src/index.ts";

function sourceFor(level: LevelModule, program: Program, language: Language): { source: string; name: string; params: string[] } {
  const name = functionName(level.definition.title, language);
  const params = level.definition.inputs.map((i) => i.name);
  return { source: toSource(generate(program, { language, name, params })), name, params };
}

/** Inputs to check: examples, edge cases, the Jester's attack and random inputs. */
function inputsFor(level: LevelModule): Inputs[] {
  const random = seededRandom(level.definition.order * 31);
  const randomInputs = Array.from({ length: 40 }, () =>
    level.generate(randomInt(random, level.definition.size.min, Math.max(level.definition.size.min, 12)), random),
  );
  return [...level.definition.examples.map((e) => e.input), ...level.edgeCases.map((e) => e.input), level.definition.jester.input, ...randomInputs];
}

/** The answer the code produced: its return value, or the final state of the output array. */
function check(level: LevelModule, input: Inputs, returned: Value, arrays: Record<string, Value[]>): boolean {
  const { output } = level.definition;
  const actual = output.kind === "return" ? returned : arrays[output.name]!;
  return level.accepts ? level.accepts(input, actual) : valuesEqual(actual, level.reference(input));
}

const hasPython = (() => {
  try {
    execFileSync("python3", ["--version"]);
    return true;
  } catch {
    return false;
  }
})();

describe.each(levels.map((l) => [l.definition.title, l] as const))("%s", (_title, level) => {
  it("generated JavaScript gives the right answers", () => {
    const { source, name, params } = sourceFor(level, level.referencePlan, "javascript");
    const fn = new Function(`${source}\nreturn ${name};`)() as (...args: Value[]) => Value;
    for (const input of inputsFor(level)) {
      const args = params.map((p) => (Array.isArray(input[p]) ? (input[p] as Value[]).slice() : input[p]!));
      const returned = fn(...args);
      const arrays = Object.fromEntries(params.map((p, i) => [p, args[i] as Value[]]));
      expect(check(level, input, returned ?? null, arrays), `${source}\n${JSON.stringify(input)}`).toBe(true);
    }
  });

  it.skipIf(!hasPython)("generated Python gives the right answers", () => {
    const { source, name, params } = sourceFor(level, level.referencePlan, "python");
    const cases = inputsFor(level);
    const runner = `${source}
import json, sys
results = []
for case in json.load(sys.stdin):
    args = [case[p] for p in ${JSON.stringify(params)}]
    returned = ${name}(*args)
    results.append({"returned": returned, "arrays": {p: a for p, a in zip(${JSON.stringify(params)}, args) if isinstance(a, list)}})
print(json.dumps(results))
`;
    const output = execFileSync("python3", ["-c", runner], { input: JSON.stringify(cases) }).toString();
    const results = JSON.parse(output) as { returned: Value; arrays: Record<string, Value[]> }[];
    results.forEach((r, i) => expect(check(level, cases[i]!, r.returned, r.arrays), `${source}\n${JSON.stringify(cases[i])}`).toBe(true));
  });

  it("links every line to a card of the plan", () => {
    const ids = new Set<string>();
    walkStmts(level.referencePlan.body, (s) => ids.add(s.id));
    for (const language of ["python", "javascript"] as const) {
      const lines = generate(level.referencePlan, { language, name: "f", params: [] });
      const linked = lines.filter((l) => l.node !== undefined);
      expect(linked.every((l) => ids.has(l.node!))).toBe(true);
      // Every card appears in the code.
      expect(new Set(linked.map((l) => l.node))).toEqual(ids);
    }
  });
});

describe("readable output", () => {
  it("writes the Bridge of Planks exactly like the walkthrough's code", () => {
    const level = levels.find((l) => l.definition.order === 4)!;
    expect(sourceFor(level, level.referencePlan, "python").source).toBe(`def bridge_of_planks(planks, target):
    L = 0
    R = len(planks) - 1
    while L < R:
        if planks[L] + planks[R] == target:
            return [L, R]
        elif planks[L] + planks[R] < target:
            L += 1
        else:
            R -= 1
    return None
`);
    expect(sourceFor(level, level.referencePlan, "javascript").source).toBe(`function bridgeOfPlanks(planks, target) {
    let L = 0;
    let R = planks.length - 1;
    while (L < R) {
        if (planks[L] + planks[R] === target) {
            return [L, R];
        } else if (planks[L] + planks[R] < target) {
            L += 1;
        } else {
            R -= 1;
        }
    }
    return null;
}
`);
  });

  it("adds parentheses only where precedence needs them", () => {
    const b = createBuilder("p-");
    const plan = b.program(
      b.set("a", b.mul(b.add(1, 2), 3)),
      b.set("c", b.sub(10, b.sub(4, 1))),
      b.set("d", b.and(b.or(true, false), b.not(b.lt(1, 2)))),
      b.set("e", b.div(7, 2)),
    );
    const py = toSource(generate(plan, { language: "python", name: "f", params: [] }));
    expect(py).toContain("a = (1 + 2) * 3");
    expect(py).toContain("c = 10 - (4 - 1)");
    expect(py).toContain("d = (True or False) and not (1 < 2)");
    expect(py).toContain("e = 7 // 2");
    const js = toSource(generate(plan, { language: "javascript", name: "f", params: [] }));
    expect(js).toContain("let d = (true || false) && !(1 < 2);");
    expect(js).toContain("let e = Math.floor(7 / 2);");
  });

  it("declares names first set inside a block at the top in JavaScript", () => {
    const b = createBuilder("h-");
    const plan = b.program(b.forEach("i", "nums", b.set("last", b.at("nums", "i"))), b.ret("last"));
    const js = toSource(generate(plan, { language: "javascript", name: "f", params: ["nums"] }));
    expect(js).toContain("let last;");
    expect(js).toContain("        last = nums[i];");
    const fn = new Function(`${js}\nreturn f;`)() as (nums: number[]) => number;
    expect(fn([4, 8, 2])).toBe(2);
  });

  it("names functions in each language's style", () => {
    expect(functionName("The Bridge of Planks", "python")).toBe("bridge_of_planks");
    expect(functionName("The Bridge of Planks", "javascript")).toBe("bridgeOfPlanks");
    expect(functionName("Mirror Twins", "javascript")).toBe("mirrorTwins");
  });

  it("shows empty slots as blanks", () => {
    const b = createBuilder("x-");
    const lines = generate(b.program(b.whileLoop(b.hole())), { language: "python", name: "f", params: [] });
    expect(toSource(lines)).toBe("def f():\n    while ___:\n        pass\n");
  });
});
