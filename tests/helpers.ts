import { type Page } from '@playwright/test';

const API_BASE = 'http://localhost:5063/api';

/** Clear the cart via the API so each test starts fresh. */
export async function clearCartViaApi(page: Page) {
  await page.request.delete(`${API_BASE}/cart`);
}

/** Add a product to the cart via the API. */
export async function addToCartViaApi(
  page: Page,
  productId: number,
  quantity = 1,
) {
  return page.request.post(`${API_BASE}/cart`, {
    data: { productId, quantity },
  });
}

/** Known product data from MockProductService. */
export const PRODUCTS = [
  { id: 1, name: 'Wireless Headphones', price: 79.99, category: 'Electronics' },
  { id: 2, name: 'Running Shoes', price: 59.99, category: 'Footwear' },
  { id: 3, name: 'Stainless Steel Water Bottle', price: 24.99, category: 'Accessories' },
  { id: 4, name: 'Mechanical Keyboard', price: 109.99, category: 'Electronics' },
  { id: 5, name: 'Yoga Mat', price: 34.99, category: 'Sports' },
] as const;
