import { NextResponse } from "next/server";
import {
  appendSimulatedArchive,
  clearSimulatedArchive,
  type ArchivedOrder,
} from "@/lib/server-orders";
import { TABLE_COUNT } from "@/lib/prep-time";

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

function makeId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// Pick an index from `weights` proportional to its value.
function weightedPick(weights: number[]): number {
  const sum = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * sum;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return weights.length - 1;
}

function generateRecords(count: number, daysBack: number): ArchivedOrder[] {
  const now = Date.now();
  const out: ArchivedOrder[] = [];
  for (let i = 0; i < count; i++) {
    const daysAgo = Math.floor(Math.random() * daysBack);
    const baseDay = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
    // Resample target day-of-week according to weights — shift the base day
    // forward/backward up to a few days to land on a busier weekday more often.
    const targetDow = weightedPick(DAY_WEIGHTS);
    const dowDelta = ((targetDow - baseDay.getDay()) + 7) % 7;
    baseDay.setDate(baseDay.getDate() + dowDelta - 3);
    if (baseDay.getTime() > now) continue;
    const hour = weightedPick(HOUR_WEIGHTS);
    const minute = Math.floor(Math.random() * 60);
    baseDay.setHours(hour, minute, Math.floor(Math.random() * 60), 0);
    if (baseDay.getTime() > now) continue;
    out.push({
      id: `sim-${makeId()}`,
      placedAt: baseDay.getTime(),
      tableNumber: 1 + Math.floor(Math.random() * TABLE_COUNT),
      lineCount: 1 + Math.floor(Math.random() * 4),
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
  const records = generateRecords(count, days);
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
