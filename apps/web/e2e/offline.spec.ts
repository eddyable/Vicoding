import { expect, test } from "@playwright/test";

test("after one visit the game works offline (installable web app)", async ({ page, context }) => {
  await page.addInitScript(() => localStorage.setItem("vicoding:v0:analytics-consent", "denied"));
  await page.goto("/");
  await expect(page.getByRole("button", { name: /The Tallest Scroll/ })).toBeVisible();
  // Wait until the service worker controls the page and has cached the game.
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole("button", { name: /The Tallest Scroll/ })).toBeVisible();
  await page.getByRole("button", { name: /The Tallest Scroll/ }).click();
  await expect(page.getByRole("button", { name: "Place the soldier on the first scroll" })).toBeVisible();
  await context.setOffline(false);
});

test("the web app manifest is valid", async ({ request }) => {
  const manifest = await (await request.get("/manifest.webmanifest")).json();
  expect(manifest.name).toBe("Vicoding");
  expect(manifest.display).toBe("standalone");
  expect(manifest.icons.map((i: { sizes: string }) => i.sizes)).toEqual(expect.arrayContaining(["192x192", "512x512"]));
  for (const icon of manifest.icons) expect((await request.get(`/${icon.src}`)).ok()).toBe(true);
});
