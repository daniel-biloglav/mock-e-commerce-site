# Mock E-Commerce Site — Copilot Instructions

Mock e-commerce app ("Mock Shop"). **React 19 + TypeScript frontend**, **ASP.NET Core Minimal API (.NET 10) backend**. Product catalog + shopping cart.

## Tech Stack

- **Frontend:** React 19.2.4, TypeScript ~6.0.2, Vite 8.x, ESLint 9, Vitest 4.x + @testing-library/react 16 + jsdom
- **Backend:** ASP.NET Core Minimal API, .NET 10 (net10.0), C# (nullable + implicit usings)
- **Backend testing:** xUnit 2.9 + Microsoft.AspNetCore.Mvc.Testing 10 + coverlet
- **Monorepo:** npm workspaces — root `package.json` has `"workspaces": ["src/frontend"]`

## Key Files

- `src/frontend/src/App.tsx` — Root component (product list + cart)
- `src/frontend/src/api/index.ts` — API client: `fetchProducts`, `fetchProductById`, `addToCart`
- `src/frontend/src/types/index.ts` — TS interfaces: `Product`, `AddToCartRequest`
- `src/frontend/src/hooks/useProducts.ts` — Fetches products on mount
- `src/frontend/src/components/` — `Header/`, `HeroBanner/`, `ProductCard/`, `ProductList/`
- `src/backend/MockEcommerce.Api/Program.cs` — DI, CORS, OpenAPI, route mapping
- `src/backend/MockEcommerce.Api/Models/Product.cs` — Id, Name, Description, Price, Category, Stock, ImageUrl
- `src/backend/MockEcommerce.Api/Models/CartItem.cs` — ProductId, ProductName, UnitPrice, Quantity, TotalPrice (computed)
- `src/backend/MockEcommerce.Api/Services/MockProductService.cs` — 5 hardcoded in-memory products
- `src/backend/MockEcommerce.Api/Services/InMemoryCartService.cs` — **ALL methods throw NotImplementedException**
- `src/backend/MockEcommerce.Api/Endpoints/ProductEndpoints.cs` — ✅ Working
- `src/backend/MockEcommerce.Api/Endpoints/CartEndpoints.cs` — ❌ **ALL handlers throw NotImplementedException**
- `test/frontend/` — Vitest tests for App, Header, HeroBanner, ProductCard, ProductList, useProducts
- `test/backend/MockEcommerce.Api.Tests/` — xUnit: `ProductEndpointTests.cs` (WebApplicationFactory), `MockProductServiceTests.cs`

## Implementation State

**Working:** Product catalog backend (`MockProductService`), product endpoints (`GET /api/products`, `GET /api/products/{id}`), full frontend product display + add-to-cart UI.

**NOT implemented (throws NotImplementedException):** `InMemoryCartService` (all 5 methods), `CartEndpoints` (all 4 handlers). Frontend cart UI is wired but backend returns 500.

## Product Data (in `MockProductService.cs`)

| Id  | Name                         | Price   | Category    | Stock |
| --- | ---------------------------- | ------- | ----------- | ----- |
| 1   | Wireless Headphones          | $79.99  | Electronics | 25    |
| 2   | Running Shoes                | $59.99  | Footwear    | 40    |
| 3   | Stainless Steel Water Bottle | $24.99  | Accessories | 100   |
| 4   | Mechanical Keyboard          | $109.99 | Electronics | 15    |
| 5   | Yoga Mat                     | $34.99  | Sports      | 60    |

## API Endpoints

| Method | Route                   | Status                                                       |
| ------ | ----------------------- | ------------------------------------------------------------ |
| GET    | `/api/products`         | ✅ Working                                                   |
| GET    | `/api/products/{id}`    | ✅ Working (404 if not found)                                |
| GET    | `/api/cart`             | ❌ NotImplementedException                                   |
| POST   | `/api/cart`             | ❌ NotImplementedException (body: `{ productId, quantity }`) |
| DELETE | `/api/cart/{productId}` | ❌ NotImplementedException                                   |
| DELETE | `/api/cart`             | ❌ NotImplementedException                                   |

OpenAPI at `/openapi/v1.json`.

## Run

- **Backend:** `cd src/backend/MockEcommerce.Api && dotnet run` → http://localhost:5063
- **Frontend:** `cd src/frontend && npm install && npm run dev` → http://localhost:5173 (proxies `/api` → localhost:5063)

## Test

- **Frontend:** `npm test` or `npx vitest run` (from repo root). Config: `vitest.config.ts`, env: jsdom, setup: `src/frontend/src/test-setup.ts`
- **Backend:** `cd test/backend/MockEcommerce.Api.Tests && dotnet test`. Uses `WebApplicationFactory<Program>`.

## Architecture

- DI (Program.cs): `IProductService` → `MockProductService` (Singleton), `ICartService` → `InMemoryCartService` (Singleton)
- CORS allows `http://localhost:5173`. Vite proxies `/api` → `http://localhost:5063`
- No database (in-memory). No authentication (shared singleton cart).
