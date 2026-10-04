import { expect, test, type Page } from "@playwright/test";
import { createBuilder, type Program } from "@vicoding/engine";
import { getLevel } from "@vicoding/levels";

// Answer the consent prompt up front so the banner never covers the game in tests.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("vicoding:v0:analytics-consent", "granted"));
});

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

/** Marks levels as completed, optionally with a saved plan for the level being opened. */
async function unlock(page: Page, completed: string[], plans: Record<string, Program> = {}) {
  await page.addInitScript(
    ({ ids, saved }) => {
      const progress: Record<string, unknown> = Object.fromEntries(ids.map((id) => [id, { stars: 3, completed: true }]));
      for (const [id, plan] of Object.entries(saved)) progress[id] = { stars: 0, completed: false, plan };
      localStorage.setItem("vicoding:v0:progress", JSON.stringify(progress));
    },
    { ids: completed, saved: plans },
  );
}

const ALL_BEFORE = (order: number) =>
  ["arraia-01-tallest-scroll", "arraia-02-mirror-twins", "arraia-03-imp-on-the-bridge", "arraia-04-bridge-of-planks"].slice(0, order - 1);

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
  await page.getByRole("button", { name: "Skip and build the plan myself" }).click();

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
  await expect(page.getByRole("img", { name: "Victory: returns 9" })).toBeVisible();

  await page.getByRole("button", { name: "⚔ Charge!" }).click();
  const results = page.getByRole("dialog", { name: "Charge results" });
  await expect(results).toContainText("Victory!");
  await expect(results.getByLabel("3 of 3 stars")).toBeVisible();
  await expectNoHorizontalScroll(page);
});

test("level 1: an unfinished plan is flagged instead of run", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /The Tallest Scroll/ }).click();
  await page.getByRole("button", { name: "Skip and build the plan myself" }).click();
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

test("level 1: solve it by hand, turn the moves into a plan, and read the Spell Scroll", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /The Tallest Scroll/ }).click();

  // Example 1 is [3, 7, 2, 9, 4]: raise the banner on 3, 7 and 9.
  await page.getByRole("button", { name: "Place the soldier on the first scroll" }).click();
  const raise = page.getByRole("button", { name: "⚑ Raise the banner here" });
  const step = page.getByRole("button", { name: "Step ➜" });
  await raise.click();
  await step.click();
  await raise.click();
  await step.click();
  await step.click();
  await raise.click();
  await step.click();
  await page.getByRole("button", { name: "Report: the tallest is 9" }).click();
  await expect(page.getByText("Exactly! You did it by hand.")).toBeVisible();
  await page.getByRole("button", { name: "Write down my moves as a plan" }).click();

  // The draft has one blank: the rule for when to raise the banner.
  await expect(page.getByRole("alert")).toContainText("This slot is still empty");
  await fillNextSlot(page, "▢ > ▢");
  await fillNextSlot(page, "scrolls[i]");
  await fillNextSlot(page, "best");

  await page.getByRole("button", { name: "⚔ Charge!" }).click();
  const results = page.getByRole("dialog", { name: "Charge results" });
  await expect(results.getByLabel("3 of 3 stars")).toBeVisible();
  await expect(results.locator(".code")).toContainText("def tallest_scroll(scrolls):");
  await expect(results.locator(".code")).toContainText("if scrolls[i] > best:");
  await results.getByRole("tab", { name: "JavaScript" }).click();
  await expect(results.locator(".code")).toContainText("function tallestScroll(scrolls) {");
  await expect(results.locator(".growth-verdict")).toContainText("straight line");
});

