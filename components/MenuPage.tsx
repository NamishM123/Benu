"use client";

import { useEffect, useMemo, useState } from "react";
import { formatPrice, type MenuItem } from "@/lib/menu";
import { findFlaggedPreferences } from "@/lib/preferences";
import { getStoredPreferences } from "@/lib/preferences-store";
import {
  CART_EVENT,
  cartCount,
  getCart,
  type CartLine,
} from "@/lib/cart-store";
import ChatWidget from "./ChatWidget";
import ItemDetailSheet from "./ItemDetailSheet";
import CartDrawer from "./CartDrawer";
import FilterSheet from "./FilterSheet";

const CATEGORY_ORDER = [
  "Appetizers",
  "Dry Noodles",
  "Noodle Soup",
  "Rice",
  "Beverages",
];

type Props = {
  menu: MenuItem[];
};

export default function MenuPage({ menu }: Props) {
  const [preferences, setPreferences] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>(
    CATEGORY_ORDER[0],
  );
  const [activeItem, setActiveItem] = useState<MenuItem | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    setPreferences(getStoredPreferences());
    setCart(getCart());

    function onPrefs(e: Event) {
      const detail = (e as CustomEvent<string[]>).detail;
      if (Array.isArray(detail)) setPreferences(detail);
    }
    function onCart(e: Event) {
      const detail = (e as CustomEvent<CartLine[]>).detail;
      if (Array.isArray(detail)) setCart(detail);
    }
    window.addEventListener("benu:preferences-changed", onPrefs);
    window.addEventListener(CART_EVENT, onCart);
    return () => {
      window.removeEventListener("benu:preferences-changed", onPrefs);
      window.removeEventListener(CART_EVENT, onCart);
    };
  }, []);

  const categories = useMemo(() => {
    const present = new Set(menu.map((m) => m.category));
    return CATEGORY_ORDER.filter((c) => present.has(c));
  }, [menu]);

  const visibleItems = useMemo(
    () => menu.filter((m) => m.category === activeCategory),
    [menu, activeCategory],
  );

  const totalCount = cartCount(cart);

  return (
    <>
      <main className="min-h-screen w-full bg-cream pb-28">
        <div className="mx-auto w-full max-w-6xl">
          <div className="flex items-center justify-between gap-3 px-6 pt-3 sm:px-10">
            <button
              type="button"
              onClick={() => {
                setActiveCategory(CATEGORY_ORDER[0]);
                if (typeof window !== "undefined") {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
              aria-label="Back to start of menu"
              className="cursor-default rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-700/30"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/shake-shake-logo.png"
                alt="Shake Shake Fresh Noodle"
                className="h-32 w-auto sm:h-40"
              />
            </button>
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              aria-label="Open dietary filters"
              className={[
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-base font-medium transition-colors",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-700/30",
                preferences.length > 0
                  ? "bg-cantaloupe text-neutral-900 hover:bg-cantaloupe-soft"
                  : "border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-100",
              ].join(" ")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="7" y1="12" x2="17" y2="12" />
                <line x1="10" y1="18" x2="14" y2="18" />
              </svg>
              <span>
                Filters
                {preferences.length > 0 ? ` · ${preferences.length}` : ""}
              </span>
            </button>
          </div>
          {preferences.length > 0 && (
            <div className="px-6 pt-2 sm:px-10">
              <p className="text-xs text-neutral-600">
                Flagging items containing: {preferences.join(", ")}
              </p>
            </div>
          )}

          <nav
            aria-label="Menu categories"
            className="sticky top-0 z-20 -mt-5 bg-cream/95 backdrop-blur"
          >
            <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex w-max min-w-full items-center justify-start gap-2 px-6 py-0 sm:justify-center sm:px-10">
                {categories.map((cat) => {
                  const isActive = cat === activeCategory;
                  return (
                    <button
                      key={cat}
                      ref={(el) => {
                        if (isActive && el) {
                          el.scrollIntoView({
                            behavior: "smooth",
                            inline: "center",
                            block: "nearest",
                          });
                        }
                      }}
                      type="button"
                      onClick={() => setActiveCategory(cat)}
                      aria-pressed={isActive}
                      className={[
                        "flex-none whitespace-nowrap rounded-full px-4 py-2 text-base font-medium transition-colors duration-150",
                        isActive
                          ? "bg-cantaloupe text-neutral-900"
                          : "text-neutral-600 hover:text-neutral-900",
                      ].join(" ")}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>
          </nav>

          <section className="grid grid-cols-1 gap-x-8 gap-y-12 px-6 pt-4 sm:grid-cols-2 sm:px-10 lg:grid-cols-3">
            {visibleItems.map((d) => {
              const flags = findFlaggedPreferences(d, preferences);
              const isRestricted = flags.length > 0;
              return (
                <button
                  key={d.name}
                  type="button"
                  onClick={() => {
                    if (!isRestricted) setActiveItem(d);
                  }}
                  disabled={isRestricted}
                  aria-disabled={isRestricted}
                  title={
                    isRestricted
                      ? `Hidden by your filter: contains ${flags.join(", ").toLowerCase()}`
                      : undefined
                  }
                  className={[
                    "group flex flex-col text-left rounded-[28px] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-700/30",
                    isRestricted
                      ? "cursor-not-allowed"
                      : "hover:-translate-y-0.5",
                  ].join(" ")}
                >
                  <div
                    className={[
                      "relative overflow-hidden rounded-[28px] bg-white shadow-sm ring-4 ring-transparent transition-all duration-150",
                      isRestricted
                        ? "opacity-50 grayscale"
                        : "group-hover:bg-butter-soft group-hover:shadow-lg group-hover:ring-butter",
                    ].join(" ")}
                  >
                    <div className="relative aspect-square w-full bg-neutral-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={d.image}
                        alt={d.name}
                        className="h-full w-full object-cover"
                      />
                      {d.spiceLevel >= 1 && (
                        <span
                          className={[
                            "absolute left-4 top-4 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider",
                            d.spiceLevel === 1
                              ? "bg-yellow-200 text-neutral-900"
                              : d.spiceLevel === 2
                              ? "bg-orange-400 text-neutral-900"
                              : "bg-rose-600 text-white",
                          ].join(" ")}
                        >
                          {d.spiceLevel === 1
                            ? "Mildly Spicy"
                            : d.spiceLevel === 2
                            ? "Spicy"
                            : "Very Spicy"}
                        </span>
                      )}
                      {flags.length > 0 && (
                        <span className="absolute right-4 top-4 rounded-full bg-amber-50/95 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber-800">
                          Filtered
                        </span>
                      )}
                    </div>
                  </div>

                  <div
                    className={[
                      "mt-5 px-1 transition-opacity",
                      isRestricted ? "opacity-50" : "",
                    ].join(" ")}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="text-base font-semibold uppercase tracking-[0.08em] text-neutral-900">
                        {d.name}
                      </h3>
                      <p className="flex-none text-sm text-neutral-700">
                        {formatPrice(d.price)}
                      </p>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                      {d.description}
                    </p>
                    {flags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {flags.map((f) => (
                          <span
                            key={f}
                            className="text-[11px] uppercase tracking-wider text-amber-700"
                          >
                            contains {f.toLowerCase()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </section>
        </div>
      </main>

      {totalCount > 0 && (
        <button
          type="button"
          onClick={() => setCartOpen(true)}
          className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-cream shadow-lg transition-transform hover:scale-105"
        >
          View cart · {totalCount} {totalCount === 1 ? "item" : "items"}
        </button>
      )}

      <ItemDetailSheet
        item={activeItem}
        preferences={preferences}
        onClose={() => setActiveItem(null)}
      />
      <CartDrawer
        open={cartOpen}
        cart={cart}
        preferences={preferences}
        onClose={() => setCartOpen(false)}
      />
      <FilterSheet
        open={filtersOpen}
        preferences={preferences}
        onClose={() => setFiltersOpen(false)}
      />
      <ChatWidget
        hidden={cartOpen || activeItem !== null || filtersOpen}
      />
    </>
  );
}
