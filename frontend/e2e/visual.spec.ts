import { test, expect } from "@playwright/test";

test.describe("Visual Screenshots", () => {
  test("capture login page at different viewports", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();

    // Desktop
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.screenshot({
      path: "e2e/screenshots/login-desktop.png",
      fullPage: true,
    });

    // Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.screenshot({
      path: "e2e/screenshots/login-tablet.png",
      fullPage: true,
    });

    // Mobile
    await page.setViewportSize({ width: 375, height: 812 });
    await page.screenshot({
      path: "e2e/screenshots/login-mobile.png",
      fullPage: true,
    });
  });

  test("capture register page", async ({ page }) => {
    await page.goto("/register");
    await expect(
      page.getByRole("heading", { name: "Create account" })
    ).toBeVisible();

    await page.screenshot({
      path: "e2e/screenshots/register-desktop.png",
      fullPage: true,
    });
  });

  test("role selector has correct options", async ({ page }) => {
    await page.goto("/login");

    const select = page.getByRole("combobox");
    await expect(select).toHaveValue("participant");

    const options = select.locator("option");
    await expect(options).toHaveCount(2);
    await expect(options.nth(0)).toHaveText("Participant");
    await expect(options.nth(1)).toHaveText("Mentor");
  });
});
