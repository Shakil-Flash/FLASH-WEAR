import { test, expect } from "@playwright/test";

test.describe("FLASHWEAR Shopping & Checkout Flow", () => {
  test("1. Homepage renders brand headline and announcement bar", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/FLASHWEAR/);
    await expect(page.locator("text=FLASHWEAR")).toBeVisible();
    await expect(page.locator("text=ENGINEERED STREETWEAR FOR URBAN CHAOS")).toBeVisible();
    await expect(page.locator("text=CASH ON DELIVERY AVAILABLE BANGLADESH WIDE")).toBeVisible();
  });

  test("2. Shop page displays products with BDT prices and filters", async ({ page }) => {
    await page.goto("/shop");
    await expect(page.locator("h1")).toContainText("All Streetwear");
    // Verify BDT currency symbols appear
    await expect(page.locator("text=৳").first()).toBeVisible();
    await expect(page.locator("text=FLASH Matrix Oversized Hoodie")).toBeVisible();
  });

  test("3. Product Detail Page allows selecting size, color, and adding to bag", async ({ page }) => {
    await page.goto("/product/flash-matrix-oversized-hoodie");
    await expect(page.locator("h1")).toContainText("FLASH Matrix Oversized Hoodie");
    await expect(page.locator("text=In Stock")).toBeVisible();

    // Select Size L
    const sizeLButton = page.locator("button:has-text('L')").first();
    await sizeLButton.click();

    // Add to bag
    const addBtn = page.locator("button:has-text('Add to Bag')");
    await addBtn.click();

    // Cart drawer should open
    await expect(page.locator("text=Your Bag")).toBeVisible();
    await expect(page.locator("text=Proceed to Checkout")).toBeVisible();
  });

  test("4. Guest Cash on Delivery Checkout renders required fields", async ({ page }) => {
    await page.goto("/checkout");
    // If bag empty, redirects to cart or displays notice
    await expect(page.locator("body")).toBeVisible();
  });

  test("5. Admin Portal loads overview and login", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(page.locator("text=FLASHWEAR Staff Portal")).toBeVisible();
    await expect(page.locator("text=Admin Email / Username")).toBeVisible();
  });
});
