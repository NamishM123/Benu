const KEY = "benu.dietary-preferences";

export function getStoredPreferences(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((p): p is string => typeof p === "string");
  } catch {
    return [];
  }
}

export function setStoredPreferences(prefs: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(prefs));
    window.dispatchEvent(
      new CustomEvent("benu:preferences-changed", { detail: prefs }),
    );
  } catch {
    // localStorage disabled — silently ignore
  }
}
