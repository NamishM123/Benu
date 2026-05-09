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
};

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
