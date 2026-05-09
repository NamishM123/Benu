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

  return (
    <>
      <main className="min-h-screen w-full bg-cream pb-28">
        <div className="mx-auto w-full max-w-6xl">
          <div className="flex items-center justify-between px-6 pt-6 sm:px-10">
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

          <nav
            aria-label="Menu categories"
            className="sticky top-0 z-20 mt-6 bg-cream/90 px-6 py-6 backdrop-blur sm:px-10"
          >
            <div className="flex flex-wrap items-end justify-center gap-x-10 gap-y-3 sm:gap-x-14">
              {categories.map((cat) => {
                const isActive = cat === activeCategory;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    aria-pressed={isActive}
                    className="group flex flex-col items-center"
                  >
                    <span
                      className={[
                        "font-serif text-2xl tracking-tight transition-colors duration-150 sm:text-3xl",
                        isActive
                          ? "text-neutral-900"
                          : "text-neutral-400 hover:text-neutral-600",
                      ].join(" ")}
                    >
                      {cat}
                    </span>
                    <span
                      className={[
                        "mt-1.5 h-1.5 w-1.5 rounded-full transition-colors duration-150",
                        isActive ? "bg-neutral-900" : "bg-transparent",
                      ].join(" ")}
                      aria-hidden="true"
                    />
                  </button>
                );
              })}
            </div>
          </nav>

          <section className="grid grid-cols-1 gap-x-8 gap-y-12 px-6 pt-4 sm:grid-cols-2 sm:px-10 lg:grid-cols-3">
            {visibleItems.map((d) => {
              const flags = findFlaggedPreferences(d, preferences);
              const isSpicy = d.spiceLevel >= 2;
              return (
                <article key={d.name} className="flex flex-col">
                  <div className="relative overflow-hidden rounded-[28px] bg-white shadow-sm">
                    <div className="relative aspect-square w-full bg-neutral-100">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={d.image}
                        alt={d.name}
                        className="h-full w-full object-cover"
                      />
                      {isSpicy && (
                        <span className="absolute left-4 top-4 rounded-full bg-lime-300 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-900">
                          {d.spiceLevel === 3 ? "Very Spicy" : "Spicy"}
                        </span>
                      )}
                      {flags.length > 0 && (
                        <span
                          title={`contains ${flags.join(", ").toLowerCase()}`}
                          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full border border-neutral-300 bg-white text-[11px] font-semibold text-neutral-700"
                        >
                          {flags[0][0]}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 px-1">
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
                    {(flags.length > 0 || d.spiceLevel >= 1) && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {d.spiceLevel >= 1 && (
                          <span className="text-[11px] uppercase tracking-wider text-rose-700">
                            {spiceLabel(d.spiceLevel)}
                          </span>
                        )}
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
