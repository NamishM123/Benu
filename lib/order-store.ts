import type { CartLine } from "./cart-store";
import { estimateOrderMinutes, TABLE_COUNT } from "./prep-time";

const KEY = "benu.orders";
const EVENT = "benu:orders-changed";
const TABLE_SESSION_KEY = "benu.table";

// Source the active table number for this session. Order of preference:
// 1. ?table=N URL param (this is what the in-restaurant QR codes will use)
// 2. A previously cached value in sessionStorage
// 3. A random table 1..TABLE_COUNT, cached for the rest of the session
export function getCurrentTableNumber(): number {
  if (typeof window === "undefined") return 1;
  try {
    const fromUrl = new URL(window.location.href).searchParams.get("table");
    if (fromUrl) {
      const n = Number(fromUrl);
      if (Number.isInteger(n) && n >= 1 && n <= TABLE_COUNT) {
        window.sessionStorage.setItem(TABLE_SESSION_KEY, String(n));
        return n;
      }
    }
    const cached = window.sessionStorage.getItem(TABLE_SESSION_KEY);
    if (cached) {
      const n = Number(cached);
      if (Number.isInteger(n) && n >= 1 && n <= TABLE_COUNT) return n;
    }
    const n = 1 + Math.floor(Math.random() * TABLE_COUNT);
    window.sessionStorage.setItem(TABLE_SESSION_KEY, String(n));
    return n;
  } catch {
    return 1;
  }
}

export type OrderStatus = "new" | "cooking" | "ready";

export type Order = {
  id: string;
  placedAt: number;
  status: OrderStatus;
  lines: CartLine[];
  preferences: string[];
  tableNumber: number;
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

export function placeOrder(
  lines: CartLine[],
  preferences: string[],
  tableNumber: number,
): Order {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  const existing = getOrders();
  const activeAhead = existing.filter(
    (o) => o.status === "new" || o.status === "cooking",
  ).length;

  const order: Order = {
    id,
    placedAt: Date.now(),
    status: "new",
    lines,
    preferences,
    tableNumber,
    etaMinutes: estimateOrderMinutes(lines, activeAhead),
  };
  existing.unshift(order);
  saveOrders(existing);
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
