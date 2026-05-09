"use client";

import { useTranslation, type Lang } from "@/lib/i18n";

export default function LanguageSwitcher() {
  const { lang, setLang } = useTranslation();

  function pick(next: Lang) {
    setLang(next);
  }

  return (
    <div
      role="group"
      aria-label="Language"
      className="inline-flex items-center rounded-full border border-neutral-300 bg-white p-0.5 text-sm font-medium"
    >
      <button
        type="button"
        onClick={() => pick("en")}
        aria-pressed={lang === "en"}
        className={[
          "rounded-full px-3 py-1 transition-colors",
          lang === "en"
            ? "bg-neutral-900 text-cream"
            : "text-neutral-700 hover:text-neutral-900",
        ].join(" ")}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => pick("zh")}
        aria-pressed={lang === "zh"}
        className={[
          "rounded-full px-3 py-1 transition-colors",
          lang === "zh"
            ? "bg-neutral-900 text-cream"
            : "text-neutral-700 hover:text-neutral-900",
        ].join(" ")}
      >
        中文
      </button>
    </div>
  );
}
