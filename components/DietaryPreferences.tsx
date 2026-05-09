"use client";

import { useEffect, useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { DEFAULT_OPTIONS } from "@/lib/preferences";
import {
  getStoredPreferences,
  setStoredPreferences,
} from "@/lib/preferences-store";
import ChatWidget from "./ChatWidget";

export type DietaryPreferencesProps = {
  brand?: string;
  options?: string[];
  initialSelected?: string[];
  onConfirm?: (selected: string[]) => void;
};

export default function DietaryPreferences({
  brand = "our restaurant",
  options = DEFAULT_OPTIONS,
  initialSelected,
  onConfirm,
}: DietaryPreferencesProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(initialSelected ?? []),
  );

  useEffect(() => {
    if (initialSelected !== undefined) return;
    const stored = getStoredPreferences();
    if (stored.length > 0) setSelected(new Set(stored));
  }, [initialSelected]);

  function togglePreference(pref: string, event: MouseEvent<HTMLButtonElement>) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(pref)) next.delete(pref);
      else next.add(pref);
      return next;
    });
    event.currentTarget.blur();
  }

  function handleConfirm() {
    const arr = Array.from(selected);
    setStoredPreferences(arr);
    onConfirm?.(arr);
    router.push("/menu");
  }

  return (
    <>
      <main className="flex min-h-screen w-full justify-center bg-cream">
        <div className="flex w-full max-w-[420px] flex-col px-6 py-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/shake-shake-logo.png"
            alt="Shake Shake Fresh Noodle"
            className="mx-auto mb-6 h-40 w-auto sm:h-48"
          />

          <header className="mb-6">
            <h1 className="font-serif text-4xl tracking-tight text-neutral-900">
              Dietary Preferences
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-neutral-600">
              Select the items you can&apos;t or don&apos;t want to eat. Items
              that contain significant amounts of these properties will be
              flagged.
            </p>
          </header>

          <section
            aria-label="Dietary preference options"
            className="grid grid-cols-2 gap-3"
          >
            {options.map((opt) => {
              const isSelected = selected.has(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={(e) => togglePreference(opt, e)}
                  className={[
                    "rounded-2xl py-5 text-lg text-neutral-900",
                    "transition-all duration-150 ease-out",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-700/30",
                    "hover:ring-2 hover:ring-neutral-900/40 hover:shadow-md",
                    isSelected
                      ? "bg-cantaloupe text-neutral-900 shadow-inner ring-1 ring-inset ring-neutral-900/15"
                      : "bg-sage",
                  ].join(" ")}
                >
                  {opt}
                </button>
              );
            })}
          </section>

          <section className="mt-8 space-y-3">
            <p className="text-xs leading-relaxed text-neutral-500">
              * At {brand} we use all major allergens in our kitchens, so we
              cannot guarantee that our food is completely free of any
              allergen. If you have a severe allergy, we recommend not
              ordering from our restaurant.
            </p>
            <p className="text-xs leading-relaxed text-neutral-500">
              Please note that your online dietary preferences are not
              communicated to our in-store teams.
            </p>
          </section>

          <div className="mt-8 px-2">
            <button
              type="button"
              onClick={handleConfirm}
              className={[
                "w-full rounded-full border border-neutral-400 bg-transparent",
                "py-3 text-sm text-neutral-900",
                "transition-colors duration-150 ease-out",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-700/30",
                "hover:bg-neutral-900/5",
              ].join(" ")}
            >
              Confirm preferences
            </button>
          </div>
        </div>
      </main>
      <ChatWidget />
    </>
  );
}
