"use client";

import Link from "next/link";
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
  addToCart,
  cartCount,
  getCart,
  type CartLine,
} from "@/lib/cart-store";
import ChatWidget from "./ChatWidget";
import ItemDetailSheet from "./ItemDetailSheet";
import CartDrawer from "./CartDrawer";
import FilterSheet from "./FilterSheet";
import LanguageSwitcher from "./LanguageSwitcher";
import MobileHeaderControl from "./MobileHeaderControl";
import SpiceChilis from "./SpiceChilis";
import { useTranslation } from "@/lib/i18n";
import { useAutoTranslate } from "@/lib/auto-translate";
import { getOptionGroupsForItem } from "@/lib/menu-options";

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
          <div className="flex items-center justify-between gap-2 pl-3 pr-10 pt-4 sm:gap-3 sm:px-10 sm:pt-3">
            <button
              type="button"
              onClick={() => {
                setActiveCategory(CATEGORY_ORDER[0]);
                if (typeof window !== "undefined") {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }
              }}
              aria-label={t("backToStart")}
              className="flex-none cursor-default rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-700/30"
            >
              {/* PNG has ~43% transparent whitespace below the artwork; clip it. */}
              <div className="block overflow-hidden h-[60px] sm:h-[101px] flex-none">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/shake-shake-logo.png"
                  alt="Shake Shake Fresh Noodle"
                  width={1536}
                  height={831}
                  fetchPriority="high"
                  decoding="sync"
                  loading="eager"
                  className="block h-[105px] w-auto max-w-none sm:h-[187px] -mt-0.5 sm:-mt-2 flex-none"
                />
              </div>
            </button>
            <div className="flex items-center justify-end gap-2">
              {/* Mobile: rotating swipe control (filters ↔ language) */}
              <div className="sm:hidden">
                <MobileHeaderControl
                  onFiltersOpen={() => setFiltersOpen(true)}
                  preferencesCount={preferences.length}
                />
              </div>

              {/* Desktop: language switcher + filters as separate buttons */}
              <div className="hidden sm:block">
                <LanguageSwitcher />
              </div>
              <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              aria-label={t("filters")}
              className={[
                "hidden sm:inline-flex h-10 w-[7rem] items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 text-base font-medium shadow-sm transition-colors",
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
                className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-800 shadow-sm transition-colors hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-700/30"
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
            className="sticky top-0 z-20 bg-cream"
          >
            <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div
                className={[
                  "flex w-max min-w-full items-center justify-start px-6 py-3 sm:justify-center sm:px-10",
                  lang === "zh" ? "gap-5 sm:gap-6" : "gap-2",
                ].join(" ")}
              >
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

          <section className="grid grid-cols-1 gap-x-8 gap-y-6 px-6 pt-2 sm:grid-cols-2 sm:px-10 lg:grid-cols-3">
            {visibleItems.map((d) => {
              const flags = findFlaggedPreferences(d, preferences);
              const isRestricted = flags.length > 0;
              const isSoldOut = d.available === false;
              const hasRequiredOptions = getOptionGroupsForItem(d).some(
                (g) => g.type === "single" && g.required,
              );
              return (
                <button
                  key={d.name}
                  type="button"
                  onClick={() => {
                    if (!isRestricted && !isSoldOut) setActiveItem(d);
                  }}
                  disabled={isRestricted || isSoldOut}
                  aria-disabled={isRestricted || isSoldOut}
                  title={
                    isRestricted
                      ? `${t("hiddenByFilter")} ${flags.map((f) => t(f)).join(", ")}`
                      : undefined
                  }
                  className={[
                    "group flex flex-col text-left rounded-[28px] outline-none transition-all duration-150",
                    isRestricted || isSoldOut
                      ? "cursor-not-allowed"
                      : "hover:-translate-y-0.5",
                  ].join(" ")}
                >
                  <div
                    className={[
                      "relative overflow-hidden rounded-[28px] bg-white shadow-sm ring-4 ring-transparent transition-all duration-150",
                      isRestricted || isSoldOut
                        ? "opacity-50 grayscale"
                        : "group-hover:bg-butter-soft group-hover:shadow-lg group-hover:ring-butter group-focus-visible:ring-butter",
                    ].join(" ")}
                  >
                    <div className="relative aspect-square w-full bg-gradient-to-br from-cream-light to-neutral-200/60">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={d.image}
                        alt={d.name}
                        loading="eager"
                        decoding="async"
                        ref={(img) => {
                          if (!img) return;
                          // Image already finished loading (cached) before React attached onLoad.
                          // Schedule the reveal in the next frame so the browser commits the
                          // opacity-0 / blur initial state first and the transition actually plays.
                          if (img.complete && img.naturalWidth > 0) {
                            loadedImages.add(d.image);
                            requestAnimationFrame(() => {
                              img.style.opacity = "1";
                              img.style.filter = "blur(0px)";
                            });
                          }
                        }}
                        style={{ filter: "blur(8px)" }}
                        className="menu-img h-full w-full object-cover opacity-0 transition-[opacity,filter] duration-500 ease-out"
                        onLoad={(e) => {
                          loadedImages.add(d.image);
                          const img = e.currentTarget;
                          requestAnimationFrame(() => {
                            img.style.opacity = "1";
                            img.style.filter = "blur(0px)";
                          });
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
                      {isSoldOut && (
                        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-900/75 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
                          Sold out
                        </span>
                      )}
                      {flags.length > 0 && (
                        <span className="absolute right-4 top-4 rounded-full bg-amber-50/95 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-amber-800">
                          {t("filteredBadge")}
                        </span>
                      )}
                      {!isRestricted && !isSoldOut && !hasRequiredOptions && (
                        <button
                          type="button"
                          aria-label={`Add ${d.name} to cart`}
                          onClick={(e) => {
                            e.stopPropagation();
                            addToCart({
                              itemName: d.name,
                              itemNameZh: d.nameZh,
                              basePrice: d.price,
                              quantity: 1,
                              unitPrice: d.price,
                              selections: [],
                              image: d.image,
                            });
                          }}
                          className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900/80 text-xl text-white backdrop-blur-sm transition-transform hover:scale-110 active:scale-95"
                        >
                          +
                        </button>
                      )}
                    </div>
                  </div>

                  <div
                    className={[
                      "mt-3 px-1 transition-opacity",
                      isRestricted || isSoldOut ? "opacity-50" : "",
                    ].join(" ")}
                  >
                    <h3
                      className={[
                        "min-h-[1.5em] font-semibold uppercase text-neutral-900",
                        lang === "zh"
                          ? "text-xl tracking-normal"
                          : "text-xl tracking-[0.08em]",
                      ].join(" ")}
                    >
                      {localName(d, lang, autoMap)}
                      <SpiceChilis level={d.spiceLevel} size={22} />
                    </h3>
                    <p className="mt-1 text-base text-neutral-700">
                      {formatPrice(d.price)}
                    </p>
                    <p className="mt-2 min-h-[4.875em] text-base leading-relaxed text-neutral-500">
                      {localDescription(d, lang, autoMap)}
                    </p>
                    {flags.length > 0 && (
                      <p className="mt-2 text-[11px] uppercase tracking-wider text-amber-700">
                        {t("headsUp")}{" "}
                        {flags.map((f) => t(f).toLowerCase()).join(", ")}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </section>

          <footer className="mt-16 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 px-6 pb-6 sm:px-10">
            <Link
              href="/orders"
              className="text-xs text-neutral-500 underline-offset-4 hover:text-neutral-800 hover:underline"
            >
              {t("viewMyOrders")}
            </Link>
          </footer>
        </div>
      </main>

      <button
        type="button"
        onClick={() => setCartOpen(true)}
        className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 inline-flex h-14 items-center gap-2 whitespace-nowrap rounded-full bg-neutral-900 px-7 text-base font-semibold text-cream shadow-lg transition-transform hover:scale-105 sm:hidden"
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
        <span>
          {totalCount > 0
            ? (totalCount === 1 ? t("viewCartCountOne") : t("viewCartCount")).replace("{n}", String(totalCount))
            : t("yourCart")}
        </span>
      </button>

      <ItemDetailSheet
        item={activeItem}
        preferences={preferences}
        onClose={() => setActiveItem(null)}
        onCartOpen={() => { setActiveItem(null); setCartOpen(true); }}
      />
      <CartDrawer
        open={cartOpen}
        cart={cart}
        preferences={preferences}
        menu={menu}
        onClose={() => setCartOpen(false)}
      />
      <FilterSheet
        open={filtersOpen}
        preferences={preferences}
        onClose={() => setFiltersOpen(false)}
      />
      <ChatWidget
        hidden={cartOpen || activeItem !== null || filtersOpen}
        onSelectDish={(name) => {
          const found = menu.find((m) => m.name === name);
          if (found) setActiveItem(found);
        }}
      />
    </>
  );
}
