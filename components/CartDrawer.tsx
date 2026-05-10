"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { formatPrice, type MenuItem } from "@/lib/menu";
import {
  addToCart,
  cartTotal,
  clearCart,
  removeFromCart,
  updateLineQuantity,
  type CartLine,
} from "@/lib/cart-store";
import { getCurrentTableNumber, placeOrder } from "@/lib/order-store";
import { pairingReason, pickPairings } from "@/lib/cart-insights";
import { useTranslation } from "@/lib/i18n";
import { localName } from "@/lib/menu";

type Props = {
  open: boolean;
  cart: CartLine[];
  preferences?: string[];
  menu: MenuItem[];
  onClose: () => void;
};

const SWIPE_DISMISS_THRESHOLD = 110; // px to drag before close fires

export default function CartDrawer({
  open,
  cart,
  preferences = [],
  menu,
  onClose,
}: Props) {
  const { t, lang } = useTranslation();
  const router = useRouter();
  const [dragOffset, setDragOffset] = useState(0);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [sentFlash, setSentFlash] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const startYRef = useRef<number | null>(null);
  const draggingRef = useRef(false);

  // Hold-to-repeat for line quantity buttons
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function clearHold() {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
  }

  function startHold(step: () => void) {
    step();
    holdTimeoutRef.current = setTimeout(() => {
      holdIntervalRef.current = setInterval(step, 80);
    }, 400);
  }

  useEffect(() => clearHold, []);

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
    () => pickPairings(cart, preferences, menu),
    [cart, preferences, menu],
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
        className="relative w-full max-w-[480px] max-h-[88vh] overflow-y-auto overscroll-none rounded-t-3xl bg-cream shadow-xl sm:rounded-3xl"
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
          <h2 className="font-serif text-2xl text-neutral-900">
            {cart.length === 0 ? t("yourCartEmpty") : t("yourCart")}
          </h2>
        </header>

        {cart.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-neutral-600">
            {t("emptyCart")}
          </div>
        ) : (
          <>
            <ul className="divide-y divide-neutral-200 px-6">
              {cart.map((line) => (
                <li key={line.id} className="flex gap-3 py-4">
                  {line.image && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={line.image}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="h-16 w-16 flex-none rounded-lg bg-neutral-100 object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="font-medium text-neutral-900">
                        {lang === "zh" && line.itemNameZh
                          ? line.itemNameZh
                          : line.itemName}
                      </p>
                      <p className="flex-none text-sm tabular-nums text-neutral-700">
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
                    {line.specialRequest && (
                      <p className="mt-1 text-xs italic text-neutral-500">
                        Note: {line.specialRequest}
                      </p>
                    )}
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-2 rounded-full border border-neutral-300 bg-white px-2 py-1 select-none">
                      <button
                        type="button"
                        aria-label={t("decreaseQty")}
                        onPointerDown={(e) => {
                          e.preventDefault();
                          startHold(() =>
                            updateLineQuantity(
                              line.id,
                              Math.max(1, line.quantity - 1),
                            ),
                          );
                        }}
                        onPointerUp={clearHold}
                        onPointerLeave={clearHold}
                        onPointerCancel={clearHold}
                        disabled={line.quantity <= 1}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-cantaloupe text-neutral-900 hover:bg-cantaloupe-soft active:bg-cantaloupe-deep disabled:opacity-40 disabled:cursor-not-allowed touch-none"
                      >
                        −
                      </button>
                      <span className="min-w-[1.25rem] text-center text-sm font-medium tabular-nums">
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label={t("increaseQty")}
                        onPointerDown={(e) => {
                          e.preventDefault();
                          startHold(() =>
                            updateLineQuantity(line.id, line.quantity + 1),
                          );
                        }}
                        onPointerUp={clearHold}
                        onPointerLeave={clearHold}
                        onPointerCancel={clearHold}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-cantaloupe text-neutral-900 hover:bg-cantaloupe-soft active:bg-cantaloupe-deep touch-none"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setConfirmRemoveId(line.id)}
                      className="text-xs text-neutral-500 underline-offset-2 hover:text-neutral-800 hover:underline"
                    >
                      {t("remove")}
                    </button>
                  </div>
                  </div>
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
                      <h3 className="font-medium text-neutral-900">{localName(p, lang)}</h3>
                      <p className="flex-none text-sm text-neutral-700">
                        {formatPrice(p.price)}
                      </p>
                    </div>
                    <p className="mt-1 text-xs text-neutral-500">
                      {pairingReason(p, cart, menu)}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-neutral-500">
                      {lang === "zh" && p.descriptionZh ? p.descriptionZh : p.description}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        addToCart({
                          itemName: p.name,
                          itemNameZh: p.nameZh,
                          basePrice: p.price,
                          quantity: 1,
                          unitPrice: p.price,
                          selections: [],
                          image: p.image,
                        })
                      }
                      className="mt-3 inline-flex items-center gap-1 rounded-full border border-neutral-900 px-4 py-1.5 text-xs font-medium text-neutral-900 transition-colors hover:bg-neutral-900 hover:text-cream"
                    >
                      + {t("addToCart")}
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="sticky bottom-0 mt-2 border-t border-neutral-200 bg-cream/95 px-6 py-5 backdrop-blur">
              <div className="mb-1 flex items-baseline justify-between">
                <span className="text-sm text-neutral-600">{t("subtotal")}</span>
                <span className="text-sm text-neutral-900">{formatPrice(total)}</span>
              </div>
              <div className="mb-3 flex items-baseline justify-between">
                <span className="text-sm text-neutral-600">Tax (9.25%)</span>
                <span className="text-sm text-neutral-900">{formatPrice(Math.round(total * 0.0925))}</span>
              </div>
              <div className="mb-3 flex items-baseline justify-between border-t border-neutral-200 pt-2">
                <span className="text-sm font-semibold text-neutral-900">Total</span>
                <span className="text-lg font-medium text-neutral-900">{formatPrice(Math.round(total * 1.0925))}</span>
              </div>
              {orderError && (
                <p className="mb-3 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-600 border border-red-200">
                  {orderError}
                </p>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="flex-none rounded-full border border-neutral-300 px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-100"
                >
                  {t("clear")}
                </button>
                <button
                  type="button"
                  disabled={sentFlash}
                  className="flex-1 rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-cream hover:bg-neutral-800 disabled:opacity-70"
                  onClick={async () => {
                    if (cart.length === 0) return;
                    setOrderError(null);
                    let order;
                    try {
                      order = await placeOrder(cart, preferences, getCurrentTableNumber());
                    } catch {
                      setOrderError("Couldn't reach the kitchen — please try again.");
                      return;
                    }
                    clearCart();
                    onClose();
                    router.push(`/order/${order.id}`);
                  }}
                >
                  {sentFlash ? t("orderSent") : t("sendToKitchen")}
                </button>
              </div>
            </div>
          </>
        )}

        {confirmClear && (
          <div
            className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={(e) => {
              e.stopPropagation();
              setConfirmClear(false);
            }}
          >
            <div
              role="alertdialog"
              aria-modal="true"
              aria-label={t("clearCartTitle")}
              onClick={(e) => e.stopPropagation()}
              className="mx-6 w-full max-w-[340px] rounded-2xl bg-cream p-5 shadow-xl"
            >
              <h3 className="font-serif text-xl text-neutral-900">
                {t("clearCartTitle")}
              </h3>
              <p className="mt-2 text-sm text-neutral-600">
                {t("clearCartQuestion")}
              </p>
              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="flex-1 rounded-full border border-neutral-300 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-100"
                >
                  {t("cancel")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearCart();
                    setConfirmClear(false);
                  }}
                  className="flex-1 rounded-full bg-neutral-900 px-4 py-2.5 text-sm font-medium text-cream hover:bg-neutral-800"
                >
                  {t("clearAll")}
                </button>
              </div>
            </div>
          </div>
        )}

        {confirmRemoveId && (
          <div
            className="absolute inset-0 z-30 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={(e) => {
              e.stopPropagation();
              setConfirmRemoveId(null);
            }}
          >
            <div
              role="alertdialog"
              aria-modal="true"
              aria-label="Confirm remove"
              onClick={(e) => e.stopPropagation()}
              className="mx-6 w-full max-w-[340px] rounded-2xl bg-cream p-5 shadow-xl"
            >
              <h3 className="font-serif text-xl text-neutral-900">
                {t("removeTitle")}
              </h3>
              <p className="mt-2 text-sm text-neutral-600">
                {t("removeQuestion")}{" "}
                <span className="font-medium text-neutral-900">
                  {(() => {
                    const line = cart.find((l) => l.id === confirmRemoveId);
                    if (!line) return "";
                    return lang === "zh" && line.itemNameZh
                      ? line.itemNameZh
                      : line.itemName;
                  })()}
                </span>{" "}
                {t("fromCart")}
              </p>
              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmRemoveId(null)}
                  className="flex-1 rounded-full border border-neutral-300 px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-100"
                >
                  {t("cancel")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    removeFromCart(confirmRemoveId);
                    setConfirmRemoveId(null);
                  }}
                  className="flex-1 rounded-full bg-neutral-900 px-4 py-2.5 text-sm font-medium text-cream hover:bg-neutral-800"
                >
                  {t("remove")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
