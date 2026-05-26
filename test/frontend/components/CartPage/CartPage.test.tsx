import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CartPage } from "../../../../src/frontend/src/components/CartPage";

vi.mock("../../../../src/frontend/src/api");

import {
  fetchCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from "../../../../src/frontend/src/api";

const mockedFetchCart = vi.mocked(fetchCart);
const mockedUpdateCartItem = vi.mocked(updateCartItem);
const mockedRemoveFromCart = vi.mocked(removeFromCart);
const mockedClearCart = vi.mocked(clearCart);

const mockItems = [
  {
    productId: 1,
    productName: "Wireless Headphones",
    unitPrice: 79.99,
    quantity: 2,
    totalPrice: 159.98,
  },
  {
    productId: 2,
    productName: "Running Shoes",
    unitPrice: 59.99,
    quantity: 1,
    totalPrice: 59.99,
  },
];

describe("CartPage", () => {
  const onContinueShopping = vi.fn();

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders loading state", () => {
    mockedFetchCart.mockReturnValue(new Promise(() => {}));

    render(<CartPage onContinueShopping={onContinueShopping} />);

    expect(screen.getByText(/loading cart/i)).toBeInTheDocument();
  });

  it("renders empty cart message when no items", async () => {
    mockedFetchCart.mockResolvedValue([]);

    render(<CartPage onContinueShopping={onContinueShopping} />);

    expect(await screen.findByText(/your cart is empty/i)).toBeInTheDocument();
  });

  it("calls onContinueShopping when button clicked in empty state", async () => {
    mockedFetchCart.mockResolvedValue([]);

    render(<CartPage onContinueShopping={onContinueShopping} />);
    await screen.findByText(/your cart is empty/i);

    await userEvent.click(
      screen.getByRole("button", { name: /continue shopping/i }),
    );

    expect(onContinueShopping).toHaveBeenCalledOnce();
  });

  it("renders cart items with name, price, quantity, total", async () => {
    mockedFetchCart.mockResolvedValue(mockItems);

    render(<CartPage onContinueShopping={onContinueShopping} />);

    expect(await screen.findByText("Wireless Headphones")).toBeInTheDocument();
    expect(screen.getByText("$79.99")).toBeInTheDocument();
    expect(screen.getByText("$159.98")).toBeInTheDocument();
    expect(screen.getByText("Running Shoes")).toBeInTheDocument();
  });

  it("quantity change triggers updateCartItem API call", async () => {
    mockedFetchCart.mockResolvedValue([mockItems[0]]);
    mockedUpdateCartItem.mockResolvedValue({
      ...mockItems[0],
      quantity: 3,
      totalPrice: 239.97,
    });

    render(<CartPage onContinueShopping={onContinueShopping} />);
    await screen.findByText("Wireless Headphones");

    const select = screen.getByLabelText(/quantity for wireless headphones/i);
    await userEvent.selectOptions(select, "3");

    expect(mockedUpdateCartItem).toHaveBeenCalledWith(1, 3);
  });

  it("remove button triggers removeFromCart API call", async () => {
    mockedFetchCart.mockResolvedValue([mockItems[0]]);
    mockedRemoveFromCart.mockResolvedValue();

    render(<CartPage onContinueShopping={onContinueShopping} />);
    await screen.findByText("Wireless Headphones");

    await userEvent.click(
      screen.getByRole("button", { name: /remove wireless headphones/i }),
    );

    expect(mockedRemoveFromCart).toHaveBeenCalledWith(1);
    await waitFor(() => {
      expect(screen.queryByText("Wireless Headphones")).not.toBeInTheDocument();
    });
  });

  it("clear cart button triggers confirmation and clearCart API call", async () => {
    mockedFetchCart.mockResolvedValue(mockItems);
    mockedClearCart.mockResolvedValue();
    vi.spyOn(window, "confirm").mockReturnValue(true);

    render(<CartPage onContinueShopping={onContinueShopping} />);
    await screen.findByText("Wireless Headphones");

    await userEvent.click(screen.getByRole("button", { name: /clear cart/i }));

    expect(window.confirm).toHaveBeenCalled();
    expect(mockedClearCart).toHaveBeenCalled();
  });

  it("displays error message on API failure", async () => {
    mockedFetchCart.mockResolvedValue([mockItems[0]]);
    mockedUpdateCartItem.mockRejectedValue(new Error("Network error"));

    render(<CartPage onContinueShopping={onContinueShopping} />);
    await screen.findByText("Wireless Headphones");

    const select = screen.getByLabelText(/quantity for wireless headphones/i);
    await userEvent.selectOptions(select, "3");

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Failed to update quantity.",
    );
  });
});
