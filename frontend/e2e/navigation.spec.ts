import { test, expect } from "@playwright/test";

test.describe("Navigation & Routing", () => {
  test("root redirects to login when not authenticated", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  test("protected routes redirect to login", async ({ page }) => {
    const protectedPaths = [
      "/map/teams",
      "/map/mentors",
      "/profile",
      "/matches",
    ];

    for (const path of protectedPaths) {
      await page.goto(path);
      await expect(page).toHaveURL(/\/login/);
    }
  });

  test("login and register pages are accessible without auth", async ({
    page,
  }) => {
    await page.goto("/login");
    await expect(
      page.getByRole("heading", { name: "Sign in" })
    ).toBeVisible();

    await page.goto("/register");
    await expect(
      page.getByRole("heading", { name: "Create account" })
    ).toBeVisible();
  });
});
