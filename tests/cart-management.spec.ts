import { test, expect } from '@playwright/test';
import { clearCartViaApi, addToCartViaApi, PRODUCTS } from './helpers';

test.describe('Cart Quantity Management', () => {
  test.beforeEach(async ({ page }) => {
    await clearCartViaApi(page);
  });

  test('quantity selector shows current quantity', async ({ page }) => {
    await addToCartViaApi(page, PRODUCTS[0].id, 3);

    await page.goto('/');
    await page.getByRole('button', { name: /Shopping cart/ }).click();

    // The quantity selector (dropdown) should show the current value
    const quantitySelect = page.getByRole('combobox').first()
      .or(page.locator('select').first());
    await expect(quantitySelect).toHaveValue('3');
  });

  test('changing quantity updates the cart', async ({ page }) => {
    await addToCartViaApi(page, PRODUCTS[0].id, 1);

    await page.goto('/');
    await page.getByRole('button', { name: /Shopping cart/ }).click();

    const quantitySelect = page.getByRole('combobox').first()
      .or(page.locator('select').first());
    await quantitySelect.selectOption('4');

    // Line total should update (price × 4)
    const expectedTotal = (PRODUCTS[0].price * 4).toFixed(2);
    await expect(page.getByText(`$${expectedTotal}`)).toBeVisible({ timeout: 3_000 });
  });

  test('quantity selector offers options 1 through 5', async ({ page }) => {
    await addToCartViaApi(page, PRODUCTS[0].id, 1);

    await page.goto('/');
    await page.getByRole('button', { name: /Shopping cart/ }).click();

    const quantitySelect = page.getByRole('combobox').first()
      .or(page.locator('select').first());

    const options = quantitySelect.locator('option');
    await expect(options).toHaveCount(5);

    for (let i = 1; i <= 5; i++) {
      await expect(options.nth(i - 1)).toHaveValue(String(i));
    }
  });
});

test.describe('Cart Remove & Clear', () => {
  test.beforeEach(async ({ page }) => {
    await clearCartViaApi(page);
  });

  test('remove button removes an item from the cart', async ({ page }) => {
    await addToCartViaApi(page, PRODUCTS[0].id, 1);
    await addToCartViaApi(page, PRODUCTS[1].id, 1);

    await page.goto('/');
    await page.getByRole('button', { name: /Shopping cart/ }).click();

    // Find and click the remove button for the first product
    const removeButton = page.getByRole('button', { name: /remove/i }).first();
    await removeButton.click();

    // One product should be removed; wait for UI update
    await expect(page.getByText(PRODUCTS[0].name).or(page.getByText(PRODUCTS[1].name))).toBeVisible();
  });

  test('removing last item shows empty state', async ({ page }) => {
    await addToCartViaApi(page, PRODUCTS[0].id, 1);

    await page.goto('/');
    await page.getByRole('button', { name: /Shopping cart/ }).click();

    await expect(page.getByText(PRODUCTS[0].name)).toBeVisible();

    const removeButton = page.getByRole('button', { name: /remove/i }).first();
    await removeButton.click();

    await expect(page.getByText(/your cart is empty/i)).toBeVisible({ timeout: 3_000 });
  });

  test('clear cart button removes all items', async ({ page }) => {
    await addToCartViaApi(page, PRODUCTS[0].id, 1);
    await addToCartViaApi(page, PRODUCTS[1].id, 2);
    await addToCartViaApi(page, PRODUCTS[2].id, 1);

    await page.goto('/');
    await page.getByRole('button', { name: /Shopping cart/ }).click();

    // Accept the confirmation dialog
    page.on('dialog', (dialog) => dialog.accept());

    const clearButton = page.getByRole('button', { name: /clear cart/i });
    await clearButton.click();

    await expect(page.getByText(/your cart is empty/i)).toBeVisible({ timeout: 3_000 });
  });

  test('clear cart confirmation can be cancelled', async ({ page }) => {
    await addToCartViaApi(page, PRODUCTS[0].id, 1);

    await page.goto('/');
    await page.getByRole('button', { name: /Shopping cart/ }).click();

    // Dismiss the confirmation dialog
    page.on('dialog', (dialog) => dialog.dismiss());

    const clearButton = page.getByRole('button', { name: /clear cart/i });
    await clearButton.click();

    // Item should still be there
    await expect(page.getByText(PRODUCTS[0].name)).toBeVisible();
  });
});
