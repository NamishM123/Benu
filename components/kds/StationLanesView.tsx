"use client";

import { useMemo } from "react";
import type { Order } from "@/lib/order-store";
import { updateOrder } from "@/lib/order-store";
import {
  STATIONS,
  ageSeconds,
  classifyLineModifiers,
  hasAllergen,
  laneForOrder,
  linesForStation,
  orderAllergens,
  otherStationsBlocking,
  secondsUntilPromise,
  stationForLine,
  type Lane,
  type StationId,
} from "@/lib/kds";
import { cartLineName } from "@/lib/cart-store";
import type { Lang } from "@/lib/i18n";
import { cues } from "@/lib/kds-audio";
import { BoltIcon, CheckIcon, FlameIcon, WarnIcon } from "./Icons";
import ChannelPill from "./ChannelPill";

function fmtSeconds(s: number): string {
  if (!Number.isFinite(s)) return "–";
  const sign = s < 0 ? "-" : "";
  const abs = Math.abs(Math.round(s));
  const m = Math.floor(abs / 60);
  const r = abs % 60;
  return `${sign}${m}:${String(r).padStart(2, "0")}`;
}

function ticketShortLabel(order: Order): string {
  return order.ticketNumber !== undefined
    ? String(order.ticketNumber).padStart(4, "0")
    : order.id.slice(0, 4).toUpperCase();
}

function tableLabel(order: Order): string {
  return String(order.tableNumber ?? "—");
}

function customerLine(order: Order): string {
  return `Table ${order.tableNumber} · ${order.lines.reduce((s, l) => s + l.quantity, 0)} items`;
}

function ChannelFromOrder(_order: Order): "dine" | "togo" | "delivery" {
  return "dine";
}

// ─── V3 ticket card ──────────────────────────────────────────────────────

