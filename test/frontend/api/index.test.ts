import {
  fetchCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from "../../../src/frontend/src/api";

describe("API client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fetchCart calls GET /api/cart and returns parsed JSON", async () => {
    const mockItems = [
      {
        productId: 1,
        productName: "Item",
        unitPrice: 10,
        quantity: 1,
        totalPrice: 10,
      },
    ];
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(mockItems), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const result = await fetchCart();

    expect(fetch).toHaveBeenCalledWith("/api/cart");
    expect(result).toEqual(mockItems);
  });

  it("fetchCart throws on non-OK response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 500 }),
    );

    await expect(fetchCart()).rejects.toThrow("Failed to fetch cart");
  });

  it("updateCartItem calls PUT with correct body", async () => {
    const mockItem = {
      productId: 1,
      productName: "Item",
      unitPrice: 10,
      quantity: 3,
      totalPrice: 30,
    };
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(mockItem), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const result = await updateCartItem(1, 3);

    expect(fetch).toHaveBeenCalledWith("/api/cart/1", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: 3 }),
    });
    expect(result).toEqual(mockItem);
  });

  it("updateCartItem throws on non-OK response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 400 }),
    );

    await expect(updateCartItem(1, 3)).rejects.toThrow(
      "Failed to update cart item",
    );
  });

  it("removeFromCart calls DELETE with correct URL", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 204 }),
    );

    await removeFromCart(5);

    expect(fetch).toHaveBeenCalledWith("/api/cart/5", { method: "DELETE" });
  });

  it("removeFromCart throws on non-OK response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 404 }),
    );

    await expect(removeFromCart(5)).rejects.toThrow(
      "Failed to remove item from cart",
    );
  });

  it("clearCart calls DELETE /api/cart", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 204 }),
    );

    await clearCart();

    expect(fetch).toHaveBeenCalledWith("/api/cart", { method: "DELETE" });
  });

  it("clearCart throws on non-OK response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 500 }),
    );

    await expect(clearCart()).rejects.toThrow("Failed to clear cart");
  });
});
