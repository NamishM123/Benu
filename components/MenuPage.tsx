"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MENU, formatPrice, spiceLabel, type MenuItem } from "@/lib/menu";
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

export default function MenuPage() {
  const [preferences, setPreferences] = useState<string[]>([]);

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

  const grouped = useMemo(() => {
    const map = new Map<string, MenuItem[]>();
    for (const item of MENU) {
      const arr = map.get(item.category) ?? [];
      arr.push(item);
      map.set(item.category, arr);
    }
    return CATEGORY_ORDER.filter((c) => map.has(c)).map((c) => ({
      category: c,
      items: map.get(c)!,
    }));
  }, []);

  return (
    <>
      <main className="flex min-h-screen w-full justify-center bg-cream">
        <div className="flex w-full max-w-[420px] flex-col px-6 py-8">
          <div className="mb-6 flex items-center justify-between">
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

          <header className="mb-6">
            <h1 className="font-serif text-4xl tracking-tight text-neutral-900">
              Menu
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-neutral-600">
              Tap the chat bubble for recommendations and ingredient
              questions.
            </p>
          </header>

          {grouped.map(({ category, items }) => (
            <section key={category} className="mt-6">
              <h2 className="font-serif text-2xl tracking-tight text-neutral-900">
                {category}
              </h2>
              <ul className="mt-3 flex flex-col gap-3">
                {items.map((d) => {
                  const flags = findFlaggedPreferences(d, preferences);
                  return (
                    <li
                      key={d.name}
                      className="flex gap-3 rounded-2xl border border-neutral-200 bg-white p-3"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={d.image}
                        alt={d.name}
                        className="h-20 w-20 flex-none rounded-xl bg-neutral-100 object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="truncate font-medium text-neutral-900">
                            {d.name}
                          </p>
                          <p className="text-sm text-neutral-700">
                            {formatPrice(d.price)}
                          </p>
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-xs text-neutral-500">
                          {d.description}
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {d.spiceLevel > 0 && (
                            <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] text-rose-700">
                              {spiceLabel(d.spiceLevel)}
                            </span>
                          )}
                          {flags.map((f) => (
                            <span
                              key={f}
                              className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] text-amber-800"
                            >
                              contains {f.toLowerCase()}
                            </span>
                          ))}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </main>
      <ChatWidget />
    </>
  );
}
