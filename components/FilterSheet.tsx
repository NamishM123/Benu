"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { DEFAULT_OPTIONS } from "@/lib/preferences";
import { setStoredPreferences } from "@/lib/preferences-store";
import { useTranslation } from "@/lib/i18n";

// Icon set: Lucide (https://lucide.dev) — milk, fish, wheat, beef, nut, bean.
const OPTION_ICONS: Record<string, ReactNode> = {
  Dairy: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 2h8" />
      <path d="M9 2v2.789a4 4 0 0 1-.672 2.219l-.656.984A4 4 0 0 0 7 10.212V20a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-9.789a4 4 0 0 0-.672-2.219l-.656-.984A4 4 0 0 1 15 4.788V2" />
      <path d="M7 15a6.472 6.472 0 0 1 5 0 6.47 6.47 0 0 0 5 0" />
    </svg>
  ),
  Fish: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 12c.94-3.46 4.94-6 8.5-6 3.56 0 6.06 2.54 7 6-.94 3.47-3.44 6-7 6s-7.56-2.53-8.5-6Z" />
      <path d="M18 12v.5" />
      <path d="M16 17.93a9.77 9.77 0 0 1 0-11.86" />
      <path d="M7 10.67C7 8 5.58 5.97 2.73 5.5c-1 1.5-1 5 .23 6.5-1.24 1.5-1.24 5-.23 6.5C5.58 18.03 7 16 7 13.33" />
      <path d="M10.46 7.26C10.2 5.88 9.17 4.24 8 3h5.8a2 2 0 0 1 1.98 1.67l.23 1.4" />
      <path d="m16.01 17.93-.23 1.4A2 2 0 0 1 13.8 21H9.5a5.96 5.96 0 0 0 1.49-3.98" />
    </svg>
  ),
  Gluten: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 22 16 8" />
      <path d="M3.47 12.53 5 11l1.53 1.53a3.5 3.5 0 0 1 0 4.94L5 19l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z" />
      <path d="M7.47 8.53 9 7l1.53 1.53a3.5 3.5 0 0 1 0 4.94L9 15l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z" />
      <path d="M11.47 4.53 13 3l1.53 1.53a3.5 3.5 0 0 1 0 4.94L13 11l-1.53-1.53a3.5 3.5 0 0 1 0-4.94Z" />
      <path d="M20 2h2v2a4 4 0 0 1-4 4h-2V6a4 4 0 0 1 4-4Z" />
      <path d="M11.47 17.47 13 19l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L5 19l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z" />
      <path d="M15.47 13.47 17 15l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L9 15l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z" />
      <path d="M19.47 9.47 21 11l-1.53 1.53a3.5 3.5 0 0 1-4.94 0L13 11l1.53-1.53a3.5 3.5 0 0 1 4.94 0Z" />
    </svg>
  ),
  Meat: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16.4 13.7A6.5 6.5 0 1 0 6.28 6.6c-1.1 3.13-.78 3.9-3.18 6.08A3 3 0 0 0 5 18c4 0 8.4-1.8 11.4-4.3" />
      <path d="m18.5 6 2.19 4.5a6.48 6.48 0 0 1-2.29 7.2C15.4 20.2 11 22 7 22a3 3 0 0 1-2.68-1.66L2.4 16.5" />
      <circle cx="12.5" cy="8.5" r="2.5" />
    </svg>
  ),
  Nuts: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4V2" />
      <path d="M5 10v4a7.004 7.004 0 0 0 5.277 6.787c.412.104.802.292 1.102.592L12 22l.621-.621c.3-.3.69-.488 1.102-.592A7.003 7.003 0 0 0 19 14v-4" />
      <path d="M12 4C8 4 4.5 6 4 8c-.243.97-.919 1.952-2 3 1.31-.082 1.972-.29 3-1 .54.92.982 1.356 2 2 1.452-.647 1.954-1.098 2.5-2 .595.995 1.151 1.427 2.5 2 1.31-.621 1.862-1.058 2.5-2 .629.977 1.162 1.423 2.5 2 1.209-.548 1.68-.967 2-2 1.032.916 1.683 1.157 3 1-1.297-1.036-1.758-2.03-2-3-.5-2-4-4-8-4Z" />
    </svg>
  ),
  Soy: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.165 6.598C9.954 7.478 9.64 8.36 9 9c-.64.64-1.521.954-2.402 1.165A6 6 0 0 0 8 22c7.732 0 14-6.268 14-14a6 6 0 0 0-11.835-1.402Z" />
      <path d="M5.341 10.62a4 4 0 1 0 5.279-5.28" />
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
              <h2 className="text-xl font-semibold uppercase tracking-[0.08em] text-neutral-900">
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
          <p className="mt-1 text-base text-neutral-600">
            {t("filterMenuSubtitle")}
          </p>
          <div className="mt-3 flex items-center gap-3 text-base">
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
                      "flex h-11 w-11 flex-none items-center justify-center rounded-full transition-colors",
                      active
                        ? "bg-cantaloupe text-neutral-900"
                        : "bg-white text-neutral-700",
                    ].join(" ")}
                  >
                    <span className="h-[22px] w-[22px]">{OPTION_ICONS[opt]}</span>
                  </span>
                  <span className="flex-1">
                    <span className="block text-base font-medium text-neutral-900">
                      {t(opt)}
                    </span>
                    <span className="block text-xs text-neutral-500">
                      {t(`${opt}_desc`)}
                    </span>
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
