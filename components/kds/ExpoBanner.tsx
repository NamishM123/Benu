"use client";

import { updateOrder, type Order } from "@/lib/order-store";
import {
  bottleneckStations,
  mostUrgentOrder,
  secondsUntilPromise,
  STATIONS,
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
      <div className="px-6 pt-4 sm:px-10">
        <div className="flex items-center gap-5 rounded-[22px] border-2 border-sage-dark/40 bg-sage/20 px-5 py-3.5">
          <span className="inline-flex shrink-0 items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-sage-dark">
            <ArrowURIcon className="h-3.5 w-3.5" /> All clear
          </span>
          <p className="font-serif text-[18px] leading-tight text-neutral-700">
            No open tickets · kitchen is on pace
          </p>
        </div>
      </div>
    );
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

  return (
    <div className="px-6 pt-4 sm:px-10">
      <div className="flex flex-wrap items-center gap-5 rounded-[22px] border-2 border-cantaloupe bg-cantaloupe-soft/55 px-5 py-3.5">
        <span className="inline-flex shrink-0 items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-cantaloupe-deep">
          <ArrowURIcon className="h-3.5 w-3.5" /> Now
        </span>
        <p className="font-serif text-[20px] leading-tight text-neutral-900">
          <strong className="font-semibold">{headline}</strong>
          {worst && (
            <span className="text-neutral-700">
              {" "}
              · push{" "}
              {STATIONS.find((s) => s.id === worst.station)?.name ??
                worst.station}
            </span>
          )}
        </p>
        {worst && (
          <>
            <span className="mx-2 h-5 w-px bg-cantaloupe/50" />
            <p className="text-[13px] text-neutral-700">
              <span className="font-semibold text-cantaloupe-deep">
                {STATIONS.find((s) => s.id === worst.station)?.name ??
                  worst.station}{" "}
                backing up:
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
            urgent.priority
              ? updateOrder(urgent.id, { priority: false })
              : updateOrder(urgent.id, { priority: true })
          }
          className="ml-auto rounded-full bg-cantaloupe px-4 py-2 text-[13px] font-medium text-cream hover:opacity-90"
        >
          {urgent.priority ? `Clear rush ${tableLabel}` : `Rush ${tableLabel}`}
        </button>
      </div>
    </div>
  );
}
