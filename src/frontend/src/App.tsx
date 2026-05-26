import { useState, useRef, useEffect } from "react";
import type { Product } from "./types";
import { Header } from "./components/Header";
import { HeroBanner } from "./components/HeroBanner";
import { ProductList } from "./components/ProductList";
import { CartPage } from "./components/CartPage";
import { useProducts } from "./hooks/useProducts";
import { addToCart } from "./api";
import "./App.css";

export function App() {
  const { products, loading, error } = useProducts();
  const [cartMessage, setCartMessage] = useState<string | null>(null);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [view, setView] = useState<"products" | "cart">("products");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  async function handleAddToCart(product: Product) {
    try {
      await addToCart({ productId: product.id, quantity: 1 });
      setCartItemCount((prev) => prev + 1);
      setCartMessage(`"${product.name}" added to cart!`);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCartMessage(null), 3000);
    } catch {
      setCartMessage("Cannot add more — maximum of 5 per item.");
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCartMessage(null), 3000);
    }
  }

  return (
    <div className="app">
      <Header
        cartItemCount={cartItemCount}
        onCartClick={() => setView("cart")}
      />

      {view === "cart" ? (
        <main className="app__main">
          <h1 className="app__section-heading">Your cart</h1>
          <CartPage onContinueShopping={() => setView("products")} />
        </main>
      ) : (
        <>
          <HeroBanner />
          <main className="app__main">
            <h1 className="app__section-heading">Our products</h1>

            {cartMessage && (
              <div className="app__notification" role="status">
                {cartMessage}
              </div>
            )}

            {loading && <p className="app__loading">Loading products…</p>}
            {error && <p className="app__error">Error: {error}</p>}
            {!loading && !error && (
              <ProductList products={products} onAddToCart={handleAddToCart} />
            )}
          </main>
        </>
      )}
    </div>
  );
}
