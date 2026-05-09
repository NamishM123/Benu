"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { DEFAULT_OPTIONS } from "@/lib/preferences";
import { setStoredPreferences } from "@/lib/preferences-store";
import { useTranslation } from "@/lib/i18n";

const OPTION_ICONS: Record<string, ReactNode> = {
  Dairy: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3h8l1 4-1 12a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2L7 7l1-4z" />
      <path d="M7 7h10" />
    </svg>
  ),
  Fish: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12c3-5 8-6 12-6 4 0 6 3 6 6s-2 6-6 6c-4 0-9-1-12-6z" />
      <path d="M21 12l-3-2v4l3-2z" />
      <circle cx="8" cy="11" r="0.8" fill="currentColor" />
    </svg>
  ),
  Gluten: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v18" />
      <path d="M12 7c-2-1-4-1-5 1 1 2 3 2 5 1" />
      <path d="M12 7c2-1 4-1 5 1-1 2-3 2-5 1" />
      <path d="M12 12c-2-1-4-1-5 1 1 2 3 2 5 1" />
      <path d="M12 12c2-1 4-1 5 1-1 2-3 2-5 1" />
      <path d="M12 17c-2-1-4-1-5 1 1 2 3 2 5 1" />
      <path d="M12 17c2-1 4-1 5 1-1 2-3 2-5 1" />
    </svg>
  ),
  Meat: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 13a7 7 0 1 1 11 5l-3 3-2-2-3-2-3-2v-2z" />
      <circle cx="9" cy="11" r="1.3" />
    </svg>
  ),
  Nuts: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="12" rx="5" ry="8" />
      <path d="M9 7c1 2 1 8 0 10" />
      <path d="M15 7c-1 2-1 8 0 10" />
    </svg>
  ),
  Soy: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="9" cy="9" rx="3.5" ry="3" transform="rotate(-30 9 9)" />
      <ellipse cx="15" cy="15" rx="3.5" ry="3" transform="rotate(-30 15 15)" />
      <path d="M5 14c4 0 6-2 6-6" />
    </svg>
  ),
};

type Props = {
  open: boolean;
  preferences: string[];
  onClose: () => void;
};

const SWIPE_DISMISS_THRESHOLD = 110;

