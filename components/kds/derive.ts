import type { Order } from "@/lib/order-store";
import type { CartLine } from "@/lib/cart-store";
import type { MenuItem } from "@/lib/menu";
import type { KdsLine, KdsOrder, OrderType, Station, Urgency } from "./types";

const ALLERGEN_TAGS = new Set([
  "gluten",
  "soy",
  "egg",
  "dairy",
  "peanut",
  "tree-nut",
  "shellfish",
  "fish",
  "sesame",
]);

// The categories on the menu map cleanly to stations. "Bar" doesn't exist
// in the seed data; if the menu later grows alcoholic items tagged "alcohol"
// they'll route there.
function stationForCategory(category: string | undefined, tags: string[]): Station {
  if (tags.includes("alcohol")) return "bar";
  switch (category) {
    case "Appetizers":
      return "cold";
    case "Beverages":
      return "drinks";
    case "Dry Noodles":
    case "Noodle Soup":
    case "Rice":
      return "wok";
    default:
      return "wok";
  }
}

type MenuLookup = Map<string, MenuItem & { id: string }>;

export function buildMenuLookup(items: (MenuItem & { id: string })[]): MenuLookup {
  const m = new Map<string, MenuItem & { id: string }>();
  for (const it of items) m.set(it.name.toLowerCase(), it);
  return m;
}

function deriveAllergens(line: CartLine, menu: MenuLookup): string[] {
  const item = menu.get(line.itemName.toLowerCase());
  if (!item) return [];
  return item.tags.filter((t) => ALLERGEN_TAGS.has(t));
}

// Selections + special request both count as modifications worth flagging
// to the cook. Selections are e.g. spice level, noodle type — anything the
// guest deliberately chose.
function deriveMods(line: CartLine): string[] {
  const out: string[] = [];
  for (const sel of line.selections) {
    if (sel.choiceLabels.length === 0) continue;
    out.push(`${sel.groupLabel}: ${sel.choiceLabels.join(", ")}`);
  }
  if (line.specialRequest && line.specialRequest.trim()) {
    out.push(`Note: ${line.specialRequest.trim()}`);
  }
  return out;
}

function urgencyFor(elapsedMin: number): Urgency {
  if (elapsedMin >= 10) return "overdue";
  if (elapsedMin >= 5) return "warn";
  return "fresh";
}

// Order type is currently always dine-in in the data model. We synthesize
// takeout / delivery types for tickets whose tableNumber lands in a
// reserved range, so the visual distinction can be exercised end-to-end
// without a backend change. Real future work: add `orderType` to the Order
// schema and replace this.
function deriveType(order: Order): OrderType {
  const t = order.tableNumber;
  if (t === 99) return { kind: "takeout" };
  if (t === 98) return { kind: "delivery", platform: "DoorDash" };
  if (t === 97) return { kind: "delivery", platform: "Uber Eats" };
  return { kind: "dine-in", tableNumber: t };
}

function ticketLabelFor(order: Order): string {
  return order.ticketNumber !== undefined
    ? String(order.ticketNumber).padStart(3, "0")
    : order.id.slice(0, 6).toUpperCase();
}

export function buildKdsOrder(
  order: Order,
  menu: MenuLookup,
  doneLines: Set<string>,
  now: number,
): KdsOrder {
  const lines: KdsLine[] = order.lines.map((raw) => {
    const item = menu.get(raw.itemName.toLowerCase());
    return {
      raw,
      station: stationForCategory(item?.category, item?.tags ?? []),
      allergens: deriveAllergens(raw, menu),
      modifications: deriveMods(raw),
      done: doneLines.has(`${order.id}:${raw.id}`),
    };
  });
  const elapsedMin = Math.max(0, Math.floor((now - order.placedAt) / 60000));
  const activeStations = Array.from(
    new Set(lines.filter((l) => !l.done).map((l) => l.station)),
  );
  const allDone = lines.length > 0 && lines.every((l) => l.done);
  return {
    raw: order,
    ticketLabel: ticketLabelFor(order),
    type: deriveType(order),
    lines,
    elapsedMin,
    urgency: urgencyFor(elapsedMin),
    activeStations,
    allDone,
  };
}

// Most overdue first. Priority-flagged tickets jump ahead of their cohort.
// Within an urgency band we still respect the placement order so cooks see
// FIFO inside each band.
export function sortByUrgency(a: KdsOrder, b: KdsOrder): number {
  const pa = a.raw.priority === true ? 1 : 0;
  const pb = b.raw.priority === true ? 1 : 0;
  if (pa !== pb) return pb - pa;
  return b.elapsedMin - a.elapsedMin;
}
