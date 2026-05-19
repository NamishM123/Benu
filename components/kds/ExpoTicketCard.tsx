"use client";

import { removeOrder, updateOrder, type Order } from "@/lib/order-store";
import {
  STATIONS,
  ageSeconds,
  orderAllergens,
  secondsUntilPromise,
  stationForLine,
  stationProgress,
  ticketStatus,
  type StationId,
} from "@/lib/kds";
import type { CartLine } from "@/lib/cart-store";
import { cartLineName } from "@/lib/cart-store";
import type { Lang } from "@/lib/i18n";
import ChannelPill from "./ChannelPill";
import { BoltIcon, CheckIcon, RotateIcon, WarnIcon, XIcon } from "./Icons";

function fmtSeconds(s: number): string {
  if (!Number.isFinite(s)) return "–";
  const sign = s < 0 ? "-" : "";
  const abs = Math.abs(Math.round(s));
  const m = Math.floor(abs / 60);
  const r = abs % 60;
  return `${sign}${m}:${String(r).padStart(2, "0")}`;
}

function ProgressPill({ done, total }: { done: number; total: number }) {
  const ready = done === total && total > 0;
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={`block h-1.5 w-3.5 rounded-full ${
              i < done ? "bg-sage-kds-dark" : "bg-neutral-200"
            }`}
          />
        ))}
      </div>
      <span
        className={`text-[10px] font-semibold uppercase tracking-wider tabular-nums ${
          ready ? "text-sage-kds-dark" : "text-neutral-500"
        }`}
      >
        {done}/{total}
      </span>
    </div>
  );
}