test("level 1: hand mode nudges when the banner is missed or lowered", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /The Tallest Scroll/ }).click();
  await page.getByRole("button", { name: "Place the soldier on the first scroll" }).click();

  await page.getByRole("button", { name: "Step ➜" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Raise it here first" })).toContainText("3 is taller");

  await page.getByRole("button", { name: "⚑ Raise the banner here" }).click();
  await page.getByRole("button", { name: "Step ➜" }).click();
  await page.getByRole("button", { name: "⚑ Raise the banner here" }).click();
  await page.getByRole("button", { name: "Step ➜" }).click();
  await page.getByRole("button", { name: "⚑ Raise the banner here" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Raising it here would lower" })).toBeVisible();
});

test("level 1: Grukk's nested loops win one star and summon the Ogre", async ({ page }) => {
  const b = createBuilder("e2e-");
  const bruteForce = b.program(
    b.forEach(
      "i",
      "scrolls",
      b.set("tallest", b.bool(true)),
      b.forEach("j", "scrolls", b.iff([b.when(b.gt(b.at("scrolls", "j"), b.at("scrolls", "i")), b.set("tallest", b.bool(false)))])),
      b.iff([b.when(b.eq("tallest", b.bool(true)), b.ret(b.at("scrolls", "i")))]),
    ),
  );
  await unlock(page, [], { "arraia-01-tallest-scroll": bruteForce });
  await page.goto("/");
  await page.getByRole("button", { name: /The Tallest Scroll/ }).click();
  await page.getByRole("button", { name: "⚔ Charge!" }).click();

  const results = page.getByRole("dialog", { name: "Charge results" });
  await expect(results.getByLabel("1 of 3 stars")).toBeVisible();
  await expect(results.locator(".ogre")).toBeVisible();
  await expect(results.locator(".growth-verdict")).toContainText(/faster|explodes/);
});

test("level 4: the converging builders win three stars and the code matches the walkthrough", async ({ page }) => {
  const level = getLevel("arraia-04-bridge-of-planks")!;
  await unlock(page, ALL_BEFORE(4), { [level.definition.id]: level.referencePlan });
  await page.goto("/");
  await page.getByRole("button", { name: /The Bridge of Planks/ }).click();
  await expect(page.locator(".banner-given")).toContainText("target = 14");

  await runToEnd(page);
  await expect(page.locator(".verdict")).toContainText("Correct for this example: [1, 5]");

  await page.getByRole("button", { name: "⚔ Charge!" }).click();
  const results = page.getByRole("dialog", { name: "Charge results" });
  await expect(results.getByLabel("3 of 3 stars")).toBeVisible();
  await expect(results.locator(".code")).toContainText("elif planks[L] + planks[R] < target:");
});

test("level 5: a buggy writer is caught, and the board rewinds to the step that went wrong", async ({ page }) => {
  const b = createBuilder("e2e5-");
  // Bug: W steps forward on every tile, not only after placing a cart.
  const writerAlwaysMoves = b.program(
    b.place("W", "road", 0),
    b.forEach("R", "road", b.iff([b.when(b.ne(b.at("road", "R"), 0), b.swap("road", "W", "R"))]), b.advance("W")),
  );
  await unlock(page, ALL_BEFORE(5), { "arraia-05-clearing-the-road": writerAlwaysMoves });
  await page.goto("/");
  await page.getByRole("button", { name: /Clearing the Road/ }).click();

  // The code is shown live on this level, and tapping a line highlights its card.
  const code = page.getByRole("region", { name: "Your plan, live as code" });
  await expect(code).toContainText("def clearing_the_road(road):");
  await code.getByRole("button", { name: /W \+= 1/ }).click();
  await expect(page.locator(".card-active")).toContainText("Advance");

  await page.getByRole("button", { name: "⚔ Charge!" }).click();
  const results = page.getByRole("dialog", { name: "Charge results" });
  await expect(results).toContainText("The waves broke through");
  await results.getByRole("button", { name: "⚡ Show me where it goes wrong" }).click();

  await expect(page.locator(".divergence")).toContainText("Here the Jester's trap sprang");
  await expect(page.locator(".card-active")).toContainText("Swap tiles");
  await expectNoHorizontalScroll(page);
});

test("first visit asks for consent, and the answer is remembered", async ({ page, context }) => {
  await context.clearCookies();
  await page.addInitScript(() => localStorage.removeItem("vicoding:v0:analytics-consent"));
  await page.goto("/");
  const banner = page.getByRole("dialog", { name: "Usage data" });
  await expect(banner).toBeVisible();
  await banner.getByRole("button", { name: "No thanks" }).click();
  await expect(banner).toHaveCount(0);
  expect(await page.evaluate(() => localStorage.getItem("vicoding:v0:analytics-consent"))).toBe("denied");
});
