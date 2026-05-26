import { test, expect } from '@playwright/test';
import { PRODUCTS } from './helpers';

test.describe('Product Catalog', () => {
  test('displays the header with logo and navigation', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByText('Mock Shop')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Products' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Deals' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'New' })).toBeVisible();
  });

  test('displays the hero banner', async ({ page }) => {
    await page.goto('/');

    await expect(
      page.getByText('Discover quality products at affordable prices'),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Shop all products' })).toBeVisible();
  });

  test('displays all 5 products', async ({ page }) => {
    await page.goto('/');

    const productList = page.getByRole('list', { name: 'Product list' });
    await expect(productList).toBeVisible();

    const items = productList.getByRole('listitem');
    await expect(items).toHaveCount(5);

    for (const product of PRODUCTS) {
      await expect(page.getByRole('heading', { name: product.name })).toBeVisible();
      await expect(page.getByText(`$${product.price.toFixed(2)}`)).toBeVisible();
    }
  });

  test('displays product categories', async ({ page }) => {
    await page.goto('/');

    for (const product of PRODUCTS) {
      await expect(page.getByText(product.category).first()).toBeVisible();
    }
  });

  test('each product has an add-to-cart button', async ({ page }) => {
    await page.goto('/');

    for (const product of PRODUCTS) {
      await expect(
        page.getByRole('button', { name: `Add ${product.name} to cart` }),
      ).toBeVisible();
    }
  });
});
