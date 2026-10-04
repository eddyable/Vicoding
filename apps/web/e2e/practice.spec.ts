import { expect, test, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("vicoding:v0:analytics-consent", "granted"));
});

/** Right answers for a fresh player's first sitting, in the order the puzzles come. */
const FIRST_SITTING = ["moves", "9", "max", "stays", "1"];

async function answer(page: Page, value: string) {
  await page.locator(`[data-answer="${value}"]`).click();
}

test("practice: watch, answer five micro-puzzles, see the score, and the map remembers", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Quick practice/ }).click();
  await page.getByRole("button", { name: /Ready/ }).click();

  for (const [i, value] of FIRST_SITTING.entries()) {
    await answer(page, value);
    await expect(page.getByText("Yes!")).toBeVisible();
    await page.getByRole("button", { name: i === FIRST_SITTING.length - 1 ? /Finish/ : /Next/ }).click();
  }
  await expect(page.getByLabel("Score 5 of 5")).toBeVisible();
  await expect(page.getByText(/Next review tomorrow/)).toBeVisible();

  await page.getByRole("button", { name: "Map", exact: true }).click();
  await expect(page.getByRole("button", { name: /Quick practice/ })).toContainText("3 ready");
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("vicoding:v0:practice") ?? "{}") as Record<string, { box: number }>);
  expect(Object.values(stored).map((c) => c.box)).toEqual([1, 1, 1, 1, 1]);
});

test("practice: a wrong answer comes back once more and returns first next sitting", async ({ page }) => {
  await page.goto("/?practice=1");
  await page.getByRole("button", { name: /Ready/ }).click();

  await answer(page, "stays");
  await expect(page.getByText("Not quite.")).toBeVisible();
  await page.getByRole("button", { name: /Next/ }).click();

  for (const value of FIRST_SITTING.slice(1)) {
    await answer(page, value);
    await page.getByRole("button", { name: /Next|Finish/ }).click();
  }
  await expect(page.getByText("Once more")).toBeVisible();
  await answer(page, "moves");
  await page.getByRole("button", { name: /Finish/ }).click();
  await expect(page.getByText("Missed ones come back first next time.")).toBeVisible();

  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("vicoding:v0:practice") ?? "{}") as Record<string, { box: number }>);
  expect(stored["max/moves-1"]?.box).toBe(0);

  await page.getByRole("button", { name: "Map", exact: true }).click();
  await page.getByRole("button", { name: /Quick practice/ }).click();
  await page.getByRole("button", { name: /Ready/ }).click();
  // The missed puzzle is due again, so it leads the next sitting, followed by the three never seen.
  await expect(page.getByText("Does the flag move?")).toBeVisible();
  await expect(page.locator(".dots .dot")).toHaveCount(4);
});

test("practice: fits a phone without sideways scrolling", async ({ page }) => {
  await page.goto("/?practice=1");
  await page.getByRole("button", { name: /Ready/ }).click();
  for (const value of FIRST_SITTING) {
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
    await answer(page, value);
    await page.getByRole("button", { name: /Next|Finish/ }).click();
  }
});
