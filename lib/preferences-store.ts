const KEY = "benu.dietary-preferences";
const CUSTOM_KEY = "benu.custom-allergens";
// SAFETY: cap the custom-allergen list. Without this, a malicious or
// chatty user could grow the list unbounded (every "no <word>" pattern
// adds something), eventually breaking the prompt or the localStorage
// quota. 64 entries is far more than any real diner needs.
const MAX_CUSTOM_ALLERGENS = 64;

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

// Custom (chat-stated) allergens: free-text ingredients the user named
// in the chat. Persisted so a page refresh, route change, or device
// sleep can't drop "I'm allergic to potato" stated five turns ago.
export function getStoredCustomAllergens(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CUSTOM_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((p): p is string => typeof p === "string")
      .slice(0, MAX_CUSTOM_ALLERGENS);
  } catch {
    return [];
  }
}

export function setStoredCustomAllergens(list: string[]): void {
  if (typeof window === "undefined") return;
  try {
    const capped = list.slice(0, MAX_CUSTOM_ALLERGENS);
    window.localStorage.setItem(CUSTOM_KEY, JSON.stringify(capped));
    window.dispatchEvent(
      new CustomEvent("benu:custom-allergens-changed", { detail: capped }),
    );
  } catch {
    // localStorage disabled — silently ignore
  }
}

export const CUSTOM_ALLERGENS_EVENT = "benu:custom-allergens-changed";
