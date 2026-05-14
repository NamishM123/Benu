import { NextResponse } from "next/server";
import {
  appendSimulatedArchive,
  clearSimulatedArchive,
  type ArchivedOrder,
  type ArchivedOrderItem,
} from "@/lib/server-orders";
import { TABLE_COUNT } from "@/lib/prep-time";
import { listMenuItems } from "@/lib/server-menu";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Lunch + dinner peaks, late-night tail (the spot is a noodle shop).
// Index = hour (0..23). Relative weight, not a probability.
const HOUR_WEIGHTS = [
  0.05, 0.02, 0.02, 0.02, 0.02, 0.05, 0.1, 0.2, 0.5, 0.9, 1.3, 2.0,
  3.5, 3.0, 1.5, 0.9, 0.8, 1.4, 3.0, 3.8, 3.2, 2.4, 1.5, 0.7,
];
// 0=Sun..6=Sat. Weekends and Friday slightly busier.
const DAY_WEIGHTS = [1.2, 0.7, 0.9, 1.0, 1.0, 1.4, 1.5];

// Seeded so every call generates the same dataset. Idempotent overwrite into KV.
const SIM_SEED = 0x5e7;

// mulberry32 PRNG — small and adequate for visualization seed data.
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Stable per-item popularity multiplier derived from the item name. Same name
// always maps to the same weight, so "house specials" stay #1 across runs.
function nameWeight(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) {
    h = (Math.imul(h, 31) + name.charCodeAt(i)) | 0;
  }
  // Map hash to a multiplier in [0.4, 3.0] so the spread is wide but bounded.
  return 0.4 + (Math.abs(h) % 27) / 10;
}

function weightedPick(weights: number[], rng: () => number): number {
  const sum = weights.reduce((a, b) => a + b, 0);
  let r = rng() * sum;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return weights.length - 1;
}

function pickItems(
  weighted: { item: { name: string; category: string }; w: number }[],
  rng: () => number,
): ArchivedOrderItem[] {
  if (weighted.length === 0) return [];
  const lineCount = 1 + Math.floor(rng() * 3);
  const out: ArchivedOrderItem[] = [];
  const used = new Set<string>();
  for (let i = 0; i < lineCount && i < weighted.length; i++) {
    const totalW = weighted.reduce(
      (s, e) => s + (used.has(e.item.name) ? 0 : e.w),
      0,
    );
    if (totalW <= 0) break;
    let r = rng() * totalW;
    let picked: (typeof weighted)[number] | null = null;
    for (const e of weighted) {
      if (used.has(e.item.name)) continue;
      r -= e.w;
      if (r <= 0) {
        picked = e;
        break;
      }
    }
    if (!picked) picked = weighted[weighted.length - 1];
    used.add(picked.item.name);
    out.push({
      name: picked.item.name,
      quantity: 1 + Math.floor(rng() * 2),
    });
  }
  return out;
}

function generateRecords(
  count: number,
  daysBack: number,
  menu: { name: string; category: string }[],
  rng: () => number,
): ArchivedOrder[] {
  const categoryWeight: Record<string, number> = {
    "Noodle Soup": 3,
    "Dry Noodles": 2.5,
    Rice: 1.5,
    Appetizers: 1.5,
    Beverages: 1,
  };
  // Combine category weight with stable per-name popularity. Result is fixed
  // for a given menu, so the top items are identical across runs.
  const weighted = menu.map((m) => ({
    item: m,
    w: (categoryWeight[m.category] ?? 1) * nameWeight(m.name),
  }));

  const now = Date.now();
  const out: ArchivedOrder[] = [];
  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(rng() * daysBack);
    const baseDay = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
    const targetDow = weightedPick(DAY_WEIGHTS, rng);
    const dowDelta = ((targetDow - baseDay.getDay()) + 7) % 7;
    baseDay.setDate(baseDay.getDate() + dowDelta - 3);
    if (baseDay.getTime() > now) continue;
    const hour = weightedPick(HOUR_WEIGHTS, rng);
    const minute = Math.floor(rng() * 60);
    baseDay.setHours(hour, minute, Math.floor(rng() * 60), 0);
    if (baseDay.getTime() > now) continue;
    const items = pickItems(weighted, rng);
    out.push({
      id: `sim-${i}`,
      placedAt: baseDay.getTime(),
      tableNumber: 1 + Math.floor(rng() * TABLE_COUNT),
      lineCount: items.length || 1,
      items,
      simulated: true,
    });
  }
  return out;
}

export async function POST(req: Request) {
  let body: { count?: unknown; days?: unknown } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    // empty body is fine — use defaults
  }
  const count = clampInt(body.count, 200, 1, 5000);
  const days = clampInt(body.days, 30, 1, 365);
  const menu = await listMenuItems();
  const rng = mulberry32(SIM_SEED);
  const records = generateRecords(count, days, menu, rng);
  const added = await appendSimulatedArchive(records);
  return NextResponse.json({ added, count, days });
}

export async function DELETE() {
  const removed = await clearSimulatedArchive();
  return NextResponse.json({ removed });
}

function clampInt(v: unknown, fallback: number, min: number, max: number): number {
  if (typeof v !== "number" || !Number.isFinite(v)) return fallback;
  const n = Math.round(v);
  if (n < min) return min;
  if (n > max) return max;
  return n;
}
