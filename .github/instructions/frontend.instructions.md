---
applyTo: "src/frontend/**,test/frontend/**"
---

# Frontend Instructions — React 19 + TypeScript + Vite

## Tech & Versions

- **Framework:** React 19.2.4
- **Language:** TypeScript ~6.0.2
- **Build tool:** Vite 8.x
- **Linting:** ESLint 9 with eslint-plugin-react-hooks, eslint-plugin-react-refresh, typescript-eslint
- **Testing:** Vitest 4.x + @testing-library/react 16 + jsdom
- **Package manager:** npm (workspace: root `package.json` has `"workspaces": ["src/frontend"]`)

## Key Files

- `src/frontend/src/App.tsx` — Root component: renders Header, HeroBanner, ProductList; handles add-to-cart with notification
- `src/frontend/src/api/index.ts` — API client functions: `fetchProducts()`, `fetchProductById(id)`, `addToCart(request)`
- `src/frontend/src/types/index.ts` — TypeScript interfaces: `Product`, `AddToCartRequest`
- `src/frontend/src/hooks/useProducts.ts` — Custom hook that fetches products on mount
- `src/frontend/src/components/Header/Header.tsx` — Site header with cart item count badge
- `src/frontend/src/components/HeroBanner/HeroBanner.tsx` — Promotional banner
- `src/frontend/src/components/ProductCard/ProductCard.tsx` — Single product card with add-to-cart button
- `src/frontend/src/components/ProductList/ProductList.tsx` — Grid of ProductCards

## API Base URL

`/api` (relative). Vite dev server proxies `/api` → `http://localhost:5063`.

## Run & Test

```bash
# Run dev server
cd src/frontend && npm install && npm run dev   # http://localhost:5173

# Run tests (from repo root)
npm test          # or: npx vitest run
```

## Test Setup

- Config: `vitest.config.ts` at repo root
- Environment: jsdom
- Setup: `src/frontend/src/test-setup.ts` (imports `@testing-library/jest-dom`)
- Test location: `test/frontend/**/*.test.{ts,tsx}`
- Tests use `vi.mock()` for hooks and API modules

## Components

All components are function components using TypeScript interfaces for props. Each component folder has an `index.ts` barrel export.