function StatusBadge({
  order,
  checked,
}: {
  order: Order;
  checked: Set<string>;
}) {
  const status = ticketStatus(order, checked);
  const stationsDone: string[] = [];
  const stationsActive: string[] = [];
  for (const s of STATIONS) {
    const p = stationProgress(order, s.id, checked);
    if (p.total === 0) continue;
    if (p.done === p.total) stationsDone.push(s.shortName);
    else stationsActive.push(s.shortName);
  }
  let bg = "bg-neutral-100";
  let text = "text-neutral-600";
  let label: string = "All queued";

  if (status === "ready-to-plate") {
    bg = "bg-sage-kds/40";
    text = "text-sage-kds-dark";
    label = "Ready to plate";
  } else if (status === "partial") {
    bg = "bg-butter-kds-soft";
    text = "text-butter-kds-deep";
    label =
      stationsDone.length && stationsActive.length
        ? `${stationsDone.join(" & ")} done · wait ${stationsActive.join(" & ")}`
        : "Partial";
  } else if (order.status === "cooking") {
    bg = "bg-red-50";
    text = "text-red-700";
    label = "All cooking";
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${bg} ${text}`}
    >
      {label}
    </span>
  );
}

function Timer({ order }: { order: Order }) {
  const fired = order.status === "cooking" || order.status === "ready";
  const past = secondsUntilPromise(order) < 0;
  if (!fired) {
    return (
      <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 tabular-nums">
        in {fmtSeconds(secondsUntilPromise(order))}
      </span>
    );
  }
  return (
    <div className="flex items-center gap-1">
      <span className="block h-1.5 w-1.5 rounded-full bg-butter-kds-deep animate-pulse-dot" />
      <span
        className={`text-[16px] font-bold tabular-nums ${past ? "text-red-700" : "text-neutral-900"}`}
      >
        {fmtSeconds(ageSeconds(order))}
      </span>
    </div>
  );
}

export default function ExpoTicketCard({
  order,
  checked,
  lang,
  onToggleLine,
}: {
  order: Order;
  checked: Set<string>;
  lang: Lang;
  onToggleLine: (orderId: string, lineId: string) => void;
}) {
  const status = ticketStatus(order, checked);
  const allergens = orderAllergens(order);
  const allergen = allergens.length > 0;

  const byStation = new Map<StationId, CartLine[]>();
  for (const l of order.lines) {
    const s = stationForLine(l);
    const arr = byStation.get(s) ?? [];
    arr.push(l);
    byStation.set(s, arr);
  }
  const stations = STATIONS.map((s) => s.id).filter((id) => byStation.has(id));

  const leftEdge =
    status === "ready-to-plate"
      ? "border-l-[5px] border-l-sage-kds-dark"
      : status === "partial"
        ? "border-l-[5px] border-l-butter-kds"
        : order.status === "cooking"
          ? "border-l-[5px] border-l-red-400"
          : "border-l-[5px] border-l-neutral-200";
  const ring = allergen ? "ring-2 ring-red-300" : "ring-1 ring-kds-cream-deep/70";

  const ticketShort =
    order.ticketNumber !== undefined
      ? String(order.ticketNumber).padStart(4, "0")
      : order.id.slice(0, 4).toUpperCase();

  return (
    <article
      className={`flex flex-col overflow-hidden rounded-[22px] bg-white shadow-card ${ring} ${leftEdge}`}
    >
      {/* HEAD */}
      <div className="flex items-center justify-between gap-2 border-b border-neutral-100 px-4 pb-2.5 pt-3">
        <div className="flex min-w-0 items-center gap-2">
          <ChannelPill channel="dine" size="sm" />
          {order.priority && (
            <span className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-red-700">
              <BoltIcon className="h-2.5 w-2.5" /> Rush
            </span>
          )}
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-serif text-[26px] leading-none text-neutral-900">
            T {order.tableNumber ?? "—"}
          </span>
          <span className="text-[11px] tabular-nums text-neutral-500">
            #{ticketShort}
          </span>
        </div>
        <Timer order={order} />
      </div>

      {/* META */}
      <div className="flex items-center justify-between border-b border-neutral-100 bg-cream-light/40 px-4 py-1.5">
        <span className="truncate text-[12px] text-neutral-600">
          {order.lines.reduce((s, l) => s + l.quantity, 0)} items ·{" "}
          {order.lines.length} dishes
        </span>
        <StatusBadge order={order} checked={checked} />
      </div>

      {allergen && (
        <div className="mx-4 mt-3 inline-flex items-center gap-1.5 rounded-md border border-red-300 bg-red-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-red-700">
          <WarnIcon className="h-3 w-3" /> Allergen on ticket —{" "}
          {allergens.join(", ").toLowerCase()}
        </div>
      )}

      {/* BODY — items grouped by station */}
      <div className="flex flex-1 flex-col gap-3 px-4 py-3">
        {stations.map((s) => {
          const lines = byStation.get(s) ?? [];
          const done = lines.filter((l) => checked.has(l.id)).length;
          return (
            <div key={s} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
                  {STATIONS.find((st) => st.id === s)?.name}
                </div>
                <ProgressPill done={done} total={lines.length} />
              </div>
              {lines.map((line) => {
                const struck = checked.has(line.id);
                return (
                  <div
                    key={line.id}
                    className="grid cursor-pointer select-none grid-cols-[auto_1fr] items-baseline gap-x-2.5"
                    onClick={() => onToggleLine(order.id, line.id)}
                  >
                    <span
                      className={`min-w-[1.5ch] text-[20px] font-bold leading-none tabular-nums text-neutral-900 ${
                        struck ? "opacity-40" : ""
                      }`}
                    >
                      {line.quantity}
                    </span>
                    <span
                      className={`truncate text-[13px] font-semibold uppercase tracking-[0.05em] ${
                        struck
                          ? "text-neutral-400 line-through"
                          : "text-neutral-900"
                      }`}
                    >
                      {cartLineName(line, lang)}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* FOOT */}
      <div className="flex items-center gap-2 border-t border-neutral-100 px-3 py-3">
        {status === "ready-to-plate" ? (
          <button
            type="button"
            onClick={() => updateOrder(order.id, { status: "ready" })}
            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-sage-kds-dark text-[13px] font-medium text-cream"
          >
            <CheckIcon className="h-4 w-4" /> Send to pass
          </button>
        ) : (
          <button
            type="button"
            onClick={() => updateOrder(order.id, { priority: !order.priority })}
            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-full bg-neutral-900 text-[13px] font-medium text-cream hover:bg-neutral-800"
          >
            <BoltIcon className="h-4 w-4" />{" "}
            {order.priority ? "Clear rush" : "Rush"}
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            if (order.status === "cooking") {
              updateOrder(order.id, { status: "new" });
            }
          }}
          className="grid h-10 w-10 place-items-center rounded-full border border-neutral-300 text-neutral-600 hover:bg-neutral-50"
          aria-label="Recall"
          title="Recall"
        >
          <RotateIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => {
            if (confirm(`Void ticket T ${order.tableNumber}?`)) {
              void removeOrder(order.id);
            }
          }}
          className="grid h-10 w-10 place-items-center rounded-full border border-neutral-300 text-neutral-600 hover:bg-neutral-50"
          aria-label="Void"
          title="Void"
        >
          <XIcon className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}
