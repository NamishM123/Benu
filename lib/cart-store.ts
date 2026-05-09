const KEY = "benu.cart";
const EVENT = "benu:cart-changed";

export type CartLine = {
  id: string;
  itemName: string;
  basePrice: number;
  quantity: number;
  unitPrice: number;
  selections: { groupLabel: string; choiceLabels: string[] }[];
  specialRequest?: string;
  image?: string;
};

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
