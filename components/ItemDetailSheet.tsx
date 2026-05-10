"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  formatPrice,
  localDescription,
  localName,
  type MenuItem,
} from "@/lib/menu";
import {
  getOptionGroupsForItem,
  itemSupportsSpecialRequest,
  type OptionGroup,
} from "@/lib/menu-options";
import { findFlaggedPreferences } from "@/lib/preferences";
import { addToCart } from "@/lib/cart-store";
import { useTranslation } from "@/lib/i18n";
import { useAutoTranslate } from "@/lib/auto-translate";

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
  const { t, lang } = useTranslation();
  const autoStrings = useMemo(
    () =>
      item
        ? [
            ...(item.nameZh ? [] : [item.name]),
            ...(item.descriptionZh ? [] : [item.description]),
          ]
        : [],
    [item],
  );
  const autoMap = useAutoTranslate(autoStrings, lang);
  const groups = useMemo(
    () => (item ? getOptionGroupsForItem(item) : []),
    [item],
  );
  const [selections, setSelections] = useState<Selections>(() =>
    initialSelections(groups),
  );
  const [quantity, setQuantity] = useState(1);
  const [specialRequest, setSpecialRequest] = useState("");
  const [justAdded, setJustAdded] = useState(false);
  const [fadeOpacity, setFadeOpacity] = useState(0);

  const supportsSpecialRequest = item ? itemSupportsSpecialRequest(item) : false;

  // Hold-to-repeat for quantity buttons
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
    step(); // immediate change on press
    // After 400ms hold, start repeating every 80ms
    holdTimeoutRef.current = setTimeout(() => {
      holdIntervalRef.current = setInterval(step, 80);
    }, 400);
  }

  // Always clear any active hold when popup unmounts
  useEffect(() => clearHold, []);

  // Reset when a new item opens
  useEffect(() => {
    setSelections(initialSelections(groups));
    setQuantity(1);
    setSpecialRequest("");
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

    const trimmedRequest = specialRequest.trim();
    addToCart({
      itemName: item!.name,
      itemNameZh: item!.nameZh,
      basePrice: item!.price,
      quantity,
      unitPrice,
      selections: lineSelections,
      image: item!.image,
      ...(supportsSpecialRequest && trimmedRequest
        ? { specialRequest: trimmedRequest }
        : {}),
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
        onTouchStart={(e) => {
          const el = e.currentTarget;
          // If at exact top, nudge down 1px to prevent iOS rubber-band overscroll up
          if (el.scrollTop <= 0) el.scrollTop = 1;
          // If at exact bottom, nudge up 1px to prevent rubber-band overscroll down
          const max = el.scrollHeight - el.clientHeight;
          if (el.scrollTop >= max) el.scrollTop = max - 1;
        }}
        className="popup-scroll relative w-full max-w-[480px] h-[100dvh] overflow-y-auto overscroll-none bg-cream-dark shadow-xl sm:h-auto sm:max-h-[92vh] sm:rounded-3xl"
        style={{ WebkitOverflowScrolling: "auto" }}
      >
        {/* Soft fade strip at top: image scrolls into this instead of being cut sharply */}
        <div
          aria-hidden="true"
          style={{
            opacity: fadeOpacity,
            background:
              "linear-gradient(to bottom, #F7EFDE 0%, rgba(247,239,222,0.95) 25%, rgba(247,239,222,0.75) 50%, rgba(247,239,222,0.4) 75%, rgba(247,239,222,0) 100%)",
          }}
          className="pointer-events-none sticky top-0 z-10 -mb-24 h-24 transition-opacity duration-150 sm:rounded-t-3xl"
        />

        {/* Hero: image as a rounded card on darker cream */}
        <div className="relative">
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            className="absolute top-4 left-4 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-neutral-900/60 text-white shadow-sm backdrop-blur-sm hover:bg-neutral-900/75 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
          <div className="relative z-10 px-6 pt-14 pb-6 sm:pt-12 sm:pb-2">
            <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-white shadow-md sm:aspect-[4/3]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.image}
                alt={item.name}
                decoding="async"
                fetchPriority="high"
                ref={(img) => {
                  if (img && img.complete && img.naturalWidth > 0) {
                    img.style.opacity = "1";
                    img.style.filter = "blur(0px)";
                  }
                }}
                style={{ filter: "blur(8px)" }}
                className="h-full w-full object-cover opacity-0 transition-[opacity,filter] duration-500 ease-out"
                onLoad={(e) => {
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
            </div>
          </div>
        </div>

        {/* Lighter content card with a wide arc top edge — comes up high so
            the curve sits behind the lower half of the image card on mobile.
            On desktop (sm+) the overlap and arc are dropped via the
            .benu-content-arc CSS so title + first options stay above the
            fold inside the dialog. */}
        <div
          className="benu-content-arc relative -mt-[80%] bg-cream-light px-6 pt-[85%] pb-6 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.06)] sm:mt-0 sm:pt-4"
        >
          <div>
            <h2
              className={[
                "text-2xl font-semibold uppercase text-neutral-900",
                lang === "zh"
                  ? "tracking-normal"
                  : "tracking-[0.08em]",
              ].join(" ")}
            >
              {localName(item, lang, autoMap)}
            </h2>
            <div className="mt-1 flex items-baseline gap-3 text-sm text-neutral-700">
              <span>{formatPrice(item.price)}</span>
            </div>
            <p className="mt-3 text-base leading-relaxed text-neutral-700">
              {localDescription(item, lang, autoMap)}
            </p>
            {flags.length > 0 && (
              <p className="mt-3 text-sm text-amber-700">
                {t("headsUp")}{" "}
                {flags.map((f) => t(f).toLowerCase()).join(", ")}
                {", "}
                {t("inYourPrefs")}
              </p>
            )}
          </div>

          <div className="mt-6 space-y-6">
            {groups.map((g) => (
              <section key={g.id}>
                <div className="mb-2 flex items-baseline justify-between">
                  <h3 className="text-base font-semibold uppercase tracking-wider text-neutral-700">
                    {t(`group_${g.id}`)}
                  </h3>
                  {g.required && (
                    <span className="text-[10px] uppercase tracking-wider text-neutral-500">
                      {t("required")}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 items-stretch gap-2">
                  {g.choices.map((c) => {
                    const picked = (selections[g.id] ?? []).includes(c.id);
                    const hasMeta =
                      (c.priceModifier != null && c.priceModifier !== 0) ||
                      Boolean(c.warning);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={(e) => {
                          toggleChoice(g, c.id);
                          e.currentTarget.blur();
                        }}
                        className={[
                          "flex h-full flex-col rounded-2xl border px-3 py-3 text-left text-base shadow-sm transition-all",
                          "focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-700/30",
                          picked
                            ? "border-cantaloupe-deep bg-cantaloupe text-neutral-900 shadow-inner"
                            : "border-neutral-300 bg-white text-neutral-800 hover:border-neutral-500 hover:shadow-md",
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
                          <span className="font-medium">{t(`choice_${c.id}`) !== `choice_${c.id}` ? t(`choice_${c.id}`) : c.label}</span>
                        </div>
                        <div className="mt-1 ml-6 flex min-h-[1rem] flex-wrap items-center gap-x-2 text-xs text-neutral-500">
                          {hasMeta && c.priceModifier != null && c.priceModifier !== 0 && (
                            <span>
                              {c.priceModifier > 0 ? "+" : ""}
                              {formatPrice(c.priceModifier)}
                            </span>
                          )}
                          {hasMeta && c.warning && (
                            <span className="text-amber-700">
                              {t(c.warning.charAt(0).toUpperCase() + c.warning.slice(1))} {t("containsAllergen")}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}

            {supportsSpecialRequest && (
              <section>
                <div className="mb-2 flex items-baseline justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-neutral-700">
                    Special Request
                  </h3>
                  <span className="text-[10px] uppercase tracking-wider text-neutral-500">
                    Optional
                  </span>
                </div>
                <textarea
                  value={specialRequest}
                  onChange={(e) => setSpecialRequest(e.target.value)}
                  placeholder="Allergies, sauce on the side, less salt, etc."
                  rows={3}
                  maxLength={250}
                  className="w-full resize-none rounded-2xl border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-neutral-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-700/30"
                />
              </section>
            )}

            <section>
              <h3 className="mb-2 text-base font-semibold uppercase tracking-wider text-neutral-700">
                {t("quantity")}
              </h3>
              <div className="inline-flex items-center gap-3 rounded-full border border-neutral-300 bg-white px-3 py-2 select-none">
                <button
                  type="button"
                  aria-label={t("decreaseQty")}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    startHold(() => setQuantity((q) => Math.max(1, q - 1)));
                  }}
                  onPointerUp={clearHold}
                  onPointerLeave={clearHold}
                  onPointerCancel={clearHold}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-cantaloupe text-base text-neutral-900 hover:bg-cantaloupe-soft active:bg-cantaloupe-deep touch-none"
                >
                  −
                </button>
                <span className="min-w-[1.5rem] text-center font-medium">
                  {quantity}
                </span>
                <button
                  type="button"
                  aria-label={t("increaseQty")}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    startHold(() => setQuantity((q) => q + 1));
                  }}
                  onPointerUp={clearHold}
                  onPointerLeave={clearHold}
                  onPointerCancel={clearHold}
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-cantaloupe text-base text-neutral-900 hover:bg-cantaloupe-soft active:bg-cantaloupe-deep touch-none"
                >
                  +
                </button>
              </div>
            </section>
          </div>

          <div className="sticky bottom-0 -mx-6 mt-8 bg-cream-light/95 px-6 py-5 backdrop-blur">
            <button
              type="button"
              onClick={handleAdd}
              disabled={!allRequiredMet}
              className={[
                "flex w-full items-center justify-between rounded-full px-6 py-4 text-base font-medium shadow-md transition-colors",
                allRequiredMet
                  ? "bg-neutral-900 text-cream hover:bg-neutral-800"
                  : "bg-neutral-300 text-neutral-500",
              ].join(" ")}
            >
              <span>{justAdded ? t("added") : t("addToCart")}</span>
              <span>{formatPrice(totalPrice)}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
