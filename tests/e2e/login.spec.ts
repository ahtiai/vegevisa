import { test, expect } from "@playwright/test";

test("login opens a fresh admin document with the new session", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login$/);
  await page.getByLabel("Salasana").fill("test-only-admin-password");
  const navigation = page.waitForRequest(
    (request) => request.isNavigationRequest()
      && request.resourceType() === "document"
      && new URL(request.url()).pathname === "/admin",
    { timeout: 10000 },
  );
  await Promise.all([
    navigation,
    page.getByLabel("Salasana").press("Enter"),
  ]);
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "Kysymykset", exact: true })).toBeVisible();
  await page.reload();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "Kysymykset", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Kirjaudu ulos" }).click();
  await expect(page).toHaveURL(/\/admin\/login$/);
});
