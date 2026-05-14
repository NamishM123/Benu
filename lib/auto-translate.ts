"use client";

import { useEffect, useState } from "react";
import type { Lang } from "./i18n";

const STORAGE_KEY = "benu.auto-translate";
const EVENT = "benu:auto-translate-changed";

type Cache = Partial<Record<Lang, Record<string, string>>>;

function loadCache(): Cache {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const out: Cache = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (v && typeof v === "object") {
        (out as Record<string, Record<string, string>>)[k] = v as Record<
          string,
          string
        >;
      }
    }
    return out;
  } catch {
    return {};
  }
}

function saveCache(cache: Cache): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
    window.dispatchEvent(new CustomEvent(EVENT, { detail: cache }));
  } catch {
    /* ignore */
  }
}

let memCache: Cache = loadCache();

// In-flight tracker so we never hit the API twice for the same text.
const pending: Set<string> = new Set();

export function getAutoTranslation(text: string, lang: Lang): string | undefined {
  return memCache[lang]?.[text];
}

async function fetchAndCache(texts: string[], target: Lang): Promise<void> {
  const existing = memCache[target] ?? {};
  const toFetch = texts.filter(
    (t) => !existing[t] && !pending.has(`${target}:${t}`),
  );
  if (toFetch.length === 0) return;
  toFetch.forEach((t) => pending.add(`${target}:${t}`));

  try {
    const res = await fetch("/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ texts: toFetch, target }),
    });
    if (!res.ok) return;
    const data = (await res.json()) as { translations?: Record<string, string> };
    if (!data.translations) return;
    memCache = {
      ...memCache,
      [target]: { ...(memCache[target] ?? {}), ...data.translations },
    };
    saveCache(memCache);
  } catch {
    /* ignore */
  } finally {
    toFetch.forEach((t) => pending.delete(`${target}:${t}`));
  }
}

/**
 * React hook: returns a map of english -> translated text for the given lang.
 * Triggers a backend fetch for any uncached strings and re-renders when they arrive.
 */
export function useAutoTranslate(
  texts: string[],
  lang: Lang,
): Record<string, string> {
  const [, setTick] = useState(0);

  useEffect(() => {
    function onChange() {
      setTick((v) => v + 1);
    }
    window.addEventListener(EVENT, onChange);
    return () => window.removeEventListener(EVENT, onChange);
  }, []);

  useEffect(() => {
    if (lang === "en") return;
    const existing = memCache[lang] ?? {};
    const missing = texts.filter((t) => t && !existing[t]);
    if (missing.length === 0) return;
    fetchAndCache(missing, lang);
  }, [lang, texts.join("|")]);

  return memCache[lang] ?? {};
}
