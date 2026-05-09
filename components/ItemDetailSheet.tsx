"use client";

import { useEffect, useMemo, useState } from "react";
import { formatPrice, type MenuItem } from "@/lib/menu";
import { getOptionGroupsForItem, type OptionGroup } from "@/lib/menu-options";
import { findFlaggedPreferences } from "@/lib/preferences";
import { addToCart } from "@/lib/cart-store";

type Props = {
  item: MenuItem | null;
  preferences: string[];
  onClose: () => void;
};

type Selections = Record<string, string[]>;

function initialSelections(groups: OptionGroup[]): Selections {
  const sel: Selections = {};
  groups.forEach((g) => {
    if (g.type === "single" && g.defaultChoiceId) {
      sel[g.id] = [g.defaultChoiceId];
    } else {
      sel[g.id] = [];
    }
  });
  return sel;
}

export default function ItemDetailSheet({ item, preferences, onClose }: Props) {
  const groups = useMemo(
    () => (item ? getOptionGroupsForItem(item) : []),
    [item],
  );
  const [selections, setSelections] = useState<Selections>(() =>
    initialSelections(groups),
  );
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const [fadeOpacity, setFadeOpacity] = useState(0);

  // Reset when a new item opens
  useEffect(() => {
    setSelections(initialSelections(groups));
    setQuantity(1);
    setJustAdded(false);
    setFadeOpacity(0);
  }, [item, groups]);

  // Lock body scroll while open
  useEffect(() => {
    if (!item) return;
    const orig = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = orig;
    };
  }, [item]);

  if (!item) return null;

  const flags = findFlaggedPreferences(item, preferences);

  const priceDelta = groups.reduce((sum, g) => {
    const picked = selections[g.id] ?? [];
    return (
      sum +
      g.choices
        .filter((c) => picked.includes(c.id))
        .reduce((s, c) => s + (c.priceModifier ?? 0), 0)
    );
  }, 0);
  const unitPrice = item.price + priceDelta;
  const totalPrice = unitPrice * quantity;

  const allRequiredMet = groups.every((g) => {
    if (g.type === "single" && g.required)
      return (selections[g.id] ?? []).length === 1;
    return true;
  });

  function toggleChoice(g: OptionGroup, choiceId: string) {
    setSelections((prev) => {
      const cur = prev[g.id] ?? [];
      let next: string[];
      if (g.type === "single") {
        next = [choiceId];
      } else {
        next = cur.includes(choiceId)
          ? cur.filter((id) => id !== choiceId)
          : [...cur, choiceId];
      }
      return { ...prev, [g.id]: next };
    });
  }

  function handleAdd() {
    if (!allRequiredMet) return;
    const lineSelections = groups
      .map((g) => {
        const picked = selections[g.id] ?? [];
        const choiceLabels = g.choices
          .filter((c) => picked.includes(c.id))
          .map((c) => c.label);
        return choiceLabels.length > 0
          ? { groupLabel: g.label, choiceLabels }
          : null;
      })
      .filter((x): x is { groupLabel: string; choiceLabels: string[] } =>
        Boolean(x),
      );

    addToCart({
      itemName: item!.name,
      basePrice: item!.price,
      quantity,
      unitPrice,
      selections: lineSelections,
    });
    setJustAdded(true);
    setTimeout(() => {
      onClose();
    }, 600);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/40 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={item.name}
        onClick={(e) => e.stopPropagation()}
        onScroll={(e) => {
          const top = e.currentTarget.scrollTop;
          // Ramp up opacity over the first ~80px of scroll
          const next = Math.min(1, top / 80);
          setFadeOpacity(next);
        }}
        className="relative w-full max-w-[480px] h-[100dvh] overflow-y-auto bg-cream shadow-xl sm:h-auto sm:max-h-[92vh] sm:rounded-3xl"
      >
        {/* Soft fade strip at top: image scrolls into this instead of being cut sharply */}
        <div
          aria-hidden="true"
          style={{ opacity: fadeOpacity }}
          className="pointer-events-none sticky top-0 z-10 -mb-12 h-12 bg-gradient-to-b from-cream via-cream/80 to-transparent transition-opacity duration-150 sm:rounded-t-3xl"
        />

        <div className="px-6 pt-6">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-neutral-100">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute top-4 left-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900/55 text-base leading-none text-white backdrop-blur-sm hover:bg-neutral-900/75 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            >
              ×
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.image}
              alt={item.name}
              className="h-full w-full object-cover"
            />
          </div>

          <div className="mt-5">
            <h2 className="font-serif text-3xl tracking-tight text-neutral-900">
              {item.name}
            </h2>
            <div className="mt-1 flex items-baseline gap-3 text-sm text-neutral-700">
              <span>{formatPrice(item.price)}</span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-neutral-700">
              {item.description}
            </p>
            {flags.length > 0 && (
              <p className="mt-3 text-sm text-amber-700">
                Heads up: this item contains {flags.join(", ").toLowerCase()},
                which is in your preferences.
              </p>
            )}
          </div>

          <div className="mt-6 space-y-6">
            {groups.map((g) => (
              <section key={g.id}>
                <div className="mb-2 flex items-baseline justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-700">
                    {g.label}
                  </h3>
                  {g.required && (
                    <span className="text-[10px] uppercase tracking-wider text-neutral-500">
                      Required
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {g.choices.map((c) => {
                    const picked = (selections[g.id] ?? []).includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={(e) => {
                          toggleChoice(g, c.id);
                          e.currentTarget.blur();
                        }}
                        className={[
                          "rounded-2xl border px-3 py-3 text-left text-sm transition-all",
                          "focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-700/30",
                          picked
                            ? "border-cantaloupe-deep bg-cantaloupe text-neutral-900 shadow-inner"
                            : "border-neutral-300 bg-white text-neutral-800 hover:border-neutral-500 hover:shadow-sm",
                        ].join(" ")}
                      >
                        <div className="flex items-center gap-2">
                          <span
                            aria-hidden="true"
                            className={[
                              "flex h-4 w-4 flex-none items-center justify-center rounded-full border",
                              picked
                                ? "border-neutral-900 bg-neutral-900 text-white"
                                : "border-neutral-400 bg-transparent",
                            ].join(" ")}
                          >
                            {picked && (
                              <span className="text-[10px] leading-none">
                                ✓
                              </span>
                            )}
                          </span>
                          <span className="font-medium">{c.label}</span>
                        </div>
                        <div className="mt-1 ml-6 flex flex-wrap items-center gap-x-2 text-xs text-neutral-500">
                          {c.priceModifier != null && c.priceModifier !== 0 && (
                            <span>
                              {c.priceModifier > 0 ? "+" : ""}
                              {formatPrice(c.priceModifier)}
                            </span>
                          )}
                          {c.warning && (
                            <span className="text-amber-700">
                              {c.warning} allergy
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}

            <section>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-neutral-700">
                Quantity
              </h3>
              <div className="inline-flex items-center gap-3 rounded-full border border-neutral-300 bg-white px-3 py-2">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-cantaloupe text-neutral-900 hover:bg-cantaloupe-soft"
                >
                  −
                </button>
                <span className="min-w-[1.5rem] text-center font-medium">
                  {quantity}
                </span>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-cantaloupe text-neutral-900 hover:bg-cantaloupe-soft"
                >
                  +
                </button>
              </div>
            </section>
          </div>

          <div className="sticky bottom-0 -mx-6 mt-8 bg-cream/95 px-6 py-5 backdrop-blur">
            <button
              type="button"
              onClick={handleAdd}
              disabled={!allRequiredMet}
              className={[
                "flex w-full items-center justify-between rounded-full px-6 py-4 text-base font-medium transition-colors",
                allRequiredMet
                  ? "bg-neutral-900 text-cream hover:bg-neutral-800"
                  : "bg-neutral-300 text-neutral-500",
              ].join(" ")}
            >
              <span>{justAdded ? "Added ✓" : "Add to cart"}</span>
              <span>{formatPrice(totalPrice)}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
