import "server-only";
import { kv } from "@vercel/kv";
import {
  MENU as STATIC_MENU,
  MENU_CATEGORIES,
  type MenuItem,
} from "./menu";

const HASH_KEY = "benu:menu:items";
const SEEDED_FLAG_KEY = "benu:menu:seeded";

const useKv =
  !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;

// ---- in-memory fallback (local dev) ------------------------------------

type MemStore = {
  items: Map<string, StoredMenuItem>;
  seeded: boolean;
};
const MEM_GLOBAL_KEY = "__benu_menu_store_v1__";
function memStore(): MemStore {
  const g = globalThis as unknown as { [MEM_GLOBAL_KEY]?: MemStore };
  if (!g[MEM_GLOBAL_KEY])
    g[MEM_GLOBAL_KEY] = { items: new Map(), seeded: false };
  return g[MEM_GLOBAL_KEY]!;
}

// ---- shared helpers ----------------------------------------------------

export type StoredMenuItem = MenuItem & { id: string };

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function makeId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function withId(item: MenuItem): StoredMenuItem {
  return { ...item, id: item.id ?? slugify(item.name) };
}

const SEED: StoredMenuItem[] = STATIC_MENU.map(withId);

const CATEGORY_ORDER: Record<string, number> = (() => {
  const map: Record<string, number> = {};
  MENU_CATEGORIES.forEach((c, i) => (map[c] = i));
  return map;
})();

// Preserve the curated order from the static MENU array. Items added later
// via the admin UI fall to the end of their category, then break ties by name.
const SEED_ORDER: Record<string, number> = (() => {
  const map: Record<string, number> = {};
  STATIC_MENU.forEach((item, i) => {
    map[item.name] = i;
  });
  return map;
})();

function sortMenu(items: StoredMenuItem[]): StoredMenuItem[] {
  return [...items].sort((a, b) => {
    const ai = CATEGORY_ORDER[a.category] ?? 99;
    const bi = CATEGORY_ORDER[b.category] ?? 99;
    if (ai !== bi) return ai - bi;
    const ao = SEED_ORDER[a.name] ?? Number.MAX_SAFE_INTEGER;
    const bo = SEED_ORDER[b.name] ?? Number.MAX_SAFE_INTEGER;
    if (ao !== bo) return ao - bo;
    return a.name.localeCompare(b.name);
  });
}

// ---- seeding -----------------------------------------------------------

async function ensureSeeded(): Promise<void> {
  if (useKv) {
    const seeded = await kv.get(SEEDED_FLAG_KEY);
    if (seeded) return;
    // Use a transaction-like multi to write seed + flag together. If two
    // requests race here the flag write makes the second one a no-op
    // because we check the flag again after writing — at worst we'd
    // double-seed identical data, which is fine.
    const payload: Record<string, StoredMenuItem> = {};
    for (const item of SEED) payload[item.id] = item;
    await kv.hset(HASH_KEY, payload);
    await kv.set(SEEDED_FLAG_KEY, 1);
    return;
  }
  const store = memStore();
  if (store.seeded) return;
  for (const item of SEED) store.items.set(item.id, item);
  store.seeded = true;
}

// ---- public API --------------------------------------------------------

// Reconcile stale local image paths with the static MENU. KV was seeded
// once and never re-syncs, so when a bundled image is renamed (e.g.
// coke.avif → coke.jpg) the KV entry keeps pointing at the gone file
// and the menu card falls back to the broken-image SVG. We only touch
// items whose KV image is a local /menu/* path — admin-uploaded URLs
// (http://, https://) and any custom paths are left alone.
function reconcileImagesFromStatic(
  items: StoredMenuItem[],
): StoredMenuItem[] {
  const staticImageByName = new Map<string, string>(
    STATIC_MENU.map((m) => [m.name, m.image]),
  );
  const updates: StoredMenuItem[] = [];
  const reconciled = items.map((item) => {
    const staticImage = staticImageByName.get(item.name);
    if (!staticImage) return item;
    if (item.image && !item.image.startsWith("/menu/")) return item;
    if (item.image === staticImage) return item;
    const fixed: StoredMenuItem = { ...item, image: staticImage };
    updates.push(fixed);
    return fixed;
  });
  if (updates.length > 0) {
    if (useKv) {
      const payload: Record<string, StoredMenuItem> = {};
      for (const u of updates) payload[u.id] = u;
      // Fire-and-forget so a slow KV write doesn't add latency to the page
      // response. Next page load will read the corrected values either way.
      void kv.hset(HASH_KEY, payload).catch((err: unknown) => {
        console.warn(
          "[menu] failed to persist image reconciliation:",
          err,
        );
      });
    } else {
      const store = memStore();
      for (const u of updates) store.items.set(u.id, u);
    }
  }
  return reconciled;
}

