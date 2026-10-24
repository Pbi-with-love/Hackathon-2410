import { test, expect } from "@playwright/test";

test.describe("Authentication Pages", () => {
  test("login page renders with form fields", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
    await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
    await expect(page.getByPlaceholder("••••••••")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign in" })).toBeVisible();
    await expect(page.getByRole("combobox")).toHaveValue("participant");

    await page.screenshot({
      path: "e2e/screenshots/login-page.png",
      fullPage: true,
    });
  });

  test("login page has link to register", async ({ page }) => {
    await page.goto("/login");

    const registerLink = page.getByRole("link", { name: "Register" });
    await expect(registerLink).toBeVisible();
    await registerLink.click();

    await expect(page).toHaveURL(/\/register/);
  });

  test("register page renders with form fields", async ({ page }) => {
    await page.goto("/register");

    await expect(
      page.getByRole("heading", { name: "Create account" })
    ).toBeVisible();
    await expect(page.getByPlaceholder("Your full name")).toBeVisible();
    await expect(page.getByPlaceholder("you@example.com")).toBeVisible();
    await expect(page.getByPlaceholder("••••••••")).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Create account" })
    ).toBeVisible();

    await page.screenshot({
      path: "e2e/screenshots/register-page.png",
      fullPage: true,
    });
  });

  test("register page has link back to login", async ({ page }) => {
    await page.goto("/register");

    const signInLink = page.getByRole("link", { name: "Sign in" });
    await expect(signInLink).toBeVisible();
    await signInLink.click();

    await expect(page).toHaveURL(/\/login/);
  });

  test("unauthenticated user is redirected to login", async ({ page }) => {
    await page.goto("/map/teams");
    await expect(page).toHaveURL(/\/login/);
  });

  test("login shows error on invalid credentials", async ({ page }) => {
    await page.goto("/login");

    await page.getByPlaceholder("you@example.com").fill("bad@example.com");
    await page.getByPlaceholder("••••••••").fill("wrongpassword");
    await page.getByRole("button", { name: "Sign in" }).click();

    // Should show an error message (network error or auth error)
    const errorBox = page.locator(".bg-red-50");
    await expect(errorBox).toBeVisible({ timeout: 10_000 });

    await page.screenshot({
      path: "e2e/screenshots/login-error.png",
      fullPage: true,
    });
  });
});
