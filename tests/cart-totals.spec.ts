import { test, expect } from '@playwright/test';
import { clearCartViaApi, addToCartViaApi, PRODUCTS } from './helpers';

test.describe('Cart Totals', () => {
  test.beforeEach(async ({ page }) => {
    await clearCartViaApi(page);
  });

  test('displays correct line totals', async ({ page }) => {
    await addToCartViaApi(page, PRODUCTS[0].id, 3);

    await page.goto('/');
    await page.getByRole('button', { name: /Shopping cart/ }).click();

    const lineTotal = (PRODUCTS[0].price * 3).toFixed(2);
    await expect(page.getByText(`$${lineTotal}`)).toBeVisible();
  });

  test('displays correct grand total for multiple items', async ({ page }) => {
    await addToCartViaApi(page, PRODUCTS[0].id, 2); // 79.99 * 2 = 159.98
    await addToCartViaApi(page, PRODUCTS[2].id, 1); // 24.99 * 1 = 24.99
    // Grand total = 184.97

    await page.goto('/');
    await page.getByRole('button', { name: /Shopping cart/ }).click();

    await expect(page.getByText('$184.97')).toBeVisible();
  });

  test('displays item count in cart summary', async ({ page }) => {
    await addToCartViaApi(page, PRODUCTS[0].id, 2);
    await addToCartViaApi(page, PRODUCTS[1].id, 3);

    await page.goto('/');
    await page.getByRole('button', { name: /Shopping cart/ }).click();

    // Should show total items or distinct items count
    // Total units: 5, distinct items: 2
    await expect(
      page.getByText(/2 item/i).or(page.getByText(/5 item/i)),
    ).toBeVisible();
  });
});
