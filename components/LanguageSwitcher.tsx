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
      className="inline-flex items-center rounded-full border border-neutral-300 bg-white text-base font-medium"
    >
      <button
        type="button"
        onClick={() => pick("en")}
        aria-pressed={lang === "en"}
        className={[
          "min-w-[3.25rem] rounded-full px-4 py-2 text-base font-medium transition-colors",
          lang === "en"
            ? "bg-neutral-900 text-cream"
            : "text-neutral-900 hover:text-neutral-700",
        ].join(" ")}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => pick("zh")}
        aria-pressed={lang === "zh"}
        className={[
          "min-w-[3.25rem] rounded-full px-4 py-2 text-base font-medium transition-colors",
          lang === "zh"
            ? "bg-neutral-900 text-cream"
            : "text-neutral-900 hover:text-neutral-700",
        ].join(" ")}
      >
        中文
      </button>
    </div>
  );
}
