"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatPrice } from "@/lib/menu";
import {
  addToCart,
  cartTotal,
  clearCart,
  removeFromCart,
  type CartLine,
} from "@/lib/cart-store";
import { pairingReason, pickPairings } from "@/lib/cart-insights";

type Props = {
  open: boolean;
  cart: CartLine[];
  preferences?: string[];
  onClose: () => void;
};

const SWIPE_DISMISS_THRESHOLD = 110; // px to drag before close fires

export default function CartDrawer({
  open,
  cart,
  preferences = [],
  onClose,
}: Props) {
  const [dragOffset, setDragOffset] = useState(0);
  const startYRef = useRef<number | null>(null);
  const draggingRef = useRef(false);

  useEffect(() => {
    if (!open) return;
    const orig = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = orig;
    };
  }, [open]);

  // Reset drag state when the drawer reopens
  useEffect(() => {
    if (open) setDragOffset(0);
  }, [open]);

  const pairings = useMemo(
    () => pickPairings(cart, preferences),
    [cart, preferences],
  );

  if (!open) return null;

  const total = cartTotal(cart);

  function handleTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    startYRef.current = e.touches[0].clientY;
    draggingRef.current = true;
  }

  function handleTouchMove(e: React.TouchEvent<HTMLDivElement>) {
    if (!draggingRef.current || startYRef.current == null) return;
    const dy = e.touches[0].clientY - startYRef.current;
    // Only respond to downward drag
    setDragOffset(Math.max(0, dy));
  }

  function handleTouchEnd() {
    if (dragOffset > SWIPE_DISMISS_THRESHOLD) {
      onClose();
    } else {
      setDragOffset(0);
    }
    draggingRef.current = false;
    startYRef.current = null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center"
      onClick={onClose}
      style={{
        transition: draggingRef.current ? "none" : "background-color 150ms",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Cart"
        onClick={(e) => e.stopPropagation()}
        style={{
          transform: `translateY(${dragOffset}px)`,
          transition: draggingRef.current ? "none" : "transform 200ms ease-out",
        }}
        className="relative w-full max-w-[480px] max-h-[88vh] overflow-y-auto rounded-t-3xl bg-cream shadow-xl sm:rounded-3xl"
      >
        {/* Drag handle — touch this region to swipe down */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          className="sticky top-0 z-10 flex cursor-grab touch-none flex-col items-center justify-center bg-cream/95 pt-3 pb-1 backdrop-blur active:cursor-grabbing"
          aria-hidden="true"
        >
          <span className="h-1.5 w-12 rounded-full bg-neutral-300" />
        </div>

        <header
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          className="sticky top-6 z-10 flex items-center justify-between border-b border-neutral-200 bg-cream/95 px-6 py-4 backdrop-blur"
        >
          <h2 className="font-serif text-2xl text-neutral-900">Your cart</h2>
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

            {pairings.length > 0 && (
              <div className="space-y-3 px-6 pb-2 pt-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  {pairings.length === 1
                    ? "Pair a drink with your bowl"
                    : `Pair drinks with your ${pairings.length} bowls`}
                </p>
                {pairings.map((p) => (
                  <div
                    key={p.name}
                    className="rounded-2xl border border-neutral-200 bg-white p-4"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="font-medium text-neutral-900">{p.name}</h3>
                      <p className="flex-none text-sm text-neutral-700">
                        {formatPrice(p.price)}
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-neutral-500">
                      {pairingReason(p, cart)}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-neutral-500">
                      {p.description}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        addToCart({
                          itemName: p.name,
                          basePrice: p.price,
                          quantity: 1,
                          unitPrice: p.price,
                          selections: [],
                        })
                      }
                      className="mt-3 inline-flex items-center gap-1 rounded-full border border-neutral-900 px-4 py-1.5 text-xs font-medium text-neutral-900 transition-colors hover:bg-neutral-900 hover:text-cream"
                    >
                      + Add to cart
                    </button>
                  </div>
                ))}
              </div>
            )}

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
