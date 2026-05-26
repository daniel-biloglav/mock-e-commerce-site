using MockEcommerce.Api.Models;
using MockEcommerce.Api.Services;

namespace MockEcommerce.Api.Tests.Services;

public class InMemoryCartServiceTests
{
    private readonly InMemoryCartService _service = new();

    private static CartItem CreateItem(int productId = 1, string name = "Test Product", decimal unitPrice = 10.00m, int quantity = 1)
        => new() { ProductId = productId, ProductName = name, UnitPrice = unitPrice, Quantity = quantity };

    [Fact]
    public void GetAll_ReturnsEmptyListInitially()
    {
        var items = _service.GetAll().ToList();

        Assert.Empty(items);
    }

    [Fact]
    public void Add_NewItem_ReturnsItemWithCorrectFields()
    {
        var item = CreateItem(productId: 1, name: "Headphones", unitPrice: 79.99m, quantity: 2);

        var result = _service.Add(item);

        Assert.Equal(1, result.ProductId);
        Assert.Equal("Headphones", result.ProductName);
        Assert.Equal(79.99m, result.UnitPrice);
        Assert.Equal(2, result.Quantity);
        Assert.Equal(159.98m, result.TotalPrice);
    }

    [Fact]
    public void Add_ExistingItem_IncrementsQuantity()
    {
        _service.Add(CreateItem(productId: 1, quantity: 2));

        var result = _service.Add(CreateItem(productId: 1, quantity: 3));

        Assert.Equal(5, result.Quantity);
    }

    [Fact]
    public void GetByProductId_ReturnsNullForMissingItem()
    {
        var result = _service.GetByProductId(999);

        Assert.Null(result);
    }

    [Fact]
    public void GetByProductId_ReturnsItemWhenPresent()
    {
        _service.Add(CreateItem(productId: 42, name: "Widget"));

        var result = _service.GetByProductId(42);

        Assert.NotNull(result);
        Assert.Equal(42, result.ProductId);
        Assert.Equal("Widget", result.ProductName);
    }

    [Fact]
    public void Update_ExistingItem_SetsNewQuantityAndRecomputesTotal()
    {
        _service.Add(CreateItem(productId: 1, unitPrice: 25.00m, quantity: 1));

        var result = _service.Update(1, 4);

        Assert.NotNull(result);
        Assert.Equal(4, result.Quantity);
        Assert.Equal(100.00m, result.TotalPrice);
    }

    [Fact]
    public void Update_MissingItem_ReturnsNull()
    {
        var result = _service.Update(999, 3);

        Assert.Null(result);
    }

    [Fact]
    public void Remove_ExistingItem_ReturnsTrue()
    {
        _service.Add(CreateItem(productId: 1));

        var result = _service.Remove(1);

        Assert.True(result);
        Assert.Empty(_service.GetAll());
    }

    [Fact]
    public void Remove_MissingItem_ReturnsFalse()
    {
        var result = _service.Remove(999);

        Assert.False(result);
    }

    [Fact]
    public void Clear_EmptiesTheCart()
    {
        _service.Add(CreateItem(productId: 1));
        _service.Add(CreateItem(productId: 2));

        _service.Clear();

        Assert.Empty(_service.GetAll());
    }
}
