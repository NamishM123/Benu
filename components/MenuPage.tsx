"use client";

import { useEffect, useMemo, useState } from "react";
import {
  formatPrice,
  localDescription,
  localName,
  type MenuItem,
} from "@/lib/menu";
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
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslation } from "@/lib/i18n";
import { useAutoTranslate } from "@/lib/auto-translate";

const CATEGORY_ORDER = [
  "Appetizers",
  "Dry Noodles",
  "Noodle Soup",
  "Rice",
  "Beverages",
];

// Module-level cache of image URLs that have successfully loaded at least once.
// We use this to skip the fade-in when switching categories so cached images
// appear instantly instead of going opacity-0 -> opacity-1 every remount.
const loadedImages = new Set<string>();

type Props = {
  menu: MenuItem[];
};

export default function MenuPage({ menu }: Props) {
  const { t, lang } = useTranslation();
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

  // Preload every menu image once at mount so switching categories never has
  // to wait on the network — the browser cache + loadedImages Set will both
  // be primed.
  useEffect(() => {
    menu.forEach((m) => {
      if (loadedImages.has(m.image)) return;
      const img = new window.Image();
      img.onload = () => loadedImages.add(m.image);
      img.src = m.image;
    });
  }, [menu]);

  const categories = useMemo(() => {
    const present = new Set(menu.map((m) => m.category));
    return CATEGORY_ORDER.filter((c) => present.has(c));
  }, [menu]);

  const visibleItems = useMemo(
    () => menu.filter((m) => m.category === activeCategory),
    [menu, activeCategory],
  );

  // Collect English strings missing a manual nameZh/descriptionZh so the
  // auto-translate API can fill them in lazily.
  const stringsToAutoTranslate = useMemo(() => {
    const list: string[] = [];
    for (const m of menu) {
      if (!m.nameZh) list.push(m.name);
      if (!m.descriptionZh) list.push(m.description);
    }
    return list;
  }, [menu]);
  const autoMap = useAutoTranslate(stringsToAutoTranslate, lang);

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
              aria-label={t("backToStart")}
              className="cursor-default rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-700/30"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/shake-shake-logo.png"
                alt="Shake Shake Fresh Noodle"
                fetchPriority="high"
                decoding="sync"
                loading="eager"
                className="h-32 w-auto sm:h-40"
              />
            </button>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              aria-label={t("filters")}
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
                {t("filters")}
                {preferences.length > 0 ? ` · ${preferences.length}` : ""}
              </span>
            </button>
              <button
                type="button"
                onClick={() => setCartOpen(true)}
                aria-label={t("yourCart")}
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-800 transition-colors hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-700/30"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                {totalCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-cantaloupe px-1 text-[11px] font-semibold text-neutral-900">
                    {totalCount}
                  </span>
                )}
              </button>
            </div>
          </div>
          {preferences.length > 0 && (
            <div className="px-6 pt-2 sm:px-10">
              <p className="text-xs text-neutral-600">
                {t("flaggingItems")}: {preferences.map((p) => t(p)).join(", ")}
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
                      {t(`cat_${cat}`)}
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
                    "group flex flex-col text-left rounded-[28px] outline-none transition-all duration-150",
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
                        : "group-hover:bg-butter-soft group-hover:shadow-lg group-hover:ring-butter group-focus-visible:ring-butter",
                    ].join(" ")}
                  >
                    <div className="relative aspect-square w-full bg-gradient-to-br from-cream-light to-neutral-200/60">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {(() => {
                        const wasLoaded = loadedImages.has(d.image);
                        return (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={d.image}
                            alt={d.name}
                            loading="eager"
                            decoding="async"
                            ref={(img) => {
                              if (img && img.complete && img.naturalWidth > 0) {
                                loadedImages.add(d.image);
                                img.style.opacity = "1";
                                img.style.filter = "blur(0px)";
                              }
                            }}
                            style={{
                              filter: wasLoaded ? "blur(0px)" : "blur(8px)",
                              opacity: wasLoaded ? 1 : 0,
                            }}
                            className="menu-img h-full w-full object-cover transition-[opacity,filter] duration-500 ease-out"
                            onLoad={(e) => {
                              loadedImages.add(d.image);
                              e.currentTarget.style.opacity = "1";
                              e.currentTarget.style.filter = "blur(0px)";
                            }}
                            onError={(e) => {
                              const img = e.currentTarget;
                              if (img.dataset.fallback) return;
                              img.dataset.fallback = "1";
                              img.src =
                                "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23FBF7EE'%2F%3E%3Cg transform='translate(100 110)' stroke='%23B8A88E' stroke-width='4' fill='none' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M-50 -10 a50 50 0 0 0 100 0 z' fill='%23E5D8C3'%2F%3E%3Cline x1='-30' y1='-25' x2='-15' y2='-40'%2F%3E%3Cline x1='-10' y1='-30' x2='5' y2='-50'%2F%3E%3Cline x1='15' y1='-25' x2='30' y2='-45'%2F%3E%3C%2Fg%3E%3C%2Fsvg%3E";
                              img.style.opacity = "1";
                              img.style.filter = "blur(0px)";
                            }}
                          />
                        );
                      })()}
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
                            ? t("mildlySpicy")
                            : d.spiceLevel === 2
                            ? t("spicy")
                            : t("verySpicy")}
                        </span>
                      )}
                      {flags.length > 0 && (
                        <span className="absolute right-4 top-4 rounded-full bg-amber-50/95 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber-800">
                          {t("filteredBadge")}
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
                      <h3
                        className={[
                          "min-h-[1.5em] font-semibold uppercase text-neutral-900",
                          lang === "zh"
                            ? "text-base tracking-normal"
                            : "text-base tracking-[0.08em]",
                        ].join(" ")}
                      >
                        {localName(d, lang, autoMap)}
                      </h3>
                      <p className="flex-none text-sm text-neutral-700">
                        {formatPrice(d.price)}
                      </p>
                    </div>
                    <p className="mt-2 min-h-[4.875em] text-sm leading-relaxed text-neutral-500">
                      {localDescription(d, lang, autoMap)}
                    </p>
                    {flags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {flags.map((f) => (
                          <span
                            key={f}
                            className="text-[11px] uppercase tracking-wider text-amber-700"
                          >
                            {t("headsUp")} {t(f).toLowerCase()}
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
