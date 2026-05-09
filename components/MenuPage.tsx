"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { formatPrice, spiceLabel, type MenuItem } from "@/lib/menu";
import { findFlaggedPreferences } from "@/lib/preferences";
import { getStoredPreferences } from "@/lib/preferences-store";
import ChatWidget from "./ChatWidget";

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

  useEffect(() => {
    setPreferences(getStoredPreferences());
    function onChange(e: Event) {
      const detail = (e as CustomEvent<string[]>).detail;
      if (Array.isArray(detail)) setPreferences(detail);
    }
    window.addEventListener("benu:preferences-changed", onChange);
    return () =>
      window.removeEventListener("benu:preferences-changed", onChange);
  }, []);

  const categories = useMemo(() => {
    const present = new Set(menu.map((m) => m.category));
    return CATEGORY_ORDER.filter((c) => present.has(c));
  }, [menu]);

  const visibleItems = useMemo(
    () => menu.filter((m) => m.category === activeCategory),
    [menu, activeCategory],
  );

  const featured = useMemo(() => {
    const featuredNames = [
      "House Special Beef Bone Noodle Soup",
      "Chili Oil Wontons",
      "Braised Pork Belly Noodle",
    ];
    return featuredNames
      .map((n) => menu.find((m) => m.name === n))
      .filter((m): m is MenuItem => Boolean(m));
  }, [menu]);

  return (
    <>
      <main className="min-h-screen w-full bg-cream pb-28">
        <div className="mx-auto w-full max-w-[560px]">
          <div className="sticky top-0 z-30 bg-cream/90 px-6 pt-6 pb-4 backdrop-blur">
            <div className="flex items-center justify-between">
              <Link
                href="/dietary-preferences"
                className="text-sm text-neutral-600 hover:text-neutral-900"
              >
                ← Preferences
              </Link>
              {preferences.length > 0 && (
                <span className="rounded-full bg-sage px-3 py-1 text-xs text-neutral-800">
                  Avoiding: {preferences.join(", ")}
                </span>
              )}
            </div>
            <h1 className="mt-3 font-serif text-4xl tracking-tight text-neutral-900">
              Menu
            </h1>
          </div>

          {featured.length > 0 && (
            <section className="px-6 pt-3">
              <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-neutral-500">
                Featured
              </h2>
              <div className="-mx-6 flex gap-4 overflow-x-auto px-6 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {featured.map((d) => {
                  const flags = findFlaggedPreferences(d, preferences);
                  return (
                    <article
                      key={d.name}
                      className="relative w-[300px] flex-none overflow-hidden rounded-3xl bg-white shadow-sm"
                    >
                      <div className="relative aspect-[4/3] w-full bg-neutral-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={d.image}
                          alt={d.name}
                          className="h-full w-full object-cover"
                        />
                        {flags.length > 0 && (
                          <span className="absolute left-3 top-3 rounded-full bg-amber-50/95 px-2.5 py-1 text-[11px] text-amber-800">
                            contains {flags[0].toLowerCase()}
                          </span>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="truncate font-medium text-neutral-900">
                            {d.name}
                          </p>
                          <p className="text-sm text-neutral-700">
                            {formatPrice(d.price)}
                          </p>
                        </div>
                        <p className="mt-1 line-clamp-2 text-xs leading-snug text-neutral-500">
                          {d.description}
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          <nav
            aria-label="Menu categories"
            className="sticky top-[100px] z-20 mt-3 bg-cream/90 px-6 py-3 backdrop-blur"
          >
            <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {categories.map((cat) => {
                const isActive = cat === activeCategory;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    aria-pressed={isActive}
                    className={[
                      "flex-none rounded-full px-4 py-2 text-sm transition-colors duration-150 ease-out",
                      isActive
                        ? "bg-neutral-900 text-neutral-50"
                        : "bg-white text-neutral-700 hover:bg-neutral-100",
                    ].join(" ")}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </nav>

          <section className="flex flex-col gap-5 px-6 pt-5">
            {visibleItems.map((d) => {
              const flags = findFlaggedPreferences(d, preferences);
              return (
                <article
                  key={d.name}
                  className="group overflow-hidden rounded-3xl bg-white shadow-sm"
                >
                  <div className="relative aspect-[4/3] w-full bg-neutral-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={d.image}
                      alt={d.name}
                      className="h-full w-full object-cover"
                    />
                    {d.spiceLevel >= 2 && (
                      <span className="absolute left-3 top-3 rounded-full bg-rose-50/95 px-2.5 py-1 text-[11px] text-rose-700">
                        {spiceLabel(d.spiceLevel)}
                      </span>
                    )}
                    {flags.length > 0 && (
                      <span className="absolute right-3 top-3 rounded-full bg-amber-50/95 px-2.5 py-1 text-[11px] text-amber-800">
                        contains {flags[0].toLowerCase()}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-base font-medium text-neutral-900">
                        {d.name}
                      </p>
                      <p className="flex-none text-sm text-neutral-700">
                        {formatPrice(d.price)}
                      </p>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-neutral-500">
                      {d.description}
                    </p>
                  </div>
                </article>
              );
            })}
          </section>
        </div>
      </main>
      <ChatWidget />
    </>
  );
}
