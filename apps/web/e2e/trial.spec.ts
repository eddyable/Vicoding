import { expect, test, type Page } from "@playwright/test";
import { validPalindrome } from "@vicoding/levels";

const ALL_LEVELS = [
  "arraia-01-tallest-scroll",
  "arraia-02-mirror-twins",
  "arraia-03-imp-on-the-bridge",
  "arraia-04-bridge-of-planks",
  "arraia-05-clearing-the-road",
];

test.beforeEach(async ({ page }) => {
  await page.addInitScript((ids) => {
    localStorage.setItem("vicoding:v0:analytics-consent", "granted");
    localStorage.setItem("vicoding:v0:progress", JSON.stringify(Object.fromEntries(ids.map((id) => [id, { stars: 3, completed: true }]))));
  }, ALL_LEVELS);
});

/** Replaces the editor's content with `code`, without the editor's auto-indent. */
async function setCode(page: Page, code: string) {
  await page.locator(".cm-content").click();
  await page.keyboard.press("ControlOrMeta+a");
  await page.keyboard.press("Backspace");
  await page.keyboard.insertText(code);
}

async function openTrial(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: /The Final Trial/ }).click();
  await expect(page.getByText("Python is ready.")).toBeVisible({ timeout: 60_000 });
}

test("the trial runs real Python: wrong code shows the first failing test, right code passes", async ({ page }) => {
  await openTrial(page);

  // The starter code returns None.
  await page.getByRole("button", { name: "▶ Run the tests" }).click();
  await expect(page.locator(".trial-results")).toContainText(`0 of ${validPalindrome.cases.length} tests passed`);
  await expect(page.locator(".trial-failure")).toContainText("but got None");

  // Forgets to skip punctuation.
  await setCode(page, "def is_palindrome(s):\n    t = s.lower()\n    return t == t[::-1]\n");
  await page.getByRole("button", { name: "▶ Run the tests" }).click();
  await expect(page.locator(".trial-failure")).toContainText('is_palindrome("A man, a plan, a canal: Panama")');

  await setCode(page, validPalindrome.solution);
  await page.getByRole("button", { name: "▶ Run the tests" }).click();
  await expect(page.locator(".trial-results")).toContainText(`${validPalindrome.cases.length} of ${validPalindrome.cases.length} tests passed`);

  // Survey, then the follow-up link.
  await page.getByRole("button", { name: "Continue →" }).click();
  for (const name of ["fun", "clarity", "keep_playing"]) await page.locator(`input[name="${name}"][value="4"]`).check({ force: true });
  await page.getByText("Better than LeetCode").click();
  await page.getByRole("button", { name: "Send feedback" }).click();
  await expect(page.locator(".follow-up code")).toContainText("?trial=followup");

  const events = await page.evaluate(() => JSON.parse(localStorage.getItem("vicoding:v0:events") ?? "[]") as { name: string; props: Record<string, unknown> }[]);
  const submits = events.filter((e) => e.name === "transfer_test_submit");
  expect(submits.map((e) => e.props.passed)).toEqual([false, false, true]);
  expect(events.some((e) => e.name === "survey_submit" && e.props.fun === 4)).toBe(true);
});

test("an infinite loop is stopped and Python comes back", async ({ page }) => {
  test.setTimeout(120_000);
  await openTrial(page);
  await setCode(page, "def is_palindrome(s):\n    while True:\n        pass\n");
  await page.getByRole("button", { name: "▶ Run the tests" }).click();
  await expect(page.locator(".trial-results")).toContainText("ran for too long", { timeout: 20_000 });
  await expect(page.getByText("Python is ready.")).toBeVisible({ timeout: 60_000 });

  await setCode(page, validPalindrome.solution);
  await page.getByRole("button", { name: "▶ Run the tests" }).click();
  await expect(page.locator(".trial-results")).toContainText("tests passed");
});

test("the follow-up link opens the trial directly", async ({ page }) => {
  await page.goto("/?trial=followup");
  await expect(page.getByRole("heading", { name: "The Trial, one day later" })).toBeVisible();
});

test("the researcher export page lists this device's events", async ({ page }) => {
  await page.goto("/");
  await page.goto("/?export=1");
  await expect(page.getByRole("heading", { name: "Playtest data on this device" })).toBeVisible();
  await expect(page.getByText("app_open")).toBeVisible();
});
