import { test, expect } from "@playwright/test";

const port = 3001;

test("should render SSR HTML with initial data", async ({ page }) => {
  await page.goto(`http://localhost:${port}`);

  const html = await page.content();

  expect(html).toContain("data-ssr-list");
  expect(html).toContain("data-ssr-item");
  expect(html).toContain("Item 0");
  expect(html).toContain("Item 49");
});

test("should have SSR attributes on list container", async ({ page }) => {
  await page.goto(`http://localhost:${port}`);

  const listContainer = page.locator('[data-ssr-list="true"]');
  await expect(listContainer).toBeVisible();
});

test("should render all initial items in SSR mode", async ({ page }) => {
  await page.goto(`http://localhost:${port}`);

  const items = page.locator('[data-ssr-item="true"]');
  const count = await items.count();

  expect(count).toBeGreaterThan(0);

  const firstItem = items.first();
  await expect(firstItem).toContainText("Item 0");
});

test("should have correct structure for SEO", async ({ page }) => {
  await page.goto(`http://localhost:${port}`);

  const html = await page.content();

  expect(html).toContain("Item 0");
  expect(html).toContain("Item 49");

  const listContainer = page.locator('[data-ssr-list="true"]');
  await expect(listContainer).toHaveAttribute("role", "list");
});

test("should hydrate and switch to virtual list", async ({ page }) => {
  await page.goto(`http://localhost:${port}`);

  // Initial SSR render (FullList)
  await expect(page.locator('[data-ssr-list="true"]')).toBeVisible();

  // Wait for hydration and virtualization switch
  // The library switches to VirtualList after hydration, so [data-ssr-list] attribute should be removed
  await expect(page.locator('[data-ssr-list="true"]')).toBeHidden({
    timeout: 5000,
  });

  // Check if items are still visible (rendered by VirtualList)
  await expect(page.getByText("Item 0")).toBeVisible();
});
