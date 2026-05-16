import type { Order } from "@/lib/order-store";
import type { CartLine } from "@/lib/cart-store";

export type Station = "wok" | "cold" | "drinks" | "bar";
export type StationFilter = "all" | Station;

export const STATION_ORDER: Station[] = ["wok", "cold", "drinks", "bar"];

export const STATION_LABEL: Record<Station, string> = {
  wok: "Wok",
  cold: "Cold",
  drinks: "Drinks",
  bar: "Bar",
};

// Ring + chip + dot all share a single hue per station so a glance from
// across the line maps colour → station without re-reading the badge.
export const STATION_COLOR: Record<Station, { bg: string; fg: string; ring: string; dot: string }> = {
  wok:    { bg: "bg-orange-500/15",  fg: "text-orange-300",  ring: "ring-orange-500/40",  dot: "bg-orange-400" },
  cold:   { bg: "bg-cyan-500/15",    fg: "text-cyan-300",    ring: "ring-cyan-500/40",    dot: "bg-cyan-400" },
  drinks: { bg: "bg-violet-500/15",  fg: "text-violet-300",  ring: "ring-violet-500/40",  dot: "bg-violet-400" },
  bar:    { bg: "bg-pink-500/15",    fg: "text-pink-300",    ring: "ring-pink-500/40",    dot: "bg-pink-400" },
};

export type Urgency = "fresh" | "warn" | "overdue";

export type OrderType =
  | { kind: "dine-in"; tableNumber: number }
  | { kind: "takeout" }
  | { kind: "delivery"; platform: string };

// Derived per-line view used by the cards. Wraps the raw CartLine and adds
// kitchen-only concerns (station, allergens, mods, completion state).
export type KdsLine = {
  raw: CartLine;
  station: Station;
  allergens: string[];
  modifications: string[];
  done: boolean;
};

export type KdsOrder = {
  raw: Order;
  ticketLabel: string;
  type: OrderType;
  lines: KdsLine[];
  elapsedMin: number;
  urgency: Urgency;
  // Stations represented by *unfinished* lines on this ticket. Drives the
  // station filter visibility — a half-bumped ticket shouldn't block its
  // station from filtering away.
  activeStations: Station[];
  allDone: boolean;
};

export type RecallEntry = {
  order: Order;
  bumpedAt: number;
};
