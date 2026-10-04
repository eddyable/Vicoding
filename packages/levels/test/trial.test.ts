import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { validPalindrome } from "../src/index.ts";

const hasPython = (() => {
  try {
    execFileSync("python3", ["--version"]);
    return true;
  } catch {
    return false;
  }
})();

/** Runs Python code against the trial's cases; returns which cases passed. */
function runPython(code: string): boolean[] {
  const runner = `${code}
import json, sys
out = []
for case in json.load(sys.stdin):
    try:
        out.append(${validPalindrome.functionName}(*case["args"]) == case["expected"])
    except Exception:
        out.append(False)
print(json.dumps(out))
`;
  return JSON.parse(execFileSync("python3", ["-c", runner], { input: JSON.stringify(validPalindrome.cases) }).toString()) as boolean[];
}

describe("transfer test: Valid Palindrome", () => {
  it("includes its examples in the hidden cases", () => {
    for (const example of validPalindrome.examples) expect(validPalindrome.cases).toContainEqual(example);
  });

  it.skipIf(!hasPython)("the reference solution passes every case", () => {
    expect(runPython(validPalindrome.solution).every(Boolean)).toBe(true);
  });

  it.skipIf(!hasPython)("the starter code passes no case that needs True or False", () => {
    expect(runPython(validPalindrome.starterCode).some(Boolean)).toBe(false);
  });

  it.skipIf(!hasPython)("common mistakes are caught", () => {
    // Forgets to ignore punctuation.
    expect(runPython("def is_palindrome(s):\n    t = s.lower()\n    return t == t[::-1]\n").every(Boolean)).toBe(false);
    // Forgets to ignore case.
    expect(runPython("def is_palindrome(s):\n    t = [c for c in s if c.isalnum()]\n    return t == t[::-1]\n").every(Boolean)).toBe(false);
    // Treats '_' as a letter (it is not alphanumeric).
    expect(runPython("def is_palindrome(s):\n    t = [c.lower() for c in s if c.isalnum() or c == '_']\n    return t == t[::-1]\n").every(Boolean)).toBe(false);
  });
});
