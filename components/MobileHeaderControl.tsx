"use client";

import { useTranslation } from "@/lib/i18n";
import LanguageSwitcher from "./LanguageSwitcher";

type Props = {
  onFiltersOpen: () => void;
  preferencesCount: number;
};

/**
 * Mobile header controls: compact circular icon buttons.
 * Renders the LanguageSwitcher in its `icon` variant (a single 40px
 * button that opens the full language popover) plus the dietary filter
 * pill. The cart button is rendered separately by the parent.
 */
export default function MobileHeaderControl({
  onFiltersOpen,
  preferencesCount,
}: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-1.5">
      <LanguageSwitcher variant="icon" />

      {/* Filter: full-width text label, D and R hugging button edges */}
      <button
        type="button"
        onClick={onFiltersOpen}
        aria-label={t("dietaryFilter")}
        className={[
          "relative inline-flex h-10 items-center justify-center whitespace-nowrap rounded-full px-2.5 text-base font-medium shadow-sm transition-colors",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-700/30",
          preferencesCount > 0
            ? "bg-cantaloupe text-neutral-900 hover:bg-cantaloupe-soft"
            : "border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-100",
        ].join(" ")}
      >
        <span>{t("dietaryFilter")}</span>
        {preferencesCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-neutral-900 px-1 text-[10px] font-semibold text-cream">
            {preferencesCount}
          </span>
        )}
      </button>
    </div>
  );
}
