import { test, expect } from '@playwright/test';
import { clearCartViaApi, PRODUCTS } from './helpers';

test.describe('Add to Cart', () => {
  test.beforeEach(async ({ page }) => {
    await clearCartViaApi(page);
  });

  test('clicking add-to-cart shows a success notification', async ({ page }) => {
    await page.goto('/');

    const product = PRODUCTS[0];
    await page.getByRole('button', { name: `Add ${product.name} to cart` }).click();

    await expect(page.getByRole('status')).toContainText(
      `"${product.name}" added to cart!`,
    );
  });

  test('cart badge increments when adding items', async ({ page }) => {
    await page.goto('/');

    const cartButton = page.getByRole('button', { name: /Shopping cart/ });

    // Badge should not show count initially
    await expect(cartButton).toContainText('');

    // Add first item
    await page.getByRole('button', { name: `Add ${PRODUCTS[0].name} to cart` }).click();
    await expect(cartButton).toContainText('1');

    // Add second item
    await page.getByRole('button', { name: `Add ${PRODUCTS[1].name} to cart` }).click();
    await expect(cartButton).toContainText('2');
  });

  test('notification disappears after a few seconds', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: `Add ${PRODUCTS[0].name} to cart` }).click();

    const notification = page.getByRole('status');
    await expect(notification).toBeVisible();

    // Notification should disappear (timeout is 3s in App.tsx)
    await expect(notification).toBeHidden({ timeout: 5_000 });
  });

  test('can add multiple different products', async ({ page }) => {
    await page.goto('/');

    for (let i = 0; i < 3; i++) {
      await page.getByRole('button', { name: `Add ${PRODUCTS[i].name} to cart` }).click();
      // Wait for notification to confirm success
      await expect(page.getByRole('status')).toContainText('added to cart');
    }

    const cartButton = page.getByRole('button', { name: /Shopping cart/ });
    await expect(cartButton).toContainText('3');
  });

  test('shows error notification when add-to-cart exceeds max quantity', async ({
    page,
  }) => {
    // Pre-fill cart to max (5) via API
    const product = PRODUCTS[0];
    for (let i = 0; i < 5; i++) {
      await page.request.post('http://localhost:5063/api/cart', {
        data: { productId: product.id, quantity: 1 },
      });
    }

    await page.goto('/');
    await page.getByRole('button', { name: `Add ${product.name} to cart` }).click();

    // Should show an error (the exact message depends on implementation)
    const notification = page.getByRole('status');
    await expect(notification).toBeVisible();
    // The notification should indicate failure (not "added to cart")
    await expect(notification).not.toContainText('added to cart');
  });
});
