import { expect, test, type Page } from "@playwright/test";

const ROOT_END = '[data-container="root"] > button.slot-active';
const LOOP_END = '[data-container$=":body"] > button.slot-active';
const IF_END = '[data-container$=":branch:0"] > button.slot-active';

/** Picks a card from the tray and taps the slot where it should go. */
async function placeCard(page: Page, card: string, slot: string) {
  await page.getByRole("button", { name: card, exact: true }).click();
  await page.locator(slot).click();
}

/** Fills the first empty slot in the plan with the named option. */
async function fillNextSlot(page: Page, option: string) {
  await page.getByRole("button", { name: "Empty slot", exact: true }).first().click();
  await page.getByRole("dialog").getByRole("button", { name: option, exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}

async function runToEnd(page: Page) {
  await page.getByRole("button", { name: "▶ Run" }).click();
  await page.getByRole("button", { name: "Jump to end" }).click();
}

async function unlock(page: Page, completed: string[]) {
  await page.addInitScript((ids) => {
    const progress = Object.fromEntries(ids.map((id) => [id, { stars: 3, completed: true }]));
    localStorage.setItem("vicoding:v0:progress", JSON.stringify(progress));
  }, completed);
}

async function expectNoHorizontalScroll(page: Page) {
  // Compare with the device width: mobile browsers widen the layout viewport
  // (and window.innerWidth) to fit overflowing content.
  const deviceWidth = page.viewportSize()!.width;
  const pageWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(pageWidth).toBeLessThanOrEqual(deviceWidth);
}

test("the map starts with only the first level unlocked", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: /The Tallest Scroll/ })).toBeEnabled();
  await expect(page.getByRole("button", { name: /Mirror Twins/ })).toBeDisabled();
  await expect(page.getByRole("button", { name: /The Imp on the Bridge/ })).toBeDisabled();
  await expectNoHorizontalScroll(page);
});

test("level 1: build the plan by tapping cards, run it, and charge for three stars", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /The Tallest Scroll/ }).click();

  // ⚑ best = scrolls[0]
  await placeCard(page, "Raise banner", ROOT_END);
  await fillNextSlot(page, "scrolls[▢]");
  await fillNextSlot(page, "0");

  // ⟳ for each tile with pointer i
  await placeCard(page, "For each tile", ROOT_END);

  //   ⟐ if scrolls[i] > best
  await placeCard(page, "If", LOOP_END);
  await fillNextSlot(page, "▢ > ▢");
  await fillNextSlot(page, "scrolls[i]");
  await fillNextSlot(page, "best");

  //     ⚑ best = scrolls[i]
  await placeCard(page, "Raise banner", IF_END);
  const newName = page.locator(".name-field").nth(2);
  await newName.fill("best");
  await newName.press("Enter");
  await fillNextSlot(page, "scrolls[i]");

  // ⚔ return best
  await placeCard(page, "Victory", ROOT_END);
  await fillNextSlot(page, "best");

  await runToEnd(page);
  await expect(page.locator(".verdict")).toContainText("Correct for this example: 9");
  await expect(page.locator(".victory-banner")).toContainText("returns 9");

  await page.getByRole("button", { name: "⚔ Charge!" }).click();
  const results = page.getByRole("dialog", { name: "Charge results" });
  await expect(results).toContainText("Victory!");
  await expect(results.getByLabel("3 of 3 stars")).toBeVisible();
  await expectNoHorizontalScroll(page);
});

test("level 1: an unfinished plan is flagged instead of run", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /The Tallest Scroll/ }).click();
  await placeCard(page, "Victory", ROOT_END);
  await page.getByRole("button", { name: "▶ Run" }).click();
  await expect(page.getByRole("alert")).toContainText("This slot is still empty");
  await expect(page.locator(".chip-issue")).toHaveCount(1);
});

test("level 2: predict, watch the twins, and charge", async ({ page }) => {
  await unlock(page, ["arraia-01-tallest-scroll"]);
  await page.goto("/");
  await page.getByRole("button", { name: /Mirror Twins/ }).click();

  await page.getByRole("button", { name: "Tile 4" }).click();
  await expect(page.getByRole("button", { name: "Tile 4" })).toHaveClass(/correct/);

  // Step through the first swap one card at a time.
  await page.getByRole("button", { name: "▶ Run" }).click();
  await page.getByRole("button", { name: "Pause" }).click();
  await page.getByRole("button", { name: "Back to start" }).click();
  for (let i = 0; i < 4; i += 1) await page.getByRole("button", { name: "Step forward" }).click();
  await expect(page.locator(".caption")).toHaveText("Swap tiles 0 and 7");
  await expect(page.locator(".card-active")).toContainText("Swap tiles");

  await page.getByRole("button", { name: "Jump to end" }).click();
  await expect(page.locator(".verdict")).toContainText("Correct for this example");
  await expect(page.locator(".row").first()).toHaveAttribute("aria-label", /d, e, s, s, e, r, t, s/);

  await page.getByRole("button", { name: "⚔ Charge!" }).click();
  await expect(page.getByRole("dialog", { name: "Charge results" }).getByLabel("3 of 3 stars")).toBeVisible();
  await expectNoHorizontalScroll(page);
});

test("level 3: meet the Off-by-One Imp, fix the plan, and charge", async ({ page }) => {
  await unlock(page, ["arraia-01-tallest-scroll", "arraia-02-mirror-twins"]);
  await page.goto("/");
  await page.getByRole("button", { name: /The Imp on the Bridge/ }).click();
  await expectNoHorizontalScroll(page);

  await runToEnd(page);
  await expect(page.locator(".verdict")).toContainText("Off-by-One Imp");
  await expect(page.locator(".imp")).toBeVisible();
  await expect(page.locator(".card-error")).toContainText("Swap tiles");

  // R should start at length − 1, not length.
  await page.getByRole("button", { name: "length of letters" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "… - ▢" }).click();
  await fillNextSlot(page, "1");

  await runToEnd(page);
  await expect(page.locator(".verdict")).toContainText("Correct for this example");

  await page.getByRole("button", { name: "⚔ Charge!" }).click();
  const results = page.getByRole("dialog", { name: "Charge results" });
  await expect(results).toContainText("Victory!");
  await results.getByRole("button", { name: "6" }).click();
  await expect(results.locator(".explanation")).toBeVisible();
});
