// Kitchen Display System utilities. These take the existing Order + CartLine
// shapes and derive station routing, priority, allergen flags, and modifier
// tiers without changing the underlying data model. Everything is computed
// on the client so the customer-facing order flow stays untouched.

import type { Order } from "./order-store";
import type { CartLine } from "./cart-store";

// ─── Stations ────────────────────────────────────────────────────────────

export type StationId = "wok" | "broth" | "cold" | "bar" | "expo";

export type Station = {
  id: StationId;
  name: string;
  shortName: string;
};

export const STATIONS: Station[] = [
  { id: "wok", name: "Wok", shortName: "Wok" },
  { id: "broth", name: "Broth", shortName: "Broth" },
  { id: "cold", name: "Cold", shortName: "Cold" },
  { id: "bar", name: "Bar", shortName: "Bar" },
];

// Items the cold station handles (no heat). Everything else in Appetizers
// goes to the wok / fryer; for Shake Shake's small menu we fold the fryer
// into the wok station so the line cook owns all hot apps.
const COLD_ITEM_NAMES = new Set([
  "Garlic Cucumber",
  "Chili Oil Potato Salad",
  "Yuba with Celery Salad",
  "House Cold Cut Beef",
]);

export function stationForLine(line: CartLine): StationId {
  const name = line.itemName;
  if (COLD_ITEM_NAMES.has(name)) return "cold";

  // Match common category keywords in the item name as a fallback when no
  // explicit menu category is available on the line.
  const lower = name.toLowerCase();
  if (lower.includes("soup") || lower.includes("noodle soup") || lower.includes("broth")) {
    return "broth";
  }
  if (
    lower.includes("tea") ||
    lower.includes("coffee") ||
    lower.includes("latte") ||
    lower.includes("juice") ||
    lower.includes("coke") ||
    lower.includes("sprite") ||
    lower.includes("water") ||
    lower.includes("lemonade") ||
    lower.includes("milk") ||
    lower.includes("matcha") ||
    lower.includes("soda") ||
    lower.includes("sparkling")
  ) {
    return "bar";
  }
  // Everything else (dry noodles, rice, fried appetizers) is wok.
  return "wok";
}

// ─── Modifier classification ─────────────────────────────────────────────

export type ModifierKind = "standard" | "preference" | "allergen";

export type ClassifiedModifier = {
  text: string;
  kind: ModifierKind;
};

// Customer-side preference labels that map to real allergens. Compared
// case-insensitively against order.preferences AND any line specialRequest.
const ALLERGEN_LABELS = new Set([
  "dairy",
  "nuts",
  "peanut",
  "peanuts",
  "soy",
  "gluten",
  "wheat",
  "fish",
  "shellfish",
  "seafood",
  "egg",
  "eggs",
  "sesame",
]);

// Choice labels that signal an explicit customer preference (worth highlighting
// in cantaloupe) vs. defaults. Anything ending in "Extra ..." / "No ..." /
// "Less ..." reads as the customer expressing themselves.
const PREFERENCE_PREFIXES = [
  "extra ",
  "no ",
  "less ",
  "without ",
  "hold ",
  "skip ",
];
const DEFAULT_CHOICE_TEXTS = new Set([
  "regular",
  "regular ice",
  "regular sugar",
  "regular sweet",
  "whole milk",
  "medium",
  "default",
]);

function looksLikeAllergenText(text: string): boolean {
  const lower = text.toLowerCase();
  if (lower.includes("allerg")) return true;
  if (lower.includes("intoleran")) return true;
  if (/\b(no|without|hold the|skip the)\s+(peanut|nut|nuts|soy|dairy|milk|gluten|wheat|fish|shellfish|egg|sesame|cilantro)/i.test(text)) {
    // "no peanut" is a hard exclusion but not always a true allergy. Be
    // cautious: we treat it as a preference, NOT an allergen, unless the
    // word "allerg" is present. Allergen ticket flags come from preferences.
    return false;
  }
  return false;
}

