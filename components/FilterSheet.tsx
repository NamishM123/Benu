"use client";

import { useEffect, useRef, useState } from "react";
import { DEFAULT_OPTIONS } from "@/lib/preferences";
import { setStoredPreferences } from "@/lib/preferences-store";

type Props = {
  open: boolean;
  preferences: string[];
  onClose: () => void;
};

const SWIPE_DISMISS_THRESHOLD = 110;

export default function FilterSheet({ open, preferences, onClose }: Props) {
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
        className="relative w-full max-w-[480px] max-h-[88vh] overflow-y-auto overscroll-contain rounded-t-3xl bg-cream shadow-xl sm:rounded-3xl"
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
          className="bg-cream px-6 pt-2 pb-4"
        >
          <h2 className="font-serif text-2xl text-neutral-900">Filter menu</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Items containing what you avoid will be flagged.
          </p>
        </header>

        <div className="px-6 pb-6">
          <div className="grid grid-cols-2 gap-3">
            {DEFAULT_OPTIONS.map((opt) => {
              const active = draft.has(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={(e) => {
                    toggle(opt);
                    e.currentTarget.blur();
                  }}
                  className={[
                    "rounded-2xl py-4 text-base transition-all",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-700/30",
                    active
                      ? "bg-cantaloupe text-neutral-900 shadow-inner ring-1 ring-inset ring-neutral-900/15"
                      : "bg-sage text-neutral-900 hover:bg-sage-dark/40",
                  ].join(" ")}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>

        <div className="sticky bottom-0 border-t border-neutral-200 bg-cream/95 px-6 py-4 backdrop-blur">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClear}
              className="flex-none rounded-full border border-neutral-300 px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-100"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="flex-1 rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-cream hover:bg-neutral-800"
            >
              Apply{draft.size > 0 ? ` (${draft.size})` : ""}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
