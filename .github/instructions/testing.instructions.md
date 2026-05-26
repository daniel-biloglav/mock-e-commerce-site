---
applyTo: "test/**"
---

# Testing Instructions

## Frontend Tests

- **Framework:** Vitest 4.x with @testing-library/react 16
- **Environment:** jsdom
- **Config:** `vitest.config.ts` at repo root
- **Setup:** `src/frontend/src/test-setup.ts` imports `@testing-library/jest-dom`
- **Test files:** `test/frontend/**/*.test.{ts,tsx}`
- **Run command:** `npm test` or `npx vitest run` (from repo root)
- **Globals:** Vitest globals enabled (`vi`, `describe`, `it`, `expect` available without import)
- **Mocking:** Tests use `vi.mock()` to mock `useProducts` hook and `addToCart` API

### Frontend Test Files

| File                                                        | What it tests                                                        |
| ----------------------------------------------------------- | -------------------------------------------------------------------- |
| `test/frontend/App.test.tsx`                                | App component integration (header, hero, products, add-to-cart flow) |
| `test/frontend/components/Header/Header.test.tsx`           | Header with cart badge                                               |
| `test/frontend/components/HeroBanner/HeroBanner.test.tsx`   | Hero banner rendering                                                |
| `test/frontend/components/ProductCard/ProductCard.test.tsx` | Product card display + add-to-cart button                            |
| `test/frontend/components/ProductList/ProductList.test.tsx` | Product list grid rendering                                          |
| `test/frontend/hooks/useProducts.test.ts`                   | useProducts hook fetch behavior                                      |

## Backend Tests

- **Framework:** xUnit 2.9
- **Integration testing:** `Microsoft.AspNetCore.Mvc.Testing 10` with `WebApplicationFactory<Program>`
- **Coverage:** coverlet 6.0.4
- **Project:** `test/backend/MockEcommerce.Api.Tests/MockEcommerce.Api.Tests.csproj`
- **Run command:** `cd test/backend/MockEcommerce.Api.Tests && dotnet test`
- **Enabled by:** `public partial class Program { }` in `Program.cs`

### Backend Test Files

| File                                                   | What it tests                                                                 |
| ------------------------------------------------------ | ----------------------------------------------------------------------------- |
| `test/backend/.../Endpoints/ProductEndpointTests.cs`   | GET /api/products and GET /api/products/{id} via HTTP (WebApplicationFactory) |
| `test/backend/.../Services/MockProductServiceTests.cs` | MockProductService.GetAll() and GetById() unit tests                          |
