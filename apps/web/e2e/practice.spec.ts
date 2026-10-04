import { expect, test, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("vicoding:v0:analytics-consent", "granted"));
});

/** Right answers for a fresh player's first sitting, in the order the puzzles come. */
const FIRST_SITTING = ["moves", "8", "stays", "9", "stays"];

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
  await expect(page.getByRole("button", { name: /Quick practice/ })).toContainText("12 ready");
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
  // The missed puzzle is due again, so it leads the next sitting, followed by the new ones.
  await expect(page.getByText("Does the banner rise?")).toBeVisible();
  await expect(page.locator(".dots .dot")).toHaveCount(5);
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

/** Memory where the given puzzles were answered once and are not due for a week. */
async function seedSeen(page: Page, ids: string[]) {
  await page.addInitScript((seen) => {
    const week = Date.now() + 7 * 86_400_000;
    const memory = Object.fromEntries(seen.map((id) => [id, { box: 2, due: week, seen: 1, misses: 0 }]));
    localStorage.setItem("vicoding:v0:practice", JSON.stringify(memory));
  }, ids);
}

const ALL_MAX = ["moves-1", "final-1", "moves-2", "final-2", "moves-3", "trace-1", "final-3", "bug-1", "moves-4", "trace-2", "bug-2"].map((n) => `max/${n}`);

test("practice: the mirror twins are shown running, then asked about", async ({ page }) => {
  await seedSeen(page, ALL_MAX);
  await page.goto("/?practice=1");
  await expect(page.getByText("The twins swap letters from both ends")).toBeVisible();
  await page.getByRole("button", { name: /Ready/ }).click();

  // hello (5 letters) makes 2 swaps; stone reverses to enots; bridges (7) makes 3; moat fools the early-stopping plan; wolf reverses to flow.
  const right = ["2", "reverse", "3", "1", "reverse"];
  for (const [i, value] of right.entries()) {
    await answer(page, value);
    await expect(page.getByText("Yes!")).toBeVisible();
    await page.getByRole("button", { name: i === right.length - 1 ? /Finish/ : /Next/ }).click();
  }
  await expect(page.getByLabel("Score 5 of 5")).toBeVisible();
});

test("practice: a new pattern is watched when it first turns up mid-sitting", async ({ page }) => {
  await seedSeen(page, ALL_MAX.filter((id) => id !== "max/bug-2"));
  await page.goto("/?practice=1");
  await expect(page.getByText("The twins swap letters from both ends")).toHaveCount(0);
  await page.getByRole("button", { name: /Ready/ }).click();

  await expect(page.getByText("Spot the mistake")).toBeVisible();
  await answer(page, "1");
  await page.getByRole("button", { name: /Next/ }).click();

  await expect(page.getByText("The twins swap letters from both ends")).toBeVisible();
  await page.getByRole("button", { name: /Ready/ }).click();
  await expect(page.getByText("How many swaps will the twins make?")).toBeVisible();
});

test("practice: twins questions fit a phone without sideways scrolling", async ({ page }) => {
  await seedSeen(page, ALL_MAX);
  await page.goto("/?practice=1");
  await page.getByRole("button", { name: /Ready/ }).click();
  for (const value of ["2", "reverse", "3", "1", "reverse"]) {
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
    await answer(page, value);
    await page.getByRole("button", { name: /Next|Finish/ }).click();
  }
});
