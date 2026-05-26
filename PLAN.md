# Shopping Cart Feature — Implementation Plan

This plan is sequenced so each step builds on the previous one. A developer should follow these steps in order.

---

## Step 1: Add `Update` method to `ICartService`

**File:** `src/backend/MockEcommerce.Api/Services/ICartService.cs`

Add a new method to the interface:

```csharp
CartItem? Update(int productId, int quantity);
```

This sets an existing cart item's quantity to the given value and returns the updated item, or `null` if the `productId` is not in the cart.

---

## Step 2: Implement `InMemoryCartService`

**File:** `src/backend/MockEcommerce.Api/Services/InMemoryCartService.cs`

Replace all `throw new NotImplementedException()` bodies with real logic. All mutations must lock on the existing `_lock` field.

| Method | Implementation |
| --- | --- |
| `GetAll()` | Lock, return a copy of `_cart` (e.g. `_cart.ToList()`). |
| `GetByProductId(int)` | Lock, find by `ProductId`, return item or `null`. |
| `Add(CartItem)` | Lock, check if item with same `ProductId` exists. If yes, increment `Quantity` and update `TotalPrice`. If no, add to list. Return the item. |
| `Remove(int)` | Lock, find and remove by `ProductId`. Return `true`/`false`. |
| `Clear()` | Lock, call `_cart.Clear()`. |
| `Update(int, int)` | Lock, find by `ProductId`. If found, set `Quantity` and recompute `TotalPrice`. Return item or `null`. |

**Note:** The service layer does NOT enforce the max-quantity-of-5 rule — that validation lives in the endpoint layer so it can return proper HTTP error responses.

---

## Step 3: Add `UpdateCartRequest` record and `PUT` endpoint

**File:** `src/backend/MockEcommerce.Api/Endpoints/CartEndpoints.cs`

### 3a. Add request record

```csharp
public record UpdateCartRequest(int Quantity);
```

### 3b. Register the PUT route

Inside `MapCartEndpoints`, add:

```csharp
group.MapPut("/{productId:int}", UpdateCartItem)
    .WithName("UpdateCartItem")
    .WithSummary("Updates the quantity of an existing cart item.");
```

### 3c. Implement `UpdateCartItem` handler

```csharp
internal static Results<Ok<CartItem>, NotFound, ValidationProblem> UpdateCartItem(
    int productId,
    UpdateCartRequest request,
    ICartService cartService)
```

- Validate `request.Quantity` is 1–5. If not, return `ValidationProblem` with `"Quantity must be between 1 and 5."`.
- Call `cartService.Update(productId, request.Quantity)`.
- If result is `null`, return `NotFound`.
- Otherwise return `Ok(updatedItem)`.

---

## Step 4: Implement remaining endpoint handlers

**File:** `src/backend/MockEcommerce.Api/Endpoints/CartEndpoints.cs`

Replace all `throw new NotImplementedException()` bodies:

### `GetCart`

Return `TypedResults.Ok(cartService.GetAll())`.

### `AddToCart`

1. Validate `request.Quantity` is 1–5 → `400 ValidationProblem` if not.
2. Look up `request.ProductId` in `productService.GetById(...)` → `404` with message if not found.
3. Check if item already in cart via `cartService.GetByProductId(request.ProductId)`:
   - **Exists:** validate `existing.Quantity + request.Quantity <= 5` → `400` if exceeded. Then call `cartService.Update(productId, existing.Quantity + request.Quantity)` and return `Ok(updatedItem)`.
   - **New:** create a `CartItem` from product data and request quantity, call `cartService.Add(item)`, return `Created($"/api/cart", item)`.
4. Note: when item already exists and increment is valid, use `Update` (not `Add`) to set the absolute new quantity, keeping logic clear.

### `RemoveFromCart`

Call `cartService.Remove(productId)`. Return `NoContent` if true, `NotFound` if false.

### `ClearCart`

Call `cartService.Clear()`. Return `NoContent`.

---

## Step 5: Add backend unit tests for `InMemoryCartService`

**File:** `test/backend/MockEcommerce.Api.Tests/Services/InMemoryCartServiceTests.cs` (new)

Test cases:

- `GetAll` returns empty list initially.
- `Add` new item returns it with correct fields.
- `Add` existing item increments quantity.
- `GetByProductId` returns `null` for missing item.
- `GetByProductId` returns item when present.
- `Update` existing item sets new quantity and recomputes total.
- `Update` missing item returns `null`.
- `Remove` existing item returns `true`.
- `Remove` missing item returns `false`.
- `Clear` empties the cart.

---

## Step 6: Add backend integration tests for cart endpoints

**File:** `test/backend/MockEcommerce.Api.Tests/Endpoints/CartEndpointTests.cs` (new)

Use `WebApplicationFactory<Program>` (same pattern as existing `ProductEndpointTests`).

Test cases:

