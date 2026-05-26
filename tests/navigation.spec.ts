import { test, expect } from '@playwright/test';
import { clearCartViaApi, addToCartViaApi, PRODUCTS } from './helpers';

test.describe('Navigation between views', () => {
  test.beforeEach(async ({ page }) => {
    await clearCartViaApi(page);
  });

  test('cart icon navigates to cart view', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: /Shopping cart/ }).click();

    // Hero banner and product list should not be visible in cart view
    await expect(
      page.getByText('Discover quality products at affordable prices'),
    ).toBeHidden();
    await expect(page.getByRole('list', { name: 'Product list' })).toBeHidden();
  });

  test('logo navigates back to products', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Shopping cart/ }).click();

    // Click the logo to go back
    await page.getByLabel('Mock Shop home').click();

    await expect(page.getByRole('list', { name: 'Product list' })).toBeVisible();
  });

  test('header remains visible in cart view', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Shopping cart/ }).click();

    await expect(page.getByText('Mock Shop')).toBeVisible();
    await expect(page.getByRole('button', { name: /Shopping cart/ })).toBeVisible();
  });

  test('cart badge reflects correct count after navigation', async ({ page }) => {
    await addToCartViaApi(page, PRODUCTS[0].id, 1);
    await addToCartViaApi(page, PRODUCTS[1].id, 1);

    await page.goto('/');

    // Navigate to cart
    await page.getByRole('button', { name: /Shopping cart/ }).click();

    // Remove an item
    const removeButton = page.getByRole('button', { name: /remove/i }).first();
    await removeButton.click();

    // Navigate back to products
    const continueBtn = page.getByRole('button', { name: /continue shopping/i })
      .or(page.getByRole('link', { name: /continue shopping/i })
      .or(page.getByLabel('Mock Shop home')));
    await continueBtn.first().click();

    // Badge should be updated
    const cartButton = page.getByRole('button', { name: /Shopping cart/ });
    await expect(cartButton).toContainText('1');
  });
});

test.describe('Full user journey', () => {
  test.beforeEach(async ({ page }) => {
    await clearCartViaApi(page);
  });

  test('add items → view cart → update quantity → remove item → clear cart', async ({
    page,
  }) => {
    await page.goto('/');

    // Step 1: Add two different products from the catalog
    await page.getByRole('button', { name: `Add ${PRODUCTS[0].name} to cart` }).click();
    await expect(page.getByRole('status')).toContainText('added to cart');

    await page.getByRole('button', { name: `Add ${PRODUCTS[2].name} to cart` }).click();
    await expect(page.getByRole('status')).toContainText('added to cart');

    // Step 2: Navigate to cart
    await page.getByRole('button', { name: /Shopping cart/ }).click();

    // Both items should be visible
    await expect(page.getByText(PRODUCTS[0].name)).toBeVisible();
    await expect(page.getByText(PRODUCTS[2].name)).toBeVisible();

    // Step 3: Update quantity of first item
    const quantitySelect = page.locator('select').first();
    await quantitySelect.selectOption('3');

    // Wait for update
    const updatedTotal = (PRODUCTS[0].price * 3).toFixed(2);
    await expect(page.getByText(`$${updatedTotal}`)).toBeVisible({ timeout: 3_000 });

    // Step 4: Remove second item
    const removeButtons = page.getByRole('button', { name: /remove/i });
    await removeButtons.last().click();

    // Only first product should remain
    await expect(page.getByText(PRODUCTS[2].name)).toBeHidden({ timeout: 3_000 });
    await expect(page.getByText(PRODUCTS[0].name)).toBeVisible();

    // Step 5: Clear cart
    page.on('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: /clear cart/i }).click();

    await expect(page.getByText(/your cart is empty/i)).toBeVisible({ timeout: 3_000 });
  });
});
