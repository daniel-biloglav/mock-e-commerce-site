import { useState, useEffect, useCallback } from "react";
import type { CartItem } from "../../types";
import {
  fetchCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from "../../api";

interface CartPageProps {
  onContinueShopping: () => void;
}

export function CartPage({ onContinueShopping }: CartPageProps) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCart = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchCart();
      setItems(data);
    } catch {
      setError("Failed to load cart.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  async function handleQuantityChange(productId: number, newQuantity: number) {
    try {
      setError(null);
      const updated = await updateCartItem(productId, newQuantity);
      setItems((prev) =>
        prev.map((item) => (item.productId === productId ? updated : item)),
      );
    } catch {
      setError("Failed to update quantity.");
    }
  }

  async function handleRemove(productId: number) {
    try {
      setError(null);
      await removeFromCart(productId);
      setItems((prev) => prev.filter((item) => item.productId !== productId));
    } catch {
      setError("Failed to remove item.");
    }
  }

  async function handleClear() {
    if (!window.confirm("Are you sure you want to clear your cart?")) return;
    try {
      setError(null);
      await clearCart();
      setItems([]);
    } catch {
      setError("Failed to clear cart.");
    }
  }

  const grandTotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

  if (loading) {
    return <p className="app__loading">Loading cart…</p>;
  }

  if (items.length === 0) {
    return (
      <div className="cart-empty">
        <p className="cart-empty__message">Your cart is empty</p>
        <button className="cart-empty__button" onClick={onContinueShopping}>
          Continue shopping
        </button>
      </div>
    );
  }

  return (
    <div className="cart">
      {error && (
        <div className="cart__error" role="alert">
          {error}
        </div>
      )}

      <table className="cart__table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Unit Price</th>
            <th>Quantity</th>
            <th>Total</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.productId} className="cart__row">
              <td className="cart__product-name">{item.productName}</td>
              <td className="cart__unit-price">${item.unitPrice.toFixed(2)}</td>
              <td>
                <select
                  className="cart__quantity-select"
                  value={item.quantity}
                  onChange={(e) =>
                    handleQuantityChange(item.productId, Number(e.target.value))
                  }
                  aria-label={`Quantity for ${item.productName}`}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </td>
              <td className="cart__line-total">
                ${item.totalPrice.toFixed(2)}
              </td>
              <td>
                <button
                  className="cart__remove-button"
                  onClick={() => handleRemove(item.productId)}
                  aria-label={`Remove ${item.productName} from cart`}
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="cart__footer">
        <div className="cart__summary">
          <span className="cart__item-count">
            {items.length} {items.length === 1 ? "item" : "items"}
          </span>
          <span className="cart__grand-total">
            Total: ${grandTotal.toFixed(2)}
          </span>
        </div>
        <button className="cart__clear-button" onClick={handleClear}>
          Clear cart
        </button>
      </div>
    </div>
  );
}
