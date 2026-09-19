import { expect, test } from "@playwright/test";

test("signed-out visitor is redirected away from the dashboard", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});

test("the intended destination is preserved for after sign-in", async ({ page }) => {
  await page.goto("/dashboard");
  expect(new URL(page.url()).searchParams.get("next")).toBe("/dashboard");
});

test("public routes stay reachable without a session", async ({ page }) => {
  const landing = await page.goto("/");
  expect(landing?.status()).toBe(200);

  const login = await page.goto("/login");
  expect(login?.status()).toBe(200);
});

test("a sibling route that merely shares a prefix is not gated", async ({ page }) => {
  // "/jamboree" starts with "/jam" but must not be treated as protected. It
  // 404s because no such route exists — the point is that it is NOT a
  // redirect to /login.
  const response = await page.goto("/jamboree");
  expect(response?.status()).toBe(404);
  expect(page.url()).not.toContain("/login");
});

test("the callback rejects a request with no code", async ({ page }) => {
  await page.goto("/auth/callback");
  await expect(page).toHaveURL(/\/auth\/auth-code-error/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Sign-in didn't complete");
});

test("the login page offers GitHub sign-in and keeps the destination", async ({ page }) => {
  await page.goto("/login?next=%2Fjam%2Fabc123");
  await expect(page.getByRole("button", { name: "Continue with GitHub" })).toBeVisible();
  await expect(page.locator('input[name="next"]')).toHaveValue("/jam/abc123");
});

test("the login page discards an off-origin destination", async ({ page }) => {
  // Open-redirect guard, verified through the real page rather than only the
  // unit test: a hostile ?next= must never survive into the form.
  await page.goto("/login?next=https%3A%2F%2Fevil.example");
  await expect(page.locator('input[name="next"]')).toHaveValue("/dashboard");
});
