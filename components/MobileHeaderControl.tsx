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
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300 bg-white text-sm font-semibold text-neutral-900 shadow-sm transition-colors hover:bg-neutral-100"
      >
        {lang === "en" ? "EN" : "中"}
      </button>

      {/* Allergies: pill with icon + label so users know what it does */}
      <button
        type="button"
        onClick={onFiltersOpen}
        aria-label={t("filters")}
        className={[
          "relative inline-flex h-10 items-center gap-1.5 rounded-full px-3 text-sm font-medium shadow-sm transition-colors",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-700/30",
          preferencesCount > 0
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
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <span>
          {t("filters")}
          {preferencesCount > 0 ? ` · ${preferencesCount}` : ""}
        </span>
      </button>
    </div>
  );
}
