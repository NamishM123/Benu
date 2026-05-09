"use client";

import { useMemo, useState } from "react";
import { DEFAULT_OPTIONS } from "@/lib/preferences";
import MenuAssistant from "./MenuAssistant";

export type DietaryPreferencesProps = {
  brand?: string;
  options?: string[];
  initialSelected?: string[];
  onConfirm?: (selected: string[]) => void;
};

export default function DietaryPreferences({
  brand = "our restaurant",
  options = DEFAULT_OPTIONS,
  initialSelected = [],
  onConfirm,
}: DietaryPreferencesProps) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(initialSelected),
  );

  const selectedArray = useMemo(() => Array.from(selected), [selected]);
  const isDisabled = selected.size === 0;

  function togglePreference(pref: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(pref)) next.delete(pref);
      else next.add(pref);
      return next;
    });
  }

  function handleConfirm() {
    if (isDisabled) return;
    const arr = Array.from(selected);
    console.log("Selected dietary preferences:", arr);
    onConfirm?.(arr);
  }

  return (
    <main className="flex min-h-screen w-full justify-center bg-cream">
      <div className="flex w-full max-w-[420px] flex-col px-6 py-8">
        <div
          className="mx-auto mb-8 h-1 w-10 rounded-full bg-neutral-400/60"
          aria-hidden="true"
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
                onClick={() => togglePreference(opt)}
                className={[
                  "rounded-2xl py-5 text-lg text-neutral-900",
                  "transition-colors duration-150 ease-out",
                  "focus:outline-none focus:ring-2 focus:ring-neutral-700/30",
                  isSelected
                    ? "bg-sage-dark shadow-inner ring-1 ring-inset ring-neutral-900/15"
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
            cannot guarantee that our food is completely free of any allergen.
            If you have a severe allergy, we recommend not ordering from our
            restaurant.
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
            disabled={isDisabled}
            aria-disabled={isDisabled}
            className={[
              "w-full rounded-full border border-neutral-400 bg-transparent",
              "py-3 text-sm text-neutral-900",
              "transition-colors duration-150 ease-out",
              "focus:outline-none focus:ring-2 focus:ring-neutral-700/30",
              isDisabled
                ? "cursor-not-allowed opacity-50"
                : "hover:bg-neutral-900/5",
            ].join(" ")}
          >
            Confirm preferences
          </button>
        </div>

        <MenuAssistant selectedPreferences={selectedArray} />
      </div>
    </main>
  );
}