- `GET /api/cart` returns `200` with empty array.
- `POST /api/cart` with valid product returns `201` with item.
- `POST /api/cart` with existing item increments quantity, returns `200`.
- `POST /api/cart` with quantity exceeding max returns `400`.
- `POST /api/cart` with invalid quantity (0, -1, 6) returns `400`.
- `POST /api/cart` with non-existent product returns `404`.
- `PUT /api/cart/{id}` with valid quantity returns `200`.
- `PUT /api/cart/{id}` with invalid quantity returns `400`.
- `PUT /api/cart/{id}` for item not in cart returns `404`.
- `DELETE /api/cart/{id}` removes item, returns `204`.
- `DELETE /api/cart/{id}` for missing item returns `404`.
- `DELETE /api/cart` clears all items, returns `204`.

---

## Step 7: Add frontend API client functions

**File:** `src/frontend/src/api/index.ts`

Export the existing `CartItem` interface. Add:

```ts
export async function fetchCart(): Promise<CartItem[]> { ... }
export async function updateCartItem(productId: number, quantity: number): Promise<CartItem> { ... }
export async function removeFromCart(productId: number): Promise<void> { ... }
export async function clearCart(): Promise<void> { ... }
```

Each function calls the corresponding backend endpoint and throws on non-OK responses.

---

## Step 8: Add shared types

**File:** `src/frontend/src/types/index.ts`

Add `CartItem` and `UpdateCartRequest` interfaces matching the backend models.

---

## Step 9: Create `CartPage` component

**File:** `src/frontend/src/components/CartPage/CartPage.tsx` (new)
**File:** `src/frontend/src/components/CartPage/index.ts` (new, barrel export)

### Props

```ts
interface CartPageProps {
  onContinueShopping: () => void;
}
```

### Behaviour

- On mount, call `fetchCart()` and store items in local state.
- Render each item as a row: product name, unit price, quantity `<select>` (options 1–5), line total (`unitPrice × quantity`), remove button.
- Changing the `<select>` calls `updateCartItem(productId, newQuantity)` → re-fetch or local update on success, inline error on failure.
- Remove button calls `removeFromCart(productId)` → removes row.
- Footer shows grand total and a "Clear cart" button.
- "Clear cart" shows a `window.confirm` dialog; on confirm calls `clearCart()` → re-fetch.
- Empty state: "Your cart is empty" message with a "Continue shopping" button that calls `onContinueShopping`.

---

## Step 10: Update `Header` component

**File:** `src/frontend/src/components/Header/Header.tsx`

- Add `onCartClick: () => void` to `HeaderProps`.
- Attach `onClick={onCartClick}` to the existing cart button.

---

## Step 11: Wire up navigation in `App.tsx`

**File:** `src/frontend/src/App.tsx`

- Add state: `const [view, setView] = useState<'products' | 'cart'>('products');`
- Pass `onCartClick={() => setView('cart')}` to `<Header>`.
- Conditionally render: if `view === 'cart'`, render `<CartPage onContinueShopping={() => setView('products')} />`; otherwise render the existing product list.
- Update `handleAddToCart` to handle `400` responses gracefully — parse the error and show a user-friendly message in the notification (e.g. "Maximum of 5 per item reached").
- After a successful add, keep `cartItemCount` in sync (or re-fetch cart to get accurate count).

---

## Step 12: Add frontend tests

### CartPage component tests

**File:** `test/frontend/components/CartPage/CartPage.test.tsx` (new)

- Renders loading state.
- Renders empty cart message when no items.
- Renders cart items with name, price, quantity, total.
- Quantity change triggers `updateCartItem` API call.
- Remove button triggers `removeFromCart` API call.
- Clear cart button triggers confirmation and `clearCart` API call.
- Displays error message on API failure.

### API client tests

**File:** `test/frontend/api/index.test.ts` (new or extend existing)

- `fetchCart` calls GET `/api/cart` and returns parsed JSON.
- `updateCartItem` calls PUT with correct body.
- `removeFromCart` calls DELETE with correct URL.
- `clearCart` calls DELETE `/api/cart`.
- Each function throws on non-OK response.

### Updated Header tests

**File:** `test/frontend/components/Header/Header.test.tsx` (update)

- Cart button click calls `onCartClick` callback.

### Updated App tests

**File:** `test/frontend/App.test.tsx` (update)

- Clicking cart icon switches to cart view.
- "Continue shopping" returns to product view.

---

## Step 13: Manual smoke test

1. `cd src/backend/MockEcommerce.Api && dotnet run`
2. `cd src/frontend && npm run dev`
3. Verify:
   - Add items from product list — badge increments.
   - Click cart icon — cart page shows with correct items.
   - Change quantity via dropdown — total updates.
   - Try to add > 5 of one item — error notification appears.
   - Remove single item — row disappears.
   - Clear cart — all items removed after confirmation.
   - Navigate back to products — product list displays.

---

## Sequencing Summary

```
ICartService interface (Update method)
         │
         ▼
InMemoryCartService (implement all methods)
         │
         ▼
CartEndpoints (PUT route + implement all handlers)
         │
         ▼
Backend tests (service unit tests + endpoint integration tests)
         │
         ▼
Frontend API client (fetchCart, updateCartItem, removeFromCart, clearCart)
         │
         ▼
Frontend types (CartItem, UpdateCartRequest)
         │
         ▼
CartPage component (new)
         │
         ▼
Header + App.tsx wiring (navigation, error handling)
         │
         ▼
Frontend tests (CartPage, API, Header, App updates)
         │
         ▼
Smoke test
```