function looksLikePreferenceChoice(text: string): boolean {
  const lower = text.toLowerCase().trim();
  if (DEFAULT_CHOICE_TEXTS.has(lower)) return false;
  for (const p of PREFERENCE_PREFIXES) {
    if (lower.startsWith(p)) return true;
  }
  // "Extra Spicy", "Soft-Boiled Egg" etc.
  if (lower.startsWith("extra")) return true;
  return false;
}

// Build the ordered list of modifiers for one line, with allergen flags
// merged from order-level preferences.
export function classifyLineModifiers(
  line: CartLine,
  orderAllergens: string[],
): ClassifiedModifier[] {
  const out: ClassifiedModifier[] = [];

  for (const sel of line.selections) {
    for (const choice of sel.choiceLabels) {
      const lower = choice.toLowerCase().trim();
      if (DEFAULT_CHOICE_TEXTS.has(lower)) continue; // hide pure defaults
      const kind: ModifierKind = looksLikePreferenceChoice(choice)
        ? "preference"
        : "standard";
      out.push({ text: choice, kind });
    }
  }

  if (line.specialRequest && line.specialRequest.trim() !== "") {
    const isAllergen = looksLikeAllergenText(line.specialRequest);
    out.push({
      text: line.specialRequest.trim(),
      kind: isAllergen ? "allergen" : "preference",
    });
  }

  // If the order is flagged with an allergen and the line contains an
  // ingredient that matches, push an allergen-tier badge into this line.
  // This is a coarse hint — the cook still owns the call.
  if (orderAllergens.length > 0) {
    const itemLower = line.itemName.toLowerCase();
    for (const allergen of orderAllergens) {
      const lc = allergen.toLowerCase();
      if (
        (lc === "dairy" && /milk|cheese|butter|cream|yogurt/i.test(itemLower)) ||
        (lc === "soy" && /soy|tofu|edamame/i.test(itemLower)) ||
        (lc === "nuts" && /nut|peanut|almond|cashew/i.test(itemLower)) ||
        (lc === "gluten" && /noodle|wheat|bread|dumpling|bao/i.test(itemLower)) ||
        (lc === "fish" && /fish|shrimp|seafood/i.test(itemLower)) ||
        (lc === "meat" && /chicken|beef|pork|lamb/i.test(itemLower)) ||
        (lc === "egg" && /egg/i.test(itemLower))
      ) {
        out.push({
          text: `${allergen.toUpperCase()} ALLERGY`,
          kind: "allergen",
        });
        break;
      }
    }
  }

  return out;
}

// ─── Allergen detection ──────────────────────────────────────────────────

// Read the order-level preferences and the per-line special requests to
// decide whether this ticket carries a real allergen warning that should
// gate the bump action.
export function orderAllergens(order: Order): string[] {
  const out = new Set<string>();
  for (const p of order.preferences) {
    if (ALLERGEN_LABELS.has(p.toLowerCase())) out.add(p);
  }
  for (const line of order.lines) {
    if (line.specialRequest && /\ballerg/i.test(line.specialRequest)) {
      // Try to extract the allergen word
      const m = line.specialRequest.match(/\b(peanut|nut|nuts|soy|dairy|milk|gluten|wheat|fish|shellfish|egg|sesame|cilantro|cilantro)\b/i);
      out.add(m ? m[1] : "allergy");
    }
  }
  return [...out];
}

export function hasAllergen(order: Order): boolean {
  return orderAllergens(order).length > 0;
}

// ─── Promise time and timer helpers ──────────────────────────────────────

export function promiseTimestamp(order: Order): number {
  const eta = order.etaMinutes ?? 8;
  return order.placedAt + eta * 60_000;
}

export function secondsUntilPromise(order: Order, now: number = Date.now()): number {
  return Math.round((promiseTimestamp(order) - now) / 1000);
}

export function isOverPromise(order: Order, now: number = Date.now()): boolean {
  return secondsUntilPromise(order, now) < 0;
}

export function ageSeconds(order: Order, now: number = Date.now()): number {
  return Math.max(0, Math.floor((now - order.placedAt) / 1000));
}

// ─── Station-level filtering ─────────────────────────────────────────────

