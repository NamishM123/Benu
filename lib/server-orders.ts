import "server-only";
import { kv } from "@vercel/kv";
import type { CartLine } from "./cart-store";
import type { Order, OrderStatus } from "./order-store";
import { estimateOrderMinutes } from "./prep-time";
import { listMenuItems } from "./server-menu";

// Storage strategy:
// - In production (Vercel KV env vars present), all orders live in a single
//   Redis HASH at HASH_KEY: field = order id, value = JSON-encoded Order.
//   This is durable across lambda instances and cold starts.
// - Locally (no KV env vars), fall back to an in-memory Map kept on
//   globalThis so it survives Next.js dev HMR.

const HASH_KEY = "benu:orders";

const useKv =
  !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;

// ---- in-memory fallback ------------------------------------------------

type MemStore = { orders: Map<string, Order> };
const MEM_GLOBAL_KEY = "__benu_order_store_v2__";

function memStore(): MemStore {
  const g = globalThis as unknown as { [MEM_GLOBAL_KEY]?: MemStore };
  if (!g[MEM_GLOBAL_KEY]) g[MEM_GLOBAL_KEY] = { orders: new Map() };
  return g[MEM_GLOBAL_KEY]!;
}

// ---- shared helpers ----------------------------------------------------

function makeId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function sortNewestFirst(orders: Order[]): Order[] {
  return [...orders].sort((a, b) => b.placedAt - a.placedAt);
}

// @vercel/kv stores objects as JSON automatically, but it returns them as
// already-parsed objects. Wrap the type cast in one place.
async function kvList(): Promise<Order[]> {
  const all = (await kv.hvals(HASH_KEY)) as Order[] | null;
  return Array.isArray(all) ? all : [];
}

// ---- public API --------------------------------------------------------

export type CreateOrderInput = {
  lines: CartLine[];
  preferences: string[];
  tableNumber: number;
  clientId?: string;
};

export async function listOrders(): Promise<Order[]> {
  if (useKv) return sortNewestFirst(await kvList());
  return sortNewestFirst([...memStore().orders.values()]);
}

export async function listOrdersForClient(clientId: string): Promise<Order[]> {
  const all = await listOrders();
  return all.filter((o) => o.clientId === clientId);
}

export async function getOrder(id: string): Promise<Order | undefined> {
  if (useKv) {
    const o = (await kv.hget(HASH_KEY, id)) as Order | null;
    return o ?? undefined;
  }
  return memStore().orders.get(id);
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const [all, menu] = await Promise.all([listOrders(), listMenuItems()]);
  const activeAhead = all.filter(
    (o) => o.status === "new" || o.status === "cooking",
  ).length;

  const order: Order = {
    id: makeId(),
    placedAt: Date.now(),
    status: "new",
    lines: input.lines,
    preferences: input.preferences,
    tableNumber: input.tableNumber,
    etaMinutes: estimateOrderMinutes(input.lines, activeAhead, menu),
    clientId: input.clientId,
  };

  if (useKv) {
    await kv.hset(HASH_KEY, { [order.id]: order });
  } else {
    memStore().orders.set(order.id, order);
  }
  return order;
}

export async function patchOrder(
  id: string,
  patch: Partial<Pick<Order, "status" | "etaMinutes" | "priority">>,
): Promise<Order | undefined> {
  const existing = await getOrder(id);
  if (!existing) return undefined;
  const next: Order = { ...existing, ...patch };
  if (useKv) {
    await kv.hset(HASH_KEY, { [id]: next });
  } else {
    memStore().orders.set(id, next);
  }
  return next;
}

export async function deleteOrder(id: string): Promise<boolean> {
  if (useKv) {
    const removed = await kv.hdel(HASH_KEY, id);
    return removed > 0;
  }
  return memStore().orders.delete(id);
}

export type { Order, OrderStatus };
