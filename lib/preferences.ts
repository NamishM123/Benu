import type { MenuItem } from "./menu";

export const DEFAULT_OPTIONS = [
  "Dairy",
  "Fish",
  "Gluten",
  "Meat",
  "Nuts",
  "Soy",
];

const MEAT_TAGS = ["beef", "pork", "lamb", "chicken", "fish", "seafood"];

export const PREFERENCE_TO_TAGS: Record<string, string[]> = {
  Dairy: ["dairy"],
  Fish: ["fish", "seafood"],
  Gluten: ["gluten", "wheat"],
  Meat: MEAT_TAGS,
  Nuts: ["nuts", "peanut", "tree-nut"],
  Soy: ["soy", "soybean"],
};

export function itemContainsPreference(
  item: MenuItem,
  preference: string,
): boolean {
  const flagged = PREFERENCE_TO_TAGS[preference] ?? [preference.toLowerCase()];
  return item.tags.some((t) => flagged.includes(t.toLowerCase()));
}

export function findFlaggedPreferences(
  item: MenuItem,
  prefs: string[],
): string[] {
  return prefs.filter((p) => itemContainsPreference(item, p));
}