export function linesForStation(order: Order, station: StationId): CartLine[] {
  return order.lines.filter((l) => stationForLine(l) === station);
}

export function ticketTouchesStation(order: Order, station: StationId): boolean {
  return order.lines.some((l) => stationForLine(l) === station);
}

export function ticketStations(order: Order): StationId[] {
  const set = new Set<StationId>();
  for (const l of order.lines) set.add(stationForLine(l));
  return STATIONS.map((s) => s.id).filter((id) => set.has(id));
}

// ─── Priority algorithm (station view) ───────────────────────────────────

// Returns a numeric score. Higher = more urgent for this station to fire next.
export function stationPriority(
  order: Order,
  station: StationId,
  now: number = Date.now(),
): number {
  const stationLines = linesForStation(order, station);
  if (stationLines.length === 0) return 0;
  if (order.status === "ready") return 0;

  const secs = secondsUntilPromise(order, now);
  // Closer to promise / over promise = higher urgency.
  const urgency = secs <= 0 ? 100 : Math.max(1, 600 - secs) / 6;

  let score = urgency;
  if (order.priority === true) score += 50;
  if (hasAllergen(order)) score += 15;
  if (order.status === "cooking") score += 20; // finish what's started
  if (order.preferences.includes("dine-in")) score += 5;

  return score;
}

export type NextRecommendation = {
  order: Order;
  reason: string;
} | null;

export function nextForStation(
  orders: Order[],
  station: StationId,
  now: number = Date.now(),
): NextRecommendation {
  const pool = orders
    .filter((o) => ticketTouchesStation(o, station))
    .filter((o) => o.status === "new" || o.status === "cooking")
    .map((o) => ({ o, score: stationPriority(o, station, now) }))
    .sort((a, b) => b.score - a.score);

  if (pool.length === 0) return null;
  const top = pool[0];
  if (pool.length > 1) {
    const second = pool[1];
    if (top.score < second.score * 1.3 && top.score < 80) {
      return null; // "all clear, work the queue"
    }
  }

  const secs = secondsUntilPromise(top.o, now);
  let reason: string;
  if (secs < 0) {
    reason = `${Math.round(-secs / 60)} min over promise`;
  } else if (secs < 90) {
    reason = `${secs}s from promise, fire now`;
  } else if (top.o.priority) {
    reason = `priority ticket from server`;
  } else if (hasAllergen(top.o)) {
    reason = `allergen ticket, handle next`;
  } else if (top.o.status === "cooking") {
    reason = `already firing, push to finish`;
  } else {
    reason = `oldest ticket on pace`;
  }

  return { order: top.o, reason };
}

// ─── Expo priority ───────────────────────────────────────────────────────

export type ExpoStatus = "all-cooking" | "partial" | "ready-to-plate";

export function ticketStatus(
  order: Order,
  checkedItems: Set<string>,
): ExpoStatus {
  if (order.status === "ready") return "ready-to-plate";
  const totalLines = order.lines.length;
  if (totalLines === 0) return "all-cooking";
  const doneCount = order.lines.filter((l) => checkedItems.has(l.id)).length;
  if (doneCount === 0) return "all-cooking";
  if (doneCount === totalLines) return "ready-to-plate";
  return "partial";
}

export function stationProgress(
  order: Order,
  station: StationId,
  checkedItems: Set<string>,
): { done: number; total: number } {
  const lines = linesForStation(order, station);
  return {
    done: lines.filter((l) => checkedItems.has(l.id)).length,
    total: lines.length,
  };
}

// ─── Kitchen load ────────────────────────────────────────────────────────

export type KitchenLoad = {
  score: number;
  level: 1 | 2 | 3 | 4 | 5;
  label: string;
  bgClass: string;
  textClass: string;
};

