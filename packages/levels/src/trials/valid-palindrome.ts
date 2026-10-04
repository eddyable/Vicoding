/**
 * The transfer test (PRD §6): a fresh two-pointer problem in plain code, with
 * no cards and no board. Passing it is the evidence that the game's visual
 * lessons carry over to real interview code.
 */

export interface TrialCase {
  args: (string | number | boolean)[];
  expected: string | number | boolean;
}

export interface TrialDefinition {
  id: string;
  title: string;
  source: string;
  functionName: string;
  statement: string;
  /** Shown in the problem statement. */
  examples: TrialCase[];
  /** Run on submit; include the examples. */
  cases: TrialCase[];
  starterCode: string;
  solution: string;
  /** Soft limit in minutes before "show solution" is offered (FR-52). */
  softLimitMinutes: number;
}

export const validPalindrome: TrialDefinition = {
  id: "trial-valid-palindrome",
  title: "Valid Palindrome",
  source: "Valid Palindrome",
  functionName: "is_palindrome",
  statement:
    "A phrase is a palindrome if, after turning all uppercase letters into lowercase and removing every character that is not a letter or a digit, it reads the same forward and backward. Given a string s, return True if it is a palindrome, or False otherwise.",
  examples: [
    { args: ["A man, a plan, a canal: Panama"], expected: true },
    { args: ["race a car"], expected: false },
  ],
  cases: [
    { args: ["A man, a plan, a canal: Panama"], expected: true },
    { args: ["race a car"], expected: false },
    { args: [" "], expected: true },
    { args: [""], expected: true },
    { args: ["a"], expected: true },
    { args: ["ab"], expected: false },
    { args: ["aa"], expected: true },
    { args: ["0P"], expected: false },
    { args: ["ab_a"], expected: true },
    { args: [".,"], expected: true },
    { args: ["No 'x' in Nixon"], expected: true },
    { args: ["Was it a car or a cat I saw?"], expected: true },
    { args: ["abcdba"], expected: false },
    { args: ["12321"], expected: true },
    { args: ["1a2"], expected: false },
  ],
  starterCode: `def is_palindrome(s):
    # Return True if s reads the same forward and backward,
    # ignoring case and anything that isn't a letter or digit.
    pass
`,
  solution: `def is_palindrome(s):
    L, R = 0, len(s) - 1
    while L < R:
        if not s[L].isalnum():
            L += 1
        elif not s[R].isalnum():
            R -= 1
        elif s[L].lower() != s[R].lower():
            return False
        else:
            L += 1
            R -= 1
    return True
`,
  softLimitMinutes: 15,
};
