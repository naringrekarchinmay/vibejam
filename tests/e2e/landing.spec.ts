import { expect, test } from "@playwright/test";

test("landing page shows the brand, the pitch, and both CTAs", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle(/VibeJam/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Settle it in code.");
  await expect(page.getByRole("link", { name: "Start a Jam" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in with GitHub" })).toBeVisible();
});

test("landing page lists the seven-step product loop", async ({ page }) => {
  await page.goto("/");
  const loop = page.getByRole("region", { name: "How a Jam works" });
  await expect(loop.getByRole("listitem")).toHaveCount(7);
  await expect(loop.getByText("Create a Jam")).toBeVisible();
  await expect(loop.getByText("Compare results")).toBeVisible();
});

test("landing page shows a judged result with its evidence", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByText("Decision Engine")).toBeVisible();
  await expect(page.getByText("PASS")).toBeVisible();
  await expect(page.getByText("src/lib/storage.ts")).toBeVisible();
});

test("scores settle at their true values", async ({ page }) => {
  await page.goto("/");
  // The count-up is an enhancement; the settled value must always arrive.
  await expect(page.getByText("88 out of 100")).toBeAttached();
});
