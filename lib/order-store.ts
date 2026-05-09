import type { CartLine } from "./cart-store";

const KEY = "benu.orders";
const EVENT = "benu:orders-changed";

export type OrderStatus = "new" | "cooking" | "ready";

export type Order = {
  id: string;
  placedAt: number;
  status: OrderStatus;
  lines: CartLine[];
  preferences: string[];
  etaMinutes?: number;
};

export function getOrders(): Order[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Order[];
  } catch {
    return [];
  }
}

export function saveOrders(orders: Order[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(orders));
    window.dispatchEvent(new CustomEvent(EVENT, { detail: orders }));
  } catch {
    // ignore
  }
}

export function placeOrder(lines: CartLine[], preferences: string[]): Order {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const order: Order = {
    id,
    placedAt: Date.now(),
    status: "new",
    lines,
    preferences,
  };
  const orders = getOrders();
  orders.unshift(order);
  saveOrders(orders);
  return order;
}

export function updateOrder(id: string, patch: Partial<Order>): void {
  saveOrders(
    getOrders().map((o) => (o.id === id ? { ...o, ...patch } : o)),
  );
}

export function removeOrder(id: string): void {
  saveOrders(getOrders().filter((o) => o.id !== id));
}

export const ORDERS_EVENT = EVENT;
