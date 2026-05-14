import type { CartLine } from "./cart-store";
import { TABLE_COUNT } from "./prep-time";
import { getClientId } from "./client-id";

const EVENT = "benu:orders-changed";
const TABLE_SESSION_KEY = "benu.table";

// Poll every 4s while the tab is visible; pause otherwise. Keeping this
// modest matters because each poll is a Redis HVALS call billed against
// Vercel KV / Upstash limits.
const POLL_INTERVAL_MS = 4000;

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
  clientId?: string;
  priority?: boolean;
};

// Client-side cache of the latest server snapshot. Components read this
// synchronously via getOrders() and re-render when ORDERS_EVENT fires.
let cache: Order[] = [];

function notify() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT, { detail: cache }));
}

function setCache(next: Order[]) {
  cache = next;
  notify();
}

export function getOrders(): Order[] {
  return cache;
}

export const ORDERS_EVENT = EVENT;

export type SubscribeOptions = {
  // If provided, only fetch orders for this clientId. Omit for kitchen view.
  scope?: "client" | "all";
};

// Track active subscribers so multiple components share a single poll loop.
type SubState = {
  count: number;
  timer: ReturnType<typeof setInterval> | null;
  scope: "client" | "all";
  visibilityListener: (() => void) | null;
};
const subs: SubState = {
  count: 0,
  timer: null,
  scope: "all",
  visibilityListener: null,
};

function isVisible(): boolean {
  if (typeof document === "undefined") return true;
  return document.visibilityState !== "hidden";
}

async function fetchOrders(scope: "client" | "all"): Promise<Order[]> {
  const url =
    scope === "client"
      ? `/api/orders?clientId=${encodeURIComponent(getClientId())}`
      : `/api/orders`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`fetch orders failed: ${res.status}`);
  const data = (await res.json()) as { orders: Order[] };
  return Array.isArray(data.orders) ? data.orders : [];
}

export function subscribeToOrders(opts: SubscribeOptions = {}): () => void {
  const scope = opts.scope ?? "all";
  // If a different scope is requested while one is active, the broader
  // request wins (kitchen needs everything). For this app, only one scope
  // is in play per page, so this is mostly a safety net.
  if (subs.count === 0 || scope === "all") subs.scope = scope;
  subs.count += 1;

  const tick = async () => {
    if (!isVisible()) return;
    try {
      const next = await fetchOrders(subs.scope);
      setCache(next);
    } catch {
      // swallow — next tick will retry
    }
  };

  if (subs.timer === null) {
    void tick();
    subs.timer = setInterval(tick, POLL_INTERVAL_MS);
    if (typeof document !== "undefined") {
      subs.visibilityListener = () => {
        if (isVisible()) void tick();
      };
      document.addEventListener("visibilitychange", subs.visibilityListener);
    }
  } else {
    // New subscriber: trigger an immediate refresh so they see fresh data.
    void tick();
  }

  return () => {
    subs.count = Math.max(0, subs.count - 1);
    if (subs.count === 0) {
      if (subs.timer !== null) {
        clearInterval(subs.timer);
        subs.timer = null;
      }
      if (subs.visibilityListener && typeof document !== "undefined") {
        document.removeEventListener(
          "visibilitychange",
          subs.visibilityListener,
        );
        subs.visibilityListener = null;
      }
    }
  };
}

async function refresh(): Promise<void> {
  try {
    const next = await fetchOrders(subs.scope);
    setCache(next);
  } catch {
    // ignore
  }
}

export async function placeOrder(
  lines: CartLine[],
  preferences: string[],
  tableNumber: number,
): Promise<Order> {
  const res = await fetch(`/api/orders`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      lines,
      preferences,
      tableNumber,
      clientId: getClientId(),
    }),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    throw new Error(`placeOrder failed: ${res.status} ${err}`);
  }
  const data = (await res.json()) as { order: Order };
  // Optimistically prepend, then refresh in the background.
  setCache([data.order, ...cache.filter((o) => o.id !== data.order.id)]);
  void refresh();
  return data.order;
}

export async function updateOrder(
  id: string,
  patch: Partial<Pick<Order, "status" | "etaMinutes" | "priority">>,
): Promise<void> {
  const res = await fetch(`/api/orders/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) return;
  const data = (await res.json()) as { order: Order };
  setCache(cache.map((o) => (o.id === id ? data.order : o)));
}

export async function removeOrder(id: string): Promise<void> {
  const res = await fetch(`/api/orders/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) return;
  setCache(cache.filter((o) => o.id !== id));
}
