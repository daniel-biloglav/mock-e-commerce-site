using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using MockEcommerce.Api.Models;

namespace MockEcommerce.Api.Tests.Endpoints;

public class CartEndpointTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly WebApplicationFactory<Program> _factory;

    public CartEndpointTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
    }

    private HttpClient CreateClient() => _factory.CreateClient();

    private static async Task ClearCart(HttpClient client)
    {
        await client.DeleteAsync("/api/cart");
    }

    private static async Task<CartItem?> AddProduct(HttpClient client, int productId = 1, int quantity = 1)
    {
        var response = await client.PostAsJsonAsync("/api/cart", new { productId, quantity });
        if (response.IsSuccessStatusCode)
            return await response.Content.ReadFromJsonAsync<CartItem>();
        return null;
    }

    [Fact]
    public async Task GetCart_ReturnsOkWithEmptyArray()
    {
        var client = CreateClient();
        await ClearCart(client);

        var response = await client.GetAsync("/api/cart");

        response.EnsureSuccessStatusCode();
        var items = await response.Content.ReadFromJsonAsync<List<CartItem>>();
        Assert.NotNull(items);
        Assert.Empty(items);
    }

    [Fact]
    public async Task PostCart_WithValidProduct_ReturnsCreatedWithItem()
    {
        var client = CreateClient();
        await ClearCart(client);

        var response = await client.PostAsJsonAsync("/api/cart", new { productId = 1, quantity = 1 });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var item = await response.Content.ReadFromJsonAsync<CartItem>();
        Assert.NotNull(item);
        Assert.Equal(1, item.ProductId);
        Assert.Equal(1, item.Quantity);
    }

    [Fact]
    public async Task PostCart_WithExistingItem_IncrementsQuantityReturnsOk()
    {
        var client = CreateClient();
        await ClearCart(client);
        await AddProduct(client, productId: 1, quantity: 1);

        var response = await client.PostAsJsonAsync("/api/cart", new { productId = 1, quantity = 2 });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var item = await response.Content.ReadFromJsonAsync<CartItem>();
        Assert.NotNull(item);
        Assert.Equal(3, item.Quantity);
    }

    [Fact]
    public async Task PostCart_WithQuantityExceedingMax_ReturnsBadRequest()
    {
        var client = CreateClient();
        await ClearCart(client);
        await AddProduct(client, productId: 1, quantity: 3);

        var response = await client.PostAsJsonAsync("/api/cart", new { productId = 1, quantity = 3 });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(6)]
    public async Task PostCart_WithInvalidQuantity_ReturnsBadRequest(int quantity)
    {
        var client = CreateClient();
        await ClearCart(client);

        var response = await client.PostAsJsonAsync("/api/cart", new { productId = 1, quantity });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task PostCart_WithNonExistentProduct_ReturnsNotFound()
    {
        var client = CreateClient();
        await ClearCart(client);

        var response = await client.PostAsJsonAsync("/api/cart", new { productId = 9999, quantity = 1 });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task PutCartItem_WithValidQuantity_ReturnsOk()
    {
        var client = CreateClient();
        await ClearCart(client);
        await AddProduct(client, productId: 1, quantity: 1);

        var response = await client.PutAsJsonAsync("/api/cart/1", new { quantity = 3 });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var item = await response.Content.ReadFromJsonAsync<CartItem>();
        Assert.NotNull(item);
        Assert.Equal(3, item.Quantity);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(6)]
    public async Task PutCartItem_WithInvalidQuantity_ReturnsBadRequest(int quantity)
    {
        var client = CreateClient();
        await ClearCart(client);
        await AddProduct(client, productId: 1, quantity: 1);

        var response = await client.PutAsJsonAsync("/api/cart/1", new { quantity });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task PutCartItem_ForItemNotInCart_ReturnsNotFound()
    {
        var client = CreateClient();
        await ClearCart(client);

        var response = await client.PutAsJsonAsync("/api/cart/999", new { quantity = 2 });

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task DeleteCartItem_RemovesItemReturnsNoContent()
    {
        var client = CreateClient();
        await ClearCart(client);
        await AddProduct(client, productId: 1, quantity: 1);

        var response = await client.DeleteAsync("/api/cart/1");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    [Fact]
    public async Task DeleteCartItem_ForMissingItem_ReturnsNotFound()
    {
        var client = CreateClient();
        await ClearCart(client);

        var response = await client.DeleteAsync("/api/cart/999");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task DeleteCart_ClearsAllItemsReturnsNoContent()
    {
        var client = CreateClient();
        await ClearCart(client);
        await AddProduct(client, productId: 1, quantity: 1);
        await AddProduct(client, productId: 2, quantity: 1);

        var response = await client.DeleteAsync("/api/cart");

        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);

        var getResponse = await client.GetAsync("/api/cart");
        var items = await getResponse.Content.ReadFromJsonAsync<List<CartItem>>();
        Assert.NotNull(items);
        Assert.Empty(items);
    }
}
