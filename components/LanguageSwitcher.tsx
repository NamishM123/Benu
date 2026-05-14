"use client";

import { useEffect, useRef, useState } from "react";
import { LANGUAGES, languageMeta, useTranslation, type Lang } from "@/lib/i18n";

type Props = {
  /** If set, render the trigger as a compact circular icon button (mobile
   *  header). The default is the pill style used in the desktop header. */
  variant?: "pill" | "icon";
};

/** Dropdown that lists every supported UI language in its own script. We
 *  used to ship a 2-button EN/中 toggle, but 11 languages don't fit as
 *  side-by-side buttons — the popover keeps the trigger small and still
 *  surfaces every locale in one tap. */
export default function LanguageSwitcher({ variant = "pill" }: Props) {
  const { lang, setLang } = useTranslation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const meta = languageMeta(lang);

  // Close when the user clicks outside the popover or presses Escape.
  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent | TouchEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function pick(next: Lang) {
    setLang(next);
    setOpen(false);
  }

  // Compact 3-char "EN", "ES", "中" etc. for the icon trigger; the full
  // native label for the pill trigger.
  const shortLabel = shortLabelFor(lang);

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Language"
        className={
          variant === "icon"
            ? "inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300 bg-white text-base font-semibold text-neutral-900 shadow-sm transition-colors hover:bg-neutral-100"
            : "inline-flex h-10 items-center gap-1.5 rounded-full border border-neutral-300 bg-white px-4 text-base font-medium text-neutral-900 shadow-sm transition-colors hover:bg-neutral-100"
        }
      >
        {variant === "icon" ? (
          <span>{shortLabel}</span>
        ) : (
          <>
            <span dir={meta.dir} className="whitespace-nowrap">
              {meta.label}
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className={[
                "transition-transform duration-150",
                open ? "rotate-180" : "",
              ].join(" ")}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </>
        )}
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Language"
          dir="ltr"
          className="absolute right-0 top-full z-40 mt-2 w-56 max-h-[70vh] overflow-y-auto rounded-2xl border border-neutral-200 bg-white py-2 shadow-xl"
        >
          {LANGUAGES.map((l) => {
            const active = l.code === lang;
            return (
              <li key={l.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => pick(l.code)}
                  className={[
                    "flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-base transition-colors",
                    active
                      ? "bg-neutral-900 text-cream"
                      : "text-neutral-900 hover:bg-neutral-100",
                  ].join(" ")}
                >
                  <span dir={l.dir} className="font-medium">
                    {l.label}
                  </span>
                  {active && (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                      className="flex-none"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// 1-2 char shortcut used by the mobile icon variant. We hand-curate the
// abbreviations so each one renders in its own script (中 vs CN, 한 vs KR,
// FA in Latin won't read as Persian to a Farsi speaker).
function shortLabelFor(lang: Lang): string {
  switch (lang) {
    case "en":
      return "EN";
    case "es":
      return "ES";
    case "zh-Hans":
      return "简";
    case "zh-Hant":
      return "繁";
    case "tl":
      return "FIL";
    case "vi":
      return "VI";
    case "ko":
      return "한";
    case "ja":
      return "日";
    case "fa":
      return "فا";
    case "hy":
      return "Հայ";
    case "ru":
      return "RU";
    default:
      return "EN";
  }
}
