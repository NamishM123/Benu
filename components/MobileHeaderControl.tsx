"use client";

import { useEffect, useRef, useState } from "react";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslation } from "@/lib/i18n";

type Props = {
  onFiltersOpen: () => void;
  preferencesCount: number;
};

const ROTATE_MS = 2500;
const SWIPE_THRESHOLD = 20;
// Single-row height; both views need to render at this fixed height so the
// translate trick lines up cleanly.
const ROW_HEIGHT = 40;

export default function MobileHeaderControl({
  onFiltersOpen,
  preferencesCount,
}: Props) {
  const { t } = useTranslation();
  const [view, setView] = useState<0 | 1>(0); // 0 = filters, 1 = language
  const [paused, setPaused] = useState(false);
  const startYRef = useRef<number | null>(null);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setView((v) => (v === 0 ? 1 : 0));
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, [paused]);

  function handleTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    startYRef.current = e.touches[0].clientY;
    setPaused(true);
  }

  function handleTouchEnd(e: React.TouchEvent<HTMLDivElement>) {
    if (startYRef.current == null) return;
    const dy = e.changedTouches[0].clientY - startYRef.current;
    startYRef.current = null;
    if (Math.abs(dy) > SWIPE_THRESHOLD) {
      setView((v) => (v === 0 ? 1 : 0));
    }
    // Resume auto-rotate after a pause so the user has time to interact
    window.setTimeout(() => setPaused(false), 5000);
  }

  return (
    <div className="flex items-center gap-1.5">
      {/* Indicator dots — show which view is active */}
      <div
        aria-hidden="true"
        className="flex flex-col items-center gap-1 text-neutral-400"
      >
        <span
          className={[
            "h-1.5 w-1.5 rounded-full transition-colors",
            view === 0 ? "bg-neutral-800" : "bg-neutral-300",
          ].join(" ")}
        />
        <span
          className={[
            "h-1.5 w-1.5 rounded-full transition-colors",
            view === 1 ? "bg-neutral-800" : "bg-neutral-300",
          ].join(" ")}
        />
      </div>

      {/* Sliding window — exactly ROW_HEIGHT tall, content flips with translate-y */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative overflow-hidden"
        style={{ height: ROW_HEIGHT }}
        role="group"
        aria-label="Filters and language — swipe up or down to switch"
      >
        <div
          className="flex flex-col transition-transform duration-300 ease-out"
          style={{ transform: `translateY(-${view * ROW_HEIGHT}px)` }}
        >
          {/* View 0: Filters */}
          <div
            className="flex items-center"
            style={{ height: ROW_HEIGHT }}
          >
            <button
              type="button"
              onClick={onFiltersOpen}
              aria-label={t("filters")}
              className={[
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-base font-medium transition-colors",
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
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="7" y1="12" x2="17" y2="12" />
                <line x1="10" y1="18" x2="14" y2="18" />
              </svg>
              <span>
                {t("filters")}
                {preferencesCount > 0 ? ` · ${preferencesCount}` : ""}
              </span>
            </button>
          </div>

          {/* View 1: Language switcher */}
          <div
            className="flex items-center"
            style={{ height: ROW_HEIGHT }}
          >
            <LanguageSwitcher />
          </div>
        </div>
      </div>
    </div>
  );
}
