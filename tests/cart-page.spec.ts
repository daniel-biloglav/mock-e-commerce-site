import { test, expect } from '@playwright/test';
import { clearCartViaApi, addToCartViaApi, PRODUCTS } from './helpers';

test.describe('Cart Page', () => {
  test.beforeEach(async ({ page }) => {
    await clearCartViaApi(page);
  });

  test('navigating to cart shows empty state', async ({ page }) => {
    await page.goto('/');

    await page.getByRole('button', { name: /Shopping cart/ }).click();

    await expect(page.getByText(/your cart is empty/i)).toBeVisible();
  });

  test('empty cart has a continue shopping button', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Shopping cart/ }).click();

    const continueBtn = page.getByRole('button', { name: /continue shopping/i })
      .or(page.getByRole('link', { name: /continue shopping/i }));
    await expect(continueBtn).toBeVisible();
  });

  test('continue shopping returns to product list', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Shopping cart/ }).click();

    await expect(page.getByText(/your cart is empty/i)).toBeVisible();

    const continueBtn = page.getByRole('button', { name: /continue shopping/i })
      .or(page.getByRole('link', { name: /continue shopping/i }));
    await continueBtn.first().click();

    await expect(page.getByRole('list', { name: 'Product list' })).toBeVisible();
  });

  test('displays cart items after adding products', async ({ page }) => {
    const product = PRODUCTS[0];
    await addToCartViaApi(page, product.id, 2);

    await page.goto('/');
    await page.getByRole('button', { name: /Shopping cart/ }).click();

    await expect(page.getByText(product.name)).toBeVisible();
    await expect(page.getByText(`$${product.price.toFixed(2)}`)).toBeVisible();
  });

  test('displays multiple cart items', async ({ page }) => {
    await addToCartViaApi(page, PRODUCTS[0].id, 1);
    await addToCartViaApi(page, PRODUCTS[1].id, 2);
    await addToCartViaApi(page, PRODUCTS[2].id, 1);

    await page.goto('/');
    await page.getByRole('button', { name: /Shopping cart/ }).click();

    await expect(page.getByText(PRODUCTS[0].name)).toBeVisible();
    await expect(page.getByText(PRODUCTS[1].name)).toBeVisible();
    await expect(page.getByText(PRODUCTS[2].name)).toBeVisible();
  });
});
