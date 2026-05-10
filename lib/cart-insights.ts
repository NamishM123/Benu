import { type MenuItem } from "./menu";
import { findFlaggedPreferences } from "./preferences";
import type { CartLine } from "./cart-store";

function cartItems(cart: CartLine[], menu: MenuItem[]): MenuItem[] {
  const byName = new Map(menu.map((m) => [m.name, m]));
  const items: MenuItem[] = [];
  for (const line of cart) {
    const m = byName.get(line.itemName);
    if (!m) continue;
    for (let i = 0; i < line.quantity; i++) items.push(m);
  }
  return items;
}

const MAINS = new Set(["Dry Noodles", "Noodle Soup", "Rice"]);

const COOLING = new Set([
  "Peach Sparkling Water",
  "Sprite",
  "Coke",
  "Diet Coke",
]);

function isCooling(d: MenuItem): boolean {
  return COOLING.has(d.name);
}

function isTea(d: MenuItem): boolean {
  return d.name.includes("Tea");
}

// Pair one drink per main course. Once every main has a drink (either already
// in the cart or in the suggestion list), nothing else is suggested — that is
// what keeps the cart drawer from looping ("add → new suggestion → add → …").
export function pickPairings(
  cart: CartLine[],
  preferences: string[],
  menu: MenuItem[],
): MenuItem[] {
  const items = cartItems(cart, menu);
  if (items.length === 0) return [];

  const mainsCount = items.filter((m) => MAINS.has(m.category)).length;
  const drinksInCart = items.filter((m) => m.category === "Beverages").length;
  const drinksNeeded = Math.max(0, mainsCount - drinksInCart);
  if (drinksNeeded === 0) return [];

  const namesInCart = new Set(items.map((m) => m.name));
  const safe = (m: MenuItem) =>
    findFlaggedPreferences(m, preferences).length === 0 &&
    !namesInCart.has(m.name);

  const spicyHeavy =
    items.filter((m) => m.spiceLevel >= 2).length >=
    Math.ceil(mainsCount / 2);

  const allDrinks = menu.filter((m) => m.category === "Beverages").filter(safe);

  // Rank: cooling drinks first when the meal runs spicy, otherwise tea first.
  const ranked = [...allDrinks].sort((a, b) => {
    const score = (d: MenuItem) => {
      if (spicyHeavy) return isCooling(d) ? -2 : isTea(d) ? -1 : 0;
      return isTea(d) ? -2 : isCooling(d) ? -1 : 0;
    };
    return score(a) - score(b);
  });

  // Pick distinct drinks, one per missing main, up to what the menu supports.
  return ranked.slice(0, drinksNeeded);
}

export function pairingReason(
  item: MenuItem,
  cart: CartLine[],
  menu: MenuItem[],
): string {
  const items = cartItems(cart, menu);
  const mainsCount = items.filter((m) => MAINS.has(m.category)).length;
  const spicyHeavy =
    mainsCount > 0 &&
    items.filter((m) => m.spiceLevel >= 2).length >=
      Math.ceil(mainsCount / 2);

  if (isCooling(item)) {
    return spicyHeavy
      ? "Cools the heat in your noodles."
      : "Crisp and refreshing alongside the meal.";
  }
  if (isTea(item)) {
    return "Rounds out the meal nicely.";
  }
  return "Goes well with what you've picked.";
}
