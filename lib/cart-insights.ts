import { MENU, type MenuItem } from "./menu";
import { findFlaggedPreferences } from "./preferences";
import type { CartLine } from "./cart-store";

function cartItems(cart: CartLine[]): MenuItem[] {
  const byName = new Map(MENU.map((m) => [m.name, m]));
  const items: MenuItem[] = [];
  for (const line of cart) {
    const m = byName.get(line.itemName);
    if (!m) continue;
    for (let i = 0; i < line.quantity; i++) items.push(m);
  }
  return items;
}

const MAINS = new Set(["Dry Noodles", "Noodle Soup", "Rice"]);

export function pickPairing(
  cart: CartLine[],
  preferences: string[],
): MenuItem | null {
  const items = cartItems(cart);
  if (items.length === 0) return null;

  const namesInCart = new Set(items.map((m) => m.name));
  const safe = (m: MenuItem) =>
    findFlaggedPreferences(m, preferences).length === 0 &&
    !namesInCart.has(m.name);

  const hasCategory = (cat: string) => items.some((m) => m.category === cat);
  const hasMain = items.some((m) => MAINS.has(m.category));
  const spicyHeavy =
    items.filter((m) => m.spiceLevel >= 2).length >=
    Math.ceil(items.length / 2);

  // 1. No drink yet → recommend one (cooling if the order is spicy)
  if (!hasCategory("Beverages")) {
    const drinks = MENU.filter((m) => m.category === "Beverages").filter(safe);
    if (spicyHeavy) {
      const cooling = drinks.find(
        (d) =>
          d.name.includes("Sparkling") ||
          d.name === "Sprite" ||
          d.name === "Coke" ||
          d.name === "Diet Coke",
      );
      if (cooling) return cooling;
    }
    const lemon = drinks.find((d) => d.name.includes("Lemon"));
    if (lemon) return lemon;
    if (drinks[0]) return drinks[0];
  }

  // 2. Has a main but no appetizer → suggest a starter
  if (hasMain && !hasCategory("Appetizers")) {
    const apps = MENU.filter((m) => m.category === "Appetizers").filter(safe);
    const wontons = apps.find((a) => a.name === "Chili Oil Wontons");
    if (wontons && !spicyHeavy) return wontons;
    const popcorn = apps.find((a) => a.name === "Popcorn Chicken");
    if (popcorn) return popcorn;
    if (apps[0]) return apps[0];
  }

  // 3. Only appetizers → suggest a main to anchor the meal
  if (!hasMain && hasCategory("Appetizers")) {
    const mains = MENU.filter((m) => MAINS.has(m.category)).filter(safe);
    const signature = mains.find((m) => m.name.includes("House Special"));
    if (signature) return signature;
    if (mains[0]) return mains[0];
  }

  // Fallback: pick any safe appetizer
  const fallback = MENU.filter((m) => m.category === "Appetizers").filter(
    safe,
  )[0];
  return fallback ?? null;
}

export function pairingReason(item: MenuItem, cart: CartLine[]): string {
  const items = cartItems(cart);
  const spicyHeavy =
    items.filter((m) => m.spiceLevel >= 2).length >=
    Math.ceil(items.length / 2);

  if (item.category === "Beverages") {
    if (spicyHeavy) return "Cools the heat in your noodles.";
    return "Rounds out the meal nicely.";
  }
  if (item.category === "Appetizers") {
    return "A quick starter while the noodles cook.";
  }
  if (MAINS.has(item.category)) {
    return "Anchors the order with a proper bowl.";
  }
  return "Goes well with what you've picked.";
}

