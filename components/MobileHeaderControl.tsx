"use client";

import { useTranslation } from "@/lib/i18n";

type Props = {
  onFiltersOpen: () => void;
  preferencesCount: number;
};

/**
 * Mobile header controls: compact circular icon buttons.
 * Shows: language toggle (current lang text, tap to switch),
 * filters (icon-only), and cart (rendered separately by parent).
 * All buttons are h-10 w-10 to match the cart button.
 */
export default function MobileHeaderControl({
  onFiltersOpen,
  preferencesCount,
}: Props) {
  const { t, lang, setLang } = useTranslation();

  return (
    <div className="flex items-center gap-2">
      {/* Language toggle: tap to switch between EN and 中 */}
      <button
        type="button"
        onClick={() => setLang(lang === "en" ? "zh" : "en")}
        aria-label="Toggle language"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 bg-white text-xs font-semibold text-neutral-900 shadow-sm transition-colors hover:bg-neutral-100"
      >
        {lang === "en" ? "EN" : "中"}
      </button>

      {/* Dietary Filter: compact text pill, count shown as a badge */}
      <button
        type="button"
        onClick={onFiltersOpen}
        aria-label={t("filters")}
        className={[
          "relative inline-flex h-9 w-[7.5rem] items-center justify-center whitespace-nowrap rounded-full px-3 text-xs font-medium shadow-sm transition-colors",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-700/30",
          preferencesCount > 0
            ? "bg-cantaloupe text-neutral-900 hover:bg-cantaloupe-soft"
            : "border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-100",
        ].join(" ")}
      >
        <span>{t("filters")}</span>
        {preferencesCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-neutral-900 px-1 text-[10px] font-semibold text-cream">
            {preferencesCount}
          </span>
        )}
      </button>
    </div>
  );
}