export default function FilterSheet({ open, preferences, onClose }: Props) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState<Set<string>>(() => new Set(preferences));
  const [dragOffset, setDragOffset] = useState(0);
  const startYRef = useRef<number | null>(null);
  const draggingRef = useRef(false);

  // Sync draft when sheet opens with the latest stored prefs
  useEffect(() => {
    if (open) {
      setDraft(new Set(preferences));
      setDragOffset(0);
    }
  }, [open, preferences]);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const orig = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = orig;
    };
  }, [open]);

  if (!open) return null;

  function toggle(opt: string) {
    setDraft((prev) => {
      const next = new Set(prev);
      if (next.has(opt)) next.delete(opt);
      else next.add(opt);
      return next;
    });
  }

  function handleApply() {
    setStoredPreferences(Array.from(draft));
    onClose();
  }

  function handleClear() {
    setDraft(new Set());
  }

  function handleTouchStart(e: React.TouchEvent<HTMLDivElement>) {
    startYRef.current = e.touches[0].clientY;
    draggingRef.current = true;
  }

  function handleTouchMove(e: React.TouchEvent<HTMLDivElement>) {
    if (!draggingRef.current || startYRef.current == null) return;
    const dy = e.touches[0].clientY - startYRef.current;
    setDragOffset(Math.max(0, dy));
  }

  function handleTouchEnd() {
    if (dragOffset > SWIPE_DISMISS_THRESHOLD) {
      onClose();
    } else {
      setDragOffset(0);
    }
    draggingRef.current = false;
    startYRef.current = null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Dietary filters"
        onClick={(e) => e.stopPropagation()}
        style={{
          transform: `translateY(${dragOffset}px)`,
          transition: draggingRef.current ? "none" : "transform 200ms ease-out",
        }}
        className="relative w-full max-w-[480px] max-h-[88vh] overflow-y-auto overscroll-none rounded-t-3xl bg-cream shadow-xl sm:rounded-3xl"
      >
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          className="sticky top-0 z-10 flex cursor-grab touch-none flex-col items-center justify-center bg-cream/95 pt-3 pb-1 backdrop-blur active:cursor-grabbing"
          aria-hidden="true"
        >
          <span className="h-1.5 w-12 rounded-full bg-neutral-300" />
        </div>

        <header
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          className="bg-cream px-6 pt-2 pb-3"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h2 className="font-serif text-2xl text-neutral-900">
                {t("filterMenuTitle")}
              </h2>
              {draft.size > 0 && (
                <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-neutral-900 px-2 text-xs font-semibold text-cream">
                  {draft.size}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("close")}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-200 text-neutral-700 hover:bg-neutral-300"
            >
              ×
            </button>
          </div>
          <p className="mt-1 text-sm text-neutral-600">
            {t("filterMenuSubtitle")}
          </p>
          <div className="mt-3 flex items-center gap-3 text-sm">
            <button
              type="button"
              onClick={() => setDraft(new Set(DEFAULT_OPTIONS))}
              className="text-cantaloupe-deep hover:text-neutral-900 hover:underline underline-offset-2"
            >
              {t("selectAll")}
            </button>
            <span className="text-neutral-400" aria-hidden="true">
              ·
            </span>
            <button
              type="button"
              onClick={handleClear}
              className="text-cantaloupe-deep hover:text-neutral-900 hover:underline underline-offset-2"
            >
              {t("reset")}
            </button>
          </div>
        </header>

        <ul className="space-y-2 px-4 pb-6 pt-2">
          {DEFAULT_OPTIONS.map((opt) => {
            const active = draft.has(opt);
            return (
              <li key={opt}>
                <button
                  type="button"
                  onClick={(e) => {
                    toggle(opt);
                    e.currentTarget.blur();
                  }}
                  className={[
                    "flex w-full items-center gap-4 rounded-2xl border px-4 py-3 text-left transition-all",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-700/30",
                    active
                      ? "border-cantaloupe-deep bg-cantaloupe/30 shadow-inner"
                      : "border-neutral-300/70 bg-cream-light hover:border-neutral-400/70 hover:bg-[#FFFDF6]",
                  ].join(" ")}
                  aria-pressed={active}
                >
                  <span
                    aria-hidden="true"
                    className={[
                      "flex h-10 w-10 flex-none items-center justify-center rounded-full transition-colors",
                      active
                        ? "bg-cantaloupe text-neutral-900"
                        : "bg-white text-neutral-700",
                    ].join(" ")}
                  >
                    <span className="h-5 w-5">{OPTION_ICONS[opt]}</span>
                  </span>
                  <span className="flex-1">
                    <span className="block text-base font-medium text-neutral-900">
                      {t(opt)}
                    </span>
                    <span className="block text-xs text-neutral-500">
                      {t(`${opt}_desc`)}
                    </span>
                  </span>
                  <span
                    aria-hidden="true"
                    className={[
                      "flex h-5 w-5 flex-none items-center justify-center rounded-md border-2 transition-colors",
                      active
                        ? "border-cantaloupe-deep bg-cantaloupe"
                        : "border-neutral-400 bg-white",
                    ].join(" ")}
                  >
                    {active && (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-neutral-900"
                      >
                        <polyline points="5 12 10 17 19 7" />
                      </svg>
                    )}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="sticky bottom-0 border-t border-neutral-200 bg-cream/95 px-6 py-4 backdrop-blur">
          <button
            type="button"
            onClick={handleApply}
            className="w-full rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-cream hover:bg-neutral-800"
          >
            {t("apply")}
            {draft.size > 0 ? ` (${draft.size})` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
