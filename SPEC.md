# Shopping Cart Feature — Specification

## Overview

Implement a fully functional shopping cart that lets users view their cart, see totals, and manage item quantities before checkout. The cart is accessed via the existing cart icon in the Header component. A maximum purchase quantity of **5 per product** is enforced across all mutating operations.

---

## Backend

### Data Model

The existing `CartItem` model is reused unchanged:

| Field         | Type      | Description                           |
| ------------- | --------- | ------------------------------------- |
| `productId`   | `int`     | FK to product catalog                 |
| `productName` | `string`  | Snapshot of name when added           |
| `unitPrice`   | `decimal` | Snapshot of price when added          |
| `quantity`    | `int`     | Units in cart (1–5)                   |
| `totalPrice`  | `decimal` | Computed: `unitPrice × quantity`      |

Request bodies:

| DTO                   | Fields                          | Used by         |
| --------------------- | ------------------------------- | --------------- |
| `AddToCartRequest`    | `productId: int, quantity: int` | `POST /api/cart`            |
| `UpdateCartRequest`   | `quantity: int`                 | `PUT /api/cart/{productId}` |

### API Endpoints

| Method | Route                    | Success Response         | Description |
| ------ | ------------------------ | ------------------------ | ----------- |
| GET    | `/api/cart`              | `200` with `CartItem[]`  | Returns all cart items. Empty cart → empty array `[]`. |
| POST   | `/api/cart`              | `201` with `CartItem` (new) / `200` with `CartItem` (existing, quantity incremented) | Adds a product or increments quantity of an existing item. |
| PUT    | `/api/cart/{productId}`  | `200` with updated `CartItem` | Sets the quantity of an existing cart item to the provided value (absolute, not relative). |
| DELETE | `/api/cart/{productId}`  | `204 No Content`         | Removes a single item from the cart. |
| DELETE | `/api/cart`              | `204 No Content`         | Clears all items from the cart. |

### Validation & Error Responses

All error responses use the **RFC 9457 Problem Details** format via ASP.NET's `TypedResults.ValidationProblem(...)`.

| Scenario | Applies to | Status | Response body (key detail) |
| --- | --- | --- | --- |
| `quantity < 1` | POST, PUT | `400` | `{ errors: { "quantity": ["Quantity must be between 1 and 5."] } }` |
| `quantity > 5` | POST, PUT | `400` | `{ errors: { "quantity": ["Quantity must be between 1 and 5."] } }` |
| Resulting quantity would exceed 5 after increment | POST (existing item) | `400` | `{ errors: { "quantity": ["Adding {requested} would exceed the maximum of 5. You already have {current} in your cart."] } }` |
| `productId` not found in product catalog | POST | `404` | `"Product with ID {id} not found."` |
| `productId` not found in cart | PUT, DELETE (single) | `404` | Not Found (no body) |
| Missing / malformed request body | POST, PUT | `400` | Framework-generated validation problem |

### PUT Semantics — Absolute Replace

`PUT /api/cart/{productId}` with body `{ "quantity": 3 }` **sets** the quantity to 3 (not "add 3 more"). This is consistent with HTTP PUT semantics (idempotent replace). The quantity in the body must be 1–5.

### POST Increment Behaviour

When POSTing a `productId` that already exists in the cart, the `quantity` in the request is **added** to the current quantity. If the resulting total exceeds 5, the request is rejected with `400` — no partial increment is applied.

### Service Layer (`ICartService`)

The existing interface methods are implemented:

| Method                           | Behaviour                                                    |
| -------------------------------- | ------------------------------------------------------------ |
| `GetAll()`                       | Returns a snapshot of all cart items.                         |
| `GetByProductId(int productId)`  | Returns the matching `CartItem` or `null`.                   |
| `Add(CartItem item)`             | Adds a new item or increments quantity on existing item. Returns the resulting item. |
| `Remove(int productId)`          | Removes item; returns `true` if found, `false` otherwise.    |
| `Clear()`                        | Removes all items.                                           |

A new method is added to support PUT:

| Method | Signature | Behaviour |
| --- | --- | --- |
| `Update` | `CartItem? Update(int productId, int quantity)` | Sets quantity of an existing cart item. Returns updated item, or `null` if not found. |

