---
applyTo: "src/backend/**"
---

# Backend Instructions — ASP.NET Core (.NET 10) Minimal API

## Tech & Versions

- **Framework:** ASP.NET Core Minimal API, .NET 10 (`net10.0`)
- **Language:** C# with `<Nullable>enable</Nullable>` and `<ImplicitUsings>enable</ImplicitUsings>`
- **NuGet:** `Microsoft.AspNetCore.OpenApi 10.0.5`
- **Testing:** xUnit 2.9, `Microsoft.AspNetCore.Mvc.Testing 10`, coverlet 6.0.4
- **Solution file:** `src/backend/MockEcommerce.slnx`
- **Project file:** `src/backend/MockEcommerce.Api/MockEcommerce.Api.csproj`

## DI Registrations (Program.cs)

- `IProductService` → `MockProductService` (Singleton)
- `ICartService` → `InMemoryCartService` (Singleton)

## Models

- `Product` — Id (int), Name (string), Description (string), Price (decimal), Category (string), Stock (int), ImageUrl (string)
- `CartItem` — ProductId (int), ProductName (string), UnitPrice (decimal), Quantity (int), TotalPrice (computed: UnitPrice × Quantity)

## Endpoints

- `ProductEndpoints` at `/api/products` — fully implemented (GET all, GET by id)
- `CartEndpoints` at `/api/cart` — ALL throw `NotImplementedException` (GET, POST, DELETE /{productId}, DELETE /)
- `AddToCartRequest` record: `(int ProductId, int Quantity)` — defined in `CartEndpoints.cs`

## Services

- `MockProductService` — returns 5 hardcoded products in-memory
- `InMemoryCartService` — all methods throw `NotImplementedException`; has `_cart` (List<CartItem>) and `_lock` (Lock) fields ready

## Run & Test

```bash
# Run
cd src/backend/MockEcommerce.Api && dotnet run   # http://localhost:5063

# Test
cd test/backend/MockEcommerce.Api.Tests && dotnet test
```

## CORS

Allows origin `http://localhost:5173` with any header/method.

## OpenAPI

Enabled via `app.MapOpenApi()` → available at `/openapi/v1.json`.
