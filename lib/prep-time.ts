import { MENU, type MenuItem } from "./menu";
import type { CartLine } from "./cart-store";

const ITEMS_BY_NAME: Record<string, MenuItem> = (() => {
  const map: Record<string, MenuItem> = {};
  for (const m of MENU) map[m.name] = m;
  return map;
})();

const CATEGORY_BASE_MINUTES: Record<string, number> = {
  Beverages: 1,
  Appetizers: 5,
  Rice: 8,
  "Dry Noodles": 10,
  "Noodle Soup": 12,
};

const COLD_APPETIZERS = new Set([
  "Garlic Cucumber",
  "Chili Oil Potato Salad",
  "Yuba with Celery Salad",
  "House Cold Cut Beef",
]);

const TAG_BONUS: Record<string, number> = {
  beef: 2,
  lamb: 2,
  pork: 1,
  chicken: 1,
};

// How many of the same dish can share a wok / pot.
const BATCH_SIZE = 3;

// Hot-dish parallelism: when multiple hot dishes are in one order, only this
// fraction of additional hot-dish time stacks on top of the longest dish.
const HOT_PARALLEL_FACTOR = 0.55;

// Per active order ahead of this one in the queue.
const QUEUE_DELAY_PER_ORDER = 3;
const QUEUE_DELAY_CAP = 12;

// Final plating / tray-up.
const PLATING_BUFFER = 1;

const MIN_ETA = 3;

function isCold(item: MenuItem): boolean {
  if (item.category === "Beverages") return true;
  if (item.category === "Appetizers" && COLD_APPETIZERS.has(item.name)) {
    return true;
  }
  return false;
}

function lineMinutes(line: CartLine): { minutes: number; cold: boolean } {
  const item = ITEMS_BY_NAME[line.itemName];
  if (!item) {
    return { minutes: 6, cold: false };
  }
  const base = CATEGORY_BASE_MINUTES[item.category] ?? 6;
  const tagBonus = item.tags.reduce(
    (max, tag) => Math.max(max, TAG_BONUS[tag] ?? 0),
    0,
  );
  const perPortion = base + tagBonus;
  const batches = Math.max(1, Math.ceil(line.quantity / BATCH_SIZE));
  return {
    minutes: perPortion * batches,
    cold: isCold(item),
  };
}

export function estimateOrderMinutes(
  lines: CartLine[],
  activeOrdersAhead = 0,
): number {
  if (lines.length === 0) return MIN_ETA;

  const perLine = lines.map(lineMinutes);
  const hot = perLine.filter((l) => !l.cold).map((l) => l.minutes);
  const cold = perLine.filter((l) => l.cold).map((l) => l.minutes);

  let cookTime = 0;
  if (hot.length > 0) {
    const longest = Math.max(...hot);
    const rest = hot.reduce((s, m) => s + m, 0) - longest;
    cookTime = longest + rest * HOT_PARALLEL_FACTOR;
  }
  if (cold.length > 0) {
    const coldMax = Math.max(...cold);
    cookTime = Math.max(cookTime, coldMax);
  }

  const queueDelay = Math.min(
    QUEUE_DELAY_CAP,
    Math.max(0, activeOrdersAhead) * QUEUE_DELAY_PER_ORDER,
  );

  const total = cookTime + queueDelay + PLATING_BUFFER;
  return Math.max(MIN_ETA, Math.round(total));
}

export const TABLE_COUNT = 11;