All mutations are thread-safe using the existing `Lock` field.

### Max-Quantity Enforcement Summary

| Operation | Rule |
| --- | --- |
| POST (new item) | `quantity` must be 1–5. |
| POST (existing item) | `currentQuantity + requestedQuantity` must be ≤ 5. |
| PUT | `quantity` must be 1–5 (absolute set). |

Stock-level enforcement (checking `product.Stock`) is **out of scope** for this iteration — only the per-item max of 5 is enforced.

---

## Frontend

### Cart Page / View

A new **CartPage** component is displayed when the user clicks the cart icon in the Header. Navigation approach: **client-side state toggle** (no router needed). Clicking the cart icon sets an `activeView` state to `"cart"`; clicking the logo or nav links returns to `"products"`.

#### Cart View Layout

- **Cart item list**: each row shows product name, unit price, quantity selector (1–5 dropdown or stepper), line total, and a remove button.
- **Cart summary**: displays the total number of items, the grand total price, and a "Clear cart" button.
- **Empty state**: when the cart is empty, display a message ("Your cart is empty") with a link/button to continue shopping.

#### Quantity Selector Behaviour

- Renders as a `<select>` dropdown with options 1–5.
- Changing the value calls `PUT /api/cart/{productId}` with the new quantity.
- On success, the cart view re-fetches or locally updates.
- On failure (e.g. network error), show an inline error message.

#### Remove & Clear

- Remove button on each row calls `DELETE /api/cart/{productId}`.
- "Clear cart" button calls `DELETE /api/cart` after a confirmation (either `window.confirm` or an inline confirm).

### API Client Additions (`src/frontend/src/api/index.ts`)

New functions:

| Function | Method | URL | Body | Returns |
| --- | --- | --- | --- | --- |
| `fetchCart()` | GET | `/api/cart` | — | `CartItem[]` |
| `updateCartItem(productId, quantity)` | PUT | `/api/cart/{productId}` | `{ quantity }` | `CartItem` |
| `removeFromCart(productId)` | DELETE | `/api/cart/{productId}` | — | `void` |
| `clearCart()` | DELETE | `/api/cart` | — | `void` |

The existing `CartItem` interface already defined in `api/index.ts` is **exported** so other modules can use it. It is also added to `types/index.ts` for consistency.

### Type Additions (`src/frontend/src/types/index.ts`)

```ts
export interface CartItem {
  productId: number;
  productName: string;
  unitPrice: number;
  quantity: number;
  totalPrice: number;
}

export interface UpdateCartRequest {
  quantity: number;
}
```

### Header Changes

- Clicking the cart icon calls an `onCartClick` callback passed as a prop.
- The badge continues to show the total number of distinct items (or total units — keep current "count" approach which counts adds).

### Add-to-Cart Error Handling

When `POST /api/cart` returns `400` due to max-quantity exceeded, the notification in `App.tsx` shows a user-friendly message (e.g. "Cannot add more — maximum of 5 per item").

---

## Edge Cases

| Case | Expected Behaviour |
| --- | --- |
| Add product not in catalog (`productId: 999`) | `404` with message. |
| Add with `quantity: 0` | `400` validation error. |
| Add with `quantity: -1` | `400` validation error. |
| Add with `quantity: 6` | `400` validation error. |
| Add 3 of item already at quantity 3 | `400` — would result in 6, exceeds max. |
| Add 2 of item already at quantity 3 | `200` — total becomes 5 (OK). |
| PUT on item not in cart | `404`. |
| PUT with `quantity: 0` | `400` validation error. |
| PUT with `quantity: 6` | `400` validation error. |
| DELETE item not in cart | `404`. |
| DELETE all when cart is empty | `204` (idempotent, no error). |
| GET cart when empty | `200` with `[]`. |
| Non-integer `productId` in URL | Framework returns `400` (route constraint `{productId:int}`). |
| Missing request body on POST/PUT | Framework returns `400`. |
| Concurrent requests mutating the same cart | Thread-safe via `Lock` — serialized access, no data corruption. |
