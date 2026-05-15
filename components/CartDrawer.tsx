"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatPrice, itemNamesForLocales, type MenuItem } from "@/lib/menu";
import {
  addToCart,
  cartLineName,
  cartTotal,
  clearCart,
  removeFromCart,
  updateLineQuantity,
  type CartLine,
} from "@/lib/cart-store";
import { getCurrentTableNumber, placeOrder } from "@/lib/order-store";
import { pairingReason, pickPairings } from "@/lib/cart-insights";
import {
  isCJK,
  translateChoiceLabel,
  translateGroupLabel,
  useTranslation,
} from "@/lib/i18n";
import { localDescription, localName } from "@/lib/menu";
import {
  CUSTOM_ALLERGENS_EVENT,
  getStoredCustomAllergens,
} from "@/lib/preferences-store";

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

  // Robust scroll lock: overflow:hidden alone isn't enough on iOS Safari —
  // overscroll inside the cart can still propagate to the body, exposing
  // the menu page underneath. Freeze the body in place with position:fixed
  // and restore the scroll position on close.
  useEffect(() => {
    if (!open) return;
    if (typeof window === "undefined") return;

    const scrollY = window.scrollY;
    const body = document.body;
    const orig = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
    };

    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";

    return () => {
      Object.assign(body.style, orig);
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  // Reset drag state when the drawer reopens
  useEffect(() => {
    if (open) setDragOffset(0);
  }, [open]);

  // Custom allergens (chat-stated). These narrow the pairing pool just
  // like the standard preferences do — a soy-allergic guest who said
  // "no soy" in chat must not be offered Soy Milk Tea as a pairing.
  const [customAllergens, setCustomAllergens] = useState<string[]>([]);
  useEffect(() => {
    setCustomAllergens(getStoredCustomAllergens());
    function onChange(e: Event) {
      const detail = (e as CustomEvent<string[]>).detail;
      if (Array.isArray(detail)) setCustomAllergens(detail);
    }
    window.addEventListener(CUSTOM_ALLERGENS_EVENT, onChange);
    return () => window.removeEventListener(CUSTOM_ALLERGENS_EVENT, onChange);
  }, []);

  const pairings = useMemo(
    () => pickPairings(cart, preferences, menu, customAllergens),
    [cart, preferences, menu, customAllergens],
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
      className="fixed inset-0 z-50 flex items-end justify-center bg-cream sm:items-center sm:bg-black/40 sm:backdrop-blur-sm"
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
        className="relative flex w-full max-w-[480px] flex-col h-auto max-h-[100dvh] min-h-0 overflow-y-auto overscroll-none bg-cream sm:h-auto sm:max-h-[88vh] sm:rounded-3xl"
      >
        {/* Drag handle — touch this region to swipe down. Mobile-only:
            on desktop there's no swipe-to-dismiss gesture, so hiding it
            lets the "YOUR CART" header sit closer to the top edge. */}
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          className="sticky top-0 z-10 flex cursor-grab touch-none flex-col items-center justify-center bg-cream/95 pt-3 pb-1 backdrop-blur active:cursor-grabbing sm:hidden"
          aria-hidden="true"
        >
          <span className="h-1.5 w-12 rounded-full bg-neutral-300" />
        </div>

        <header
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          className="sticky top-6 z-10 flex items-center justify-between border-b border-neutral-200 bg-cream/95 px-6 py-4 backdrop-blur sm:top-0 sm:py-3"
        >
          <h2
            className={[
              "whitespace-pre-line text-2xl font-semibold uppercase text-neutral-900",
              isCJK(lang) ? "tracking-normal" : "tracking-[0.08em]",
            ].join(" ")}
          >
            {cart.length === 0 ? t("yourCartEmpty") : t("yourCart")}
          </h2>
        </header>

        {cart.length === 0 ? (
          <div className="flex flex-col items-center px-6 pt-6 pb-10 text-center sm:py-12">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/cart-empty.webp"
              alt=""
              aria-hidden="true"
              className="h-48 w-48 object-contain sm:h-56 sm:w-56"
            />
            <p className="mt-4 text-2xl text-neutral-600">{t("emptyCart")}</p>
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
                      // Square thumbnail in both views — same aspect ratio
                      // as the menu cards, just sized down. Mobile keeps
                      // the original 96px; desktop is a slightly larger
                      // 112px square that sits to the left of the title.
                      className="h-24 w-24 flex-none rounded-xl bg-neutral-100 object-cover sm:h-28 sm:w-28"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-3">
                      <p className="font-medium text-neutral-900">
                        {cartLineName(line, lang)}
                      </p>
                      <p className="flex-none text-sm tabular-nums text-neutral-700">
                        {formatPrice(line.unitPrice * line.quantity)}
                      </p>
                    </div>
                    {line.selections.length > 0 && (
                      <ul className="mt-1 space-y-0.5 text-xs text-neutral-500">
                        {line.selections.map((s) => (
                          <li key={s.groupLabel}>
                            {translateGroupLabel(s.groupLabel, lang)}:{" "}
                            {s.choiceLabels
                              .map((c) =>
                                translateChoiceLabel(c, s.groupLabel, lang),
                              )
                              .join(", ")}
                          </li>
                        ))}
                      </ul>
                    )}
                    {line.specialRequest && (
                      <p className="mt-1 text-xs italic text-neutral-500">
                        {t("notePrefix")}: {line.specialRequest}
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
                    ? t("pairOneBowl")
                    : t("pairManyBowls").replace(
                        "{n}",
                        String(pairings.length),
                      )}
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
                      {t(pairingReason(p, cart, menu))}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-neutral-500">
                      {localDescription(p, lang)}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        addToCart({
                          itemName: p.name,
                          itemNameZh: p.nameZh,
                          itemNames: itemNamesForLocales(p),
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
                <span className="text-sm text-neutral-600">{t("taxLabel")}</span>
                <span className="text-sm text-neutral-900">{formatPrice(Math.round(total * 9.25) / 100)}</span>
              </div>
              <div className="mb-3 flex items-baseline justify-between border-t border-neutral-200 pt-2">
                <span className="text-sm font-semibold text-neutral-900">{t("total")}</span>
                <span className="text-lg font-medium text-neutral-900">{formatPrice(Math.round(total * 109.25) / 100)}</span>
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
                      setOrderError(t("orderSendError"));
                      return;
                    }
                    clearCart();
                    onClose();
                    window.location.href = `/order/${order.id}`;
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
                    return cartLineName(line, lang);
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