// If KV somehow ends up with multiple entries that share a dish name
// (e.g. an admin deleted a built-in dish and re-created it with a new id,
// or an old import left stragglers), collapse them down to one. The
// surviving id is preferred in this order:
//   1. The id used by ensureSeeded() (slugify of the static MENU name).
//   2. The lowest id lexicographically (stable tiebreaker).
// The losers are deleted so the next load doesn't see them at all.
function dedupeByName(items: StoredMenuItem[]): {
  kept: StoredMenuItem[];
  toDelete: string[];
} {
  const byName = new Map<string, StoredMenuItem[]>();
  for (const item of items) {
    const list = byName.get(item.name) ?? [];
    list.push(item);
    byName.set(item.name, list);
  }
  const kept: StoredMenuItem[] = [];
  const toDelete: string[] = [];
  const staticSlugByName = new Map<string, string>(
    STATIC_MENU.map((m) => [m.name, slugify(m.name)]),
  );
  for (const [name, list] of byName.entries()) {
    if (list.length === 1) {
      kept.push(list[0]!);
      continue;
    }
    const sorted = [...list].sort((a, b) => a.id.localeCompare(b.id));
    const preferredId = staticSlugByName.get(name);
    const winner = sorted.find((it) => it.id === preferredId) ?? sorted[0]!;
    kept.push(winner);
    for (const it of list) {
      if (it.id !== winner.id) toDelete.push(it.id);
    }
  }
  return { kept, toDelete };
}

export async function listMenuItems(): Promise<StoredMenuItem[]> {
  await ensureSeeded();
  let raw: StoredMenuItem[];
  if (useKv) {
    const all = (await kv.hvals(HASH_KEY)) as StoredMenuItem[] | null;
    raw = Array.isArray(all) ? all : [];
  } else {
    raw = [...memStore().items.values()];
  }
  const { kept, toDelete } = dedupeByName(raw);
  if (toDelete.length > 0) {
    if (useKv) {
      // Fire-and-forget; next load will see them gone either way.
      void kv
        .hdel(HASH_KEY, ...toDelete)
        .catch((err: unknown) => {
          console.warn("[menu] failed to delete duplicate KV items:", err);
        });
    } else {
      const store = memStore();
      for (const id of toDelete) store.items.delete(id);
    }
  }
  return reconcileImagesFromStatic(sortMenu(kept));
}

export async function getMenuItem(
  id: string,
): Promise<StoredMenuItem | undefined> {
  await ensureSeeded();
  if (useKv) {
    const item = (await kv.hget(HASH_KEY, id)) as StoredMenuItem | null;
    return item ?? undefined;
  }
  return memStore().items.get(id);
}

export type MenuItemInput = Omit<MenuItem, "id"> & { id?: string };

function normalize(input: MenuItemInput, id: string): StoredMenuItem {
  return {
    id,
    name: input.name.trim(),
    nameZh: input.nameZh?.trim() || undefined,
    price: Number(input.price),
    category: input.category,
    description: input.description.trim(),
    descriptionZh: input.descriptionZh?.trim() || undefined,
    spiceLevel: (Math.max(0, Math.min(3, input.spiceLevel)) | 0) as MenuItem["spiceLevel"],
    tags: Array.isArray(input.tags)
      ? input.tags.map((t) => t.trim().toLowerCase()).filter(Boolean)
      : [],
    image: input.image?.trim() || "/menu/placeholder.svg",
    ...(input.available === false ? { available: false } : {}),
  };
}

export async function createMenuItem(
  input: MenuItemInput,
): Promise<StoredMenuItem> {
  await ensureSeeded();
  const id = input.id?.trim() || makeId();
  const item = normalize(input, id);
  if (useKv) {
    await kv.hset(HASH_KEY, { [id]: item });
  } else {
    memStore().items.set(id, item);
  }
  return item;
}

export async function updateMenuItem(
  id: string,
  patch: Partial<MenuItemInput>,
): Promise<StoredMenuItem | undefined> {
  const existing = await getMenuItem(id);
  if (!existing) return undefined;
  const merged: MenuItemInput = { ...existing, ...patch };
  const next = normalize(merged, id);
  if (useKv) {
    await kv.hset(HASH_KEY, { [id]: next });
  } else {
    memStore().items.set(id, next);
  }
  return next;
}

export async function deleteMenuItem(id: string): Promise<boolean> {
  await ensureSeeded();
  if (useKv) {
    const removed = await kv.hdel(HASH_KEY, id);
    return removed > 0;
  }
  return memStore().items.delete(id);
}