export function LaneCard({
  order,
  station,
  lane,
  checked,
  lang,
  onToggleLine,
  isNext,
  onFire,
  onBump,
}: {
  order: Order;
  station: StationId;
  lane: Lane;
  checked: Set<string>;
  lang: Lang;
  onToggleLine: (orderId: string, lineId: string) => void;
  isNext: boolean;
  onFire: (order: Order) => void;
  onBump: (order: Order) => void;
}) {
  const stationLines = linesForStation(order, station);
  const others = otherStationsBlocking(order, station, checked);
  const allergens = orderAllergens(order);
  const allergen = allergens.length > 0;
  const promiseSecs = secondsUntilPromise(order);
  const past = promiseSecs < 0;

  const accent: Record<Lane, { ring: string; tick: string }> = {
    queue: {
      ring: isNext ? "ring-2 ring-cantaloupe" : "ring-1 ring-neutral-200",
      tick: "",
    },
    fire: {
      ring: "ring-1 ring-neutral-200",
      tick: "border-l-[5px] border-l-butter",
    },
    bumped: {
      ring: "ring-1 ring-neutral-200",
      tick: "border-l-[5px] border-l-sage-dark",
    },
    pass: {
      ring: "ring-2 ring-sage-dark",
      tick: "border-l-[5px] border-l-sage-dark",
    },
  };
  const a = accent[lane];

  const allergenRing = allergen ? "ring-2 ring-red-300" : "";

  // Timer: when firing, age since order is a proxy for "firedAt"
  const firedAt = order.status === "cooking" ? ageSeconds(order) : null;

  return (
    <article
      className={`overflow-hidden rounded-2xl bg-white shadow-sm ${a.ring} ${a.tick} ${allergenRing}`}
    >
      {/* HEAD */}
      <div className="flex items-center justify-between gap-2 px-3.5 pb-2 pt-3">
        <div className="flex items-baseline gap-2">
          <span className="font-serif text-[22px] leading-none text-neutral-900">
            T {tableLabel(order)}
          </span>
          <span className="text-[11px] tabular-nums text-neutral-500">
            #{ticketShortLabel(order)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {order.priority && (
            <span className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-red-700">
              <BoltIcon className="h-2.5 w-2.5" /> Rush
            </span>
          )}
          {lane === "fire" && firedAt !== null && (
            <span className="inline-flex items-center gap-1 text-[14px] font-bold tabular-nums">
              <span className="block h-1.5 w-1.5 rounded-full bg-butter-deep [animation:pulse-dot_1.4s_ease-in-out_infinite]" />
              <span className={past ? "text-red-700" : "text-neutral-900"}>
                {fmtSeconds(firedAt)}
              </span>
            </span>
          )}
          {lane === "queue" && (
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 tabular-nums">
              {past ? (
                <span className="text-red-700">
                  past · {fmtSeconds(-promiseSecs)}
                </span>
              ) : (
                `in ${fmtSeconds(promiseSecs)}`
              )}
            </span>
          )}
        </div>
      </div>

      {/* CHIPS */}
      <div className="flex flex-wrap items-center gap-2 px-3.5 pb-2">
        <ChannelPill channel={ChannelFromOrder(order)} size="sm" />
        <span className="flex-1 truncate text-[11px] text-neutral-500">
          {customerLine(order)}
        </span>
      </div>

      {allergen && (
        <div className="mx-3.5 mb-2 inline-flex items-center gap-1.5 rounded-md border border-red-300 bg-red-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-red-700">
          <WarnIcon className="h-3 w-3" />
          {allergens.join(" · ")} allergy
        </div>
      )}

      {/* ITEMS */}
      <div className="flex flex-col gap-2 border-t border-neutral-100 px-3.5 pb-3 pt-2.5">
        {stationLines.map((line) => {
          const mods = classifyLineModifiers(line, allergens);
          const struck = checked.has(line.id);
          return (
            <div
              key={line.id}
              className="grid cursor-pointer grid-cols-[auto_1fr] items-start gap-x-3 select-none"
              onClick={() => onToggleLine(order.id, line.id)}
            >
              <span
                className={`min-w-[1.5ch] text-[26px] font-bold leading-none tabular-nums text-neutral-900 ${
                  struck ? "opacity-40" : ""
                }`}
              >
                {line.quantity}
              </span>
              <div className="flex min-w-0 flex-col gap-0.5 pt-0.5">
                <span
                  className={`truncate text-[13px] font-semibold uppercase tracking-[0.05em] ${
                    struck
                      ? "text-neutral-400 line-through"
                      : "text-neutral-900"
                  }`}
                >
                  {cartLineName(line, lang)}
                </span>
                {mods
                  .filter((m) => m.kind !== "allergen")
                  .slice(0, 2)
                  .map((m, j) => (
                    <span
                      key={j}
                      className={`truncate text-[12px] ${
                        m.kind === "preference"
                          ? "font-medium text-cantaloupe-deep"
                          : "text-neutral-500"
                      }`}
                    >
                      {m.text}
                    </span>
                  ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer per lane */}
      <LaneFooter
        order={order}
        lane={lane}
        allergen={allergen}
        others={others}
        isNext={isNext}
        onFire={onFire}
        onBump={onBump}
      />
    </article>
  );
}

function LaneFooter({
  order,
  lane,
  allergen,
  others,
  isNext,
  onFire,
  onBump,
}: {
  order: Order;
  lane: Lane;
  allergen: boolean;
  others: { station: StationId; allDone: boolean }[];
  isNext: boolean;
  onFire: (o: Order) => void;
  onBump: (o: Order) => void;
}) {
  if (lane === "queue") {
    return (
      <div className="border-t border-neutral-100 px-3 pb-3 pt-1">
        <button
          type="button"
          onClick={() => onFire(order)}
          className={`inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full text-[13px] font-medium ${
            allergen
              ? "border-2 border-red-500 bg-red-50 text-red-700"
              : isNext
                ? "bg-cantaloupe text-cream"
                : "bg-neutral-900 text-cream hover:bg-neutral-800"
          }`}
        >
          {allergen ? (
            <>
              <WarnIcon className="h-3.5 w-3.5" /> Confirm &amp; Fire
            </>
          ) : (
            <>
              <FlameIcon className="h-3.5 w-3.5" /> Fire
            </>
          )}
        </button>
      </div>
    );
  }
  if (lane === "fire") {
    return (
      <div className="border-t border-neutral-100 px-3 pb-3 pt-1">
        <button
          type="button"
          onClick={() => onBump(order)}
          className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full bg-neutral-900 text-[13px] font-medium text-cream hover:bg-neutral-800"
        >
          <CheckIcon className="h-3.5 w-3.5" /> Bump
        </button>
      </div>
    );
  }
  if (lane === "bumped") {
    const waitingOn = others
      .filter((g) => !g.allDone)
      .map((g) => STATIONS.find((s) => s.id === g.station)?.shortName ?? g.station)
      .join(" + ") || "plating";
    return (
      <div className="border-t border-neutral-100 px-3.5 pb-3 pt-1">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
          <span className="block h-1.5 w-1.5 rounded-full bg-neutral-300 [animation:pulse-dot_1.4s_ease-in-out_infinite]" />
          Waiting on {waitingOn}
        </div>
      </div>
    );
  }
  return (
    <div className="border-t border-neutral-100 px-3 pb-3 pt-1">
      <button
        type="button"
        onClick={() => updateOrder(order.id, { status: "ready" })}
        className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full bg-sage-dark text-[13px] font-medium text-cream"
      >
        <CheckIcon className="h-3.5 w-3.5" /> Send to pass
      </button>
    </div>
  );
}

// ─── Lane column ─────────────────────────────────────────────────────────

function Lane({
  title,
  count,
  hint,
  accent,
  children,
}: {
  title: string;
  count: number;
  hint?: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-0 min-w-0 flex-col">
      <div
        className={`mb-3 flex items-center justify-between border-b-2 px-2 pb-2 ${accent}`}
      >
        <div className="flex items-baseline gap-2.5">
          <h2 className="font-serif text-[22px] leading-none text-neutral-900">
            {title}
          </h2>
          <span className="text-[12px] font-semibold uppercase tracking-wider text-neutral-500 tabular-nums">
            {count}
          </span>
        </div>
        {hint && (
          <span className="text-[11px] uppercase tracking-wider text-neutral-500">
            {hint}
          </span>
        )}
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
        {children}
        {count === 0 && (
          <div className="rounded-2xl border border-dashed border-neutral-200 px-3 py-6 text-center text-[12px] text-neutral-400">
            empty
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main view ───────────────────────────────────────────────────────────

export default function StationLanesView({
  orders,
  station,
  cookName,
  checked,
  lang,
  onToggleLine,
  isNextOrderId,
}: {
  orders: Order[];
  station: StationId;
  cookName?: string;
  checked: Record<string, Set<string>>;
  lang: Lang;
  onToggleLine: (orderId: string, lineId: string) => void;
  isNextOrderId: string | null;
}) {
  // Only show tickets that have items at this station (active only)
  const active = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.status !== "pending" &&
          o.status !== "ready" &&
          o.lines.some((l) => stationForLine(l) === station),
      ),
    [orders, station],
  );

  const ready = useMemo(
    () => orders.filter((o) => o.status === "ready"),
    [orders],
  );

  const lanes: Record<Lane, Order[]> = {
    queue: [],
    fire: [],
    bumped: [],
    pass: [],
  };
  for (const o of active) {
    const lane = laneForOrder(o, station, checked[o.id] ?? new Set());
    lanes[lane].push(o);
  }
  // The "pass" lane shows everything ready to plate, sourced from both
  // status=ready orders and ones whose lines are all checked.
  for (const o of ready) {
    if (!lanes.pass.find((x) => x.id === o.id)) lanes.pass.push(o);
  }

  // FIFO inside each lane; priority floats up
  for (const k of Object.keys(lanes) as Lane[]) {
    lanes[k].sort((a, b) => {
      if (!!a.priority !== !!b.priority) return a.priority ? -1 : 1;
      return a.placedAt - b.placedAt;
    });
  }

  function fire(order: Order) {
    if (order.status !== "cooking") {
      updateOrder(order.id, { status: "cooking" });
      cues.bumpConfirm();
    }
  }
  function bump(order: Order) {
    // Mark all this station's lines as bumped (checked).
    const stationLines = linesForStation(order, station);
    for (const l of stationLines) {
      if (!(checked[order.id] ?? new Set()).has(l.id)) {
        onToggleLine(order.id, l.id);
      }
    }
    cues.bumpConfirm();
  }

  const stationName = STATIONS.find((s) => s.id === station)?.name ?? station;

  return (
    <section
      className="rounded-3xl bg-cream p-1"
      data-screen-label={`V3 Station · ${stationName}`}
    >
      <div className="px-1 pb-3 pt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
        Lanes · {stationName}
        {cookName ? ` · ${cookName}` : ""}
      </div>

      <main className="grid min-h-[640px] grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <Lane
          title="Queue"
          count={lanes.queue.length}
          hint="unfired"
          accent="border-neutral-300"
        >
          {lanes.queue.map((o) => (
            <LaneCard
              key={o.id}
              order={o}
              station={station}
              lane="queue"
              checked={checked[o.id] ?? new Set()}
              lang={lang}
              onToggleLine={onToggleLine}
              isNext={isNextOrderId === o.id}
              onFire={fire}
              onBump={bump}
            />
          ))}
        </Lane>
        <Lane
          title="Firing"
          count={lanes.fire.length}
          hint="actively cooking"
          accent="border-butter"
        >
          {lanes.fire.map((o) => (
            <LaneCard
              key={o.id}
              order={o}
              station={station}
              lane="fire"
              checked={checked[o.id] ?? new Set()}
              lang={lang}
              onToggleLine={onToggleLine}
              isNext={isNextOrderId === o.id}
              onFire={fire}
              onBump={bump}
            />
          ))}
        </Lane>
        <Lane
          title="Bumped · waiting"
          count={lanes.bumped.length}
          hint="other stations"
          accent="border-sage"
        >
          {lanes.bumped.map((o) => (
            <LaneCard
              key={o.id}
              order={o}
              station={station}
              lane="bumped"
              checked={checked[o.id] ?? new Set()}
              lang={lang}
              onToggleLine={onToggleLine}
              isNext={isNextOrderId === o.id}
              onFire={fire}
              onBump={bump}
            />
          ))}
        </Lane>
        <Lane
          title="Ready · pass"
          count={lanes.pass.length}
          hint="all stations done"
          accent="border-sage-dark"
        >
          {lanes.pass.map((o) => (
            <LaneCard
              key={o.id}
              order={o}
              station={station}
              lane="pass"
              checked={checked[o.id] ?? new Set()}
              lang={lang}
              onToggleLine={onToggleLine}
              isNext={false}
              onFire={fire}
              onBump={bump}
            />
          ))}
        </Lane>
      </main>
    </section>
  );
}
