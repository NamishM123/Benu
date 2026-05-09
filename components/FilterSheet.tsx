"use client";

import { useEffect, useRef, useState } from "react";
import { DEFAULT_OPTIONS } from "@/lib/preferences";
import { setStoredPreferences } from "@/lib/preferences-store";
import { useTranslation } from "@/lib/i18n";

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

        <ul className="px-2 pb-6">
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
                    "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-base transition-colors",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-700/30",
                    active
                      ? "bg-cantaloupe/30 text-neutral-900"
                      : "text-neutral-900 hover:bg-cream-light",
                  ].join(" ")}
                  aria-pressed={active}
                >
                  <span
                    aria-hidden="true"
                    className={[
                      "flex h-5 w-5 flex-none items-center justify-center rounded border-2 transition-colors",
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
                  <span className="flex-1">{t(opt)}</span>
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
