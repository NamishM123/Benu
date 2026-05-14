import type { Lang } from "./i18n";

const KEY = "benu.cart";
const EVENT = "benu:cart-changed";

export type CartLine = {
  id: string;
  itemName: string;
  // Legacy field — kept so existing localStorage entries keep rendering
  // in Simplified Chinese. New code reads from `itemNames` instead.
  itemNameZh?: string;
  // Optional snapshot of every language's translated dish name at the
  // moment the line was added to the cart. Denormalized from the menu so
  // the cart drawer + order pages don't need to re-look up translations
  // from a menu prop on every render.
  itemNames?: Partial<Record<Lang, string>>;
  basePrice: number;
  quantity: number;
  unitPrice: number;
  selections: { groupLabel: string; choiceLabels: string[] }[];
  specialRequest?: string;
  image?: string;
};

/** Pick the right per-language name for a cart line. Falls back through:
 *  explicit translations map → legacy `itemNameZh` (only for zh-Hans) →
 *  English `itemName`. Use this anywhere we used to test
 *  `lang === "zh" && line.itemNameZh ? line.itemNameZh : line.itemName`. */
export function cartLineName(line: CartLine, lang: Lang): string {
  if (lang === "en") return line.itemName;
  const fromMap = line.itemNames?.[lang];
  if (fromMap) return fromMap;
  if (lang === "zh-Hans" && line.itemNameZh) return line.itemNameZh;
  return line.itemName;
}

function sameSelections(
  a: CartLine["selections"],
  b: CartLine["selections"],
): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i].groupLabel !== b[i].groupLabel) return false;
    const ac = a[i].choiceLabels;
    const bc = b[i].choiceLabels;
    if (ac.length !== bc.length) return false;
    for (let j = 0; j < ac.length; j++) {
      if (ac[j] !== bc[j]) return false;
    }
  }
  return true;
}

function isSameLine(
  existing: CartLine,
  incoming: Omit<CartLine, "id">,
): boolean {
  return (
    existing.itemName === incoming.itemName &&
    existing.unitPrice === incoming.unitPrice &&
    (existing.specialRequest ?? "") === (incoming.specialRequest ?? "") &&
    sameSelections(existing.selections, incoming.selections)
  );
}

export function getCart(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as CartLine[];
  } catch {
    return [];
  }
}

export function saveCart(cart: CartLine[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(cart));
    window.dispatchEvent(new CustomEvent(EVENT, { detail: cart }));
  } catch {
    // ignore
  }
}

export function addToCart(line: Omit<CartLine, "id">): void {
  const cart = getCart();
  // If an identical line already exists, just bump its quantity
  const existingIdx = cart.findIndex((l) => isSameLine(l, line));
  if (existingIdx >= 0) {
    cart[existingIdx] = {
      ...cart[existingIdx],
      quantity: cart[existingIdx].quantity + line.quantity,
    };
    saveCart(cart);
    return;
  }
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  cart.push({ ...line, id });
  saveCart(cart);
}

export function removeFromCart(id: string): void {
  saveCart(getCart().filter((l) => l.id !== id));
}

export function updateLineQuantity(id: string, quantity: number): void {
  // Floor at 1 — explicit removal must go through removeFromCart
  const next = Math.max(1, quantity);
  saveCart(
    getCart().map((l) => (l.id === id ? { ...l, quantity: next } : l)),
  );
}

export function clearCart(): void {
  saveCart([]);
}

export function cartCount(cart: CartLine[]): number {
  return cart.reduce((sum, l) => sum + l.quantity, 0);
}

export function cartTotal(cart: CartLine[]): number {
  return cart.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
}

export const CART_EVENT = EVENT;