export function computeKitchenLoad(
  orders: Order[],
  cooksOnShift: number = 3,
  now: number = Date.now(),
): KitchenLoad {
  const open = orders.filter(
    (o) => o.status === "new" || o.status === "cooking",
  );
  const openCount = open.length;
  const avgAge =
    open.length === 0
      ? 0
      : open.reduce((sum, o) => sum + ageSeconds(o, now), 0) / open.length;
  const overPromise = open.filter((o) => isOverPromise(o, now)).length;

  const score =
    (avgAge / 60) * 0.4 +
    (openCount / Math.max(1, cooksOnShift)) * 0.3 +
    (overPromise / Math.max(1, openCount)) * 3.0;

  let level: KitchenLoad["level"];
  let label: string;
  let bgClass: string;
  let textClass: string;
  if (score < 1.5) {
    level = 1;
    label = "Calm";
    bgClass = "bg-sage-dark";
    textClass = "text-neutral-900";
  } else if (score < 3) {
    level = 2;
    label = "Steady";
    bgClass = "bg-sage-dark";
    textClass = "text-neutral-900";
  } else if (score < 5) {
    level = 3;
    label = "Busy";
    bgClass = "bg-butter";
    textClass = "text-neutral-900";
  } else if (score < 8) {
    level = 4;
    label = "Slammed";
    bgClass = "bg-cantaloupe";
    textClass = "text-neutral-900";
  } else {
    level = 5;
    label = "Drowning";
    bgClass = "bg-red-500";
    textClass = "text-white";
  }
  return { score, level, label, bgClass, textClass };
}

// ─── Station load ────────────────────────────────────────────────────────

export type StationLoad = "idle" | "normal" | "busy" | "slammed";

export function stationLoad(
  orders: Order[],
  station: StationId,
): { load: StationLoad; activeItems: number; avgAgeSeconds: number } {
  const items: { line: CartLine; order: Order }[] = [];
  for (const o of orders) {
    if (o.status !== "new" && o.status !== "cooking") continue;
    for (const l of o.lines) {
      if (stationForLine(l) === station) items.push({ line: l, order: o });
    }
  }
  const activeItems = items.length;
  const avgAge =
    items.length === 0
      ? 0
      : items.reduce((s, i) => s + ageSeconds(i.order), 0) / items.length;

  let load: StationLoad;
  if (activeItems === 0) load = "idle";
  else if (activeItems <= 3) load = "normal";
  else if (activeItems <= 6) load = "busy";
  else load = "slammed";

  return { load, activeItems, avgAgeSeconds: avgAge };
}

// ─── Voided handling ─────────────────────────────────────────────────────

// We don't have a server-side void concept yet; client tracks voided line ids
// in localStorage so the cook can hide an item without losing audit trail.

const VOID_KEY = "benu.kds.voided";

export function loadVoided(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(VOID_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

export function saveVoided(set: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(VOID_KEY, JSON.stringify([...set]));
  } catch {
    // ignore
  }
}

// ─── 90-second hold ──────────────────────────────────────────────────────

const HOLD_KEY = "benu.kds.hold";

export type HoldState = {
  station: StationId;
  startedAt: number;
  durationMs: number;
};

export function loadHold(): HoldState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(HOLD_KEY);
    if (!raw) return null;
    const h = JSON.parse(raw) as HoldState;
    if (Date.now() - h.startedAt > h.durationMs) return null;
    return h;
  } catch {
    return null;
  }
}

export function saveHold(h: HoldState | null): void {
  if (typeof window === "undefined") return;
  try {
    if (h === null) window.localStorage.removeItem(HOLD_KEY);
    else window.localStorage.setItem(HOLD_KEY, JSON.stringify(h));
  } catch {
    // ignore
  }
}

// ─── View persistence ────────────────────────────────────────────────────

export type ViewMode = { kind: "station"; station: StationId } | { kind: "expo" } | { kind: "all" };

const VIEW_KEY = "benu.kds.view";

export function loadView(): ViewMode {
  if (typeof window === "undefined") return { kind: "all" };
  try {
    const raw = window.localStorage.getItem(VIEW_KEY);
    if (!raw) return { kind: "all" };
    const v = JSON.parse(raw) as ViewMode;
    if (v.kind === "station" || v.kind === "expo" || v.kind === "all") return v;
    return { kind: "all" };
  } catch {
    return { kind: "all" };
  }
}

export function saveView(v: ViewMode): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(VIEW_KEY, JSON.stringify(v));
  } catch {
    // ignore
  }
}
