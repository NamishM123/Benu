"use client";

import { updateOrder, type Order } from "@/lib/order-store";
import {
  bottleneckStations,
  mostUrgentOrder,
  secondsUntilPromise,
  STATIONS,
  stationProgress,
} from "@/lib/kds";
import { ArrowURIcon } from "./Icons";

function fmtAvg(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "–";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function ExpoBanner({ orders }: { orders: Order[] }) {
  const urgent = mostUrgentOrder(orders);
  const bottlenecks = bottleneckStations(orders);
  const worst = bottlenecks[0];

  if (!urgent) {
    return (
      <div className="px-6 pt-4 sm:px-8">
        <div className="flex items-center gap-5 rounded-[22px] border-2 border-sage-kds-dark/40 bg-sage-kds/30 px-5 py-3.5">
          <span className="inline-flex shrink-0 items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-sage-kds-dark">
            <ArrowURIcon className="h-3.5 w-3.5" /> All clear
          </span>
          <p className="font-serif text-[18px] leading-tight text-neutral-700">
            No open tickets · kitchen is on pace
          </p>
        </div>
      </div>
    );
  }

  // What stations have already finished for this ticket?
  const stationsDone: string[] = [];
  for (const s of STATIONS) {
    const p = stationProgress(urgent, s.id, new Set());
    if (p.total === 0) continue;
    // We don't have access to the checked map here, so done-status reads
    // from order.status when ready. Skip — handled by ticketStatus elsewhere.
  }

  const secs = secondsUntilPromise(urgent);
  const tableLabel = `T ${urgent.tableNumber ?? "—"}`;
  const past = secs < 0;
  const headline = past
    ? `${tableLabel} over promise`
    : secs < 120
      ? `${tableLabel} ${Math.round(secs)}s from promise`
      : urgent.priority
        ? `${tableLabel} rush from server`
        : `${tableLabel} on deck`;

  const worstName = worst
    ? STATIONS.find((s) => s.id === worst.station)?.name ?? worst.station
    : "";

  return (
    <div className="px-6 pt-4 sm:px-8">
      <div className="flex flex-wrap items-center gap-5 rounded-[22px] border-2 border-cantaloupe-kds bg-cantaloupe-kds-soft/55 px-5 py-3.5">
        <span className="inline-flex shrink-0 items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-cantaloupe-kds-deep">
          <ArrowURIcon className="h-3.5 w-3.5" /> Now
        </span>
        <p className="font-serif text-[20px] leading-tight text-neutral-900">
          <strong className="font-semibold">{headline}</strong>
          {worst && (
            <span className="text-neutral-700"> · push {worstName.toLowerCase()}</span>
          )}
        </p>
        {worst && (
          <>
            <span className="mx-2 h-5 w-px bg-cantaloupe-kds/50" />
            <p className="text-[13px] text-neutral-700">
              <span className="font-semibold text-cantaloupe-kds-deep">
                {worstName} backing up:
              </span>{" "}
              avg{" "}
              <span className="tabular-nums">
                {fmtAvg(worst.avgAgeSeconds)}
              </span>
              , {worst.activeItems} items open
            </p>
          </>
        )}
        <button
          type="button"
          onClick={() =>
            updateOrder(urgent.id, { priority: !urgent.priority })
          }
          className="ml-auto rounded-full bg-cantaloupe-kds px-4 py-2 text-[13px] font-medium text-cream hover:opacity-90"
        >
          {urgent.priority ? `Clear rush ${tableLabel}` : `Rush ${tableLabel}`}
        </button>
      </div>
    </div>
  );
}
