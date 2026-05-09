"use client";

import { useEffect } from "react";
import { formatPrice } from "@/lib/menu";
import {
  cartTotal,
  clearCart,
  removeFromCart,
  type CartLine,
} from "@/lib/cart-store";

type Props = {
  open: boolean;
  cart: CartLine[];
  onClose: () => void;
};

export default function CartDrawer({ open, cart, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const orig = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = orig;
    };
  }, [open]);

  if (!open) return null;

  const total = cartTotal(cart);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Cart"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[480px] max-h-[88vh] overflow-y-auto rounded-t-3xl bg-cream shadow-xl sm:rounded-3xl"
      >
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-cream/95 px-6 py-4 backdrop-blur">
          <h2 className="font-serif text-2xl text-neutral-900">Your cart</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close cart"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-200 text-neutral-700 hover:bg-neutral-300"
          >
            ×
          </button>
        </header>

        {cart.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-neutral-600">
            Your cart is empty. Pick something tasty from the menu.
          </div>
        ) : (
          <>
            <ul className="divide-y divide-neutral-200 px-6">
              {cart.map((line) => (
                <li key={line.id} className="py-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="font-medium text-neutral-900">
                      {line.quantity > 1 && (
                        <span className="mr-1 text-neutral-500">
                          {line.quantity}×
                        </span>
                      )}
                      {line.itemName}
                    </p>
                    <p className="text-sm text-neutral-700">
                      {formatPrice(line.unitPrice * line.quantity)}
                    </p>
                  </div>
                  {line.selections.length > 0 && (
                    <ul className="mt-1 space-y-0.5 text-xs text-neutral-500">
                      {line.selections.map((s) => (
                        <li key={s.groupLabel}>
                          {s.groupLabel}: {s.choiceLabels.join(", ")}
                        </li>
                      ))}
                    </ul>
                  )}
                  <button
                    type="button"
                    onClick={() => removeFromCart(line.id)}
                    className="mt-2 text-xs text-neutral-500 underline-offset-2 hover:text-neutral-800 hover:underline"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>

            <div className="sticky bottom-0 mt-2 border-t border-neutral-200 bg-cream/95 px-6 py-5 backdrop-blur">
              <div className="mb-3 flex items-baseline justify-between">
                <span className="text-sm text-neutral-600">Subtotal</span>
                <span className="text-lg font-medium text-neutral-900">
                  {formatPrice(total)}
                </span>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    clearCart();
                  }}
                  className="flex-none rounded-full border border-neutral-300 px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-100"
                >
                  Clear
                </button>
                <button
                  type="button"
                  className="flex-1 rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-cream hover:bg-neutral-800"
                  onClick={() => {
                    alert("Checkout flow coming soon.");
                  }}
                >
                  Checkout
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
