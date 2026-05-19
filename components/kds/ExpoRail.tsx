"use client";

import type { Order } from "@/lib/order-store";
import {
  STATIONS,
  allDayItems,
  bottleneckStations,
} from "@/lib/kds";
import { BoltIcon } from "./Icons";

function fmtAvg(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "–";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function ExpoRail({ orders }: { orders: Order[] }) {
  const allDay = allDayItems(orders).slice(0, 8);
  const bottlenecks = bottleneckStations(orders);

  return (
    <aside className="flex w-[300px] shrink-0 flex-col border-l border-cream-dark bg-cream-light/60">
      {/* All Day */}
      <div className="border-b border-cream-dark/70 px-5 pb-4 pt-5">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
          All Day · Kitchen
        </div>
        <div className="mt-3 flex flex-col gap-2">
          {allDay.length === 0 && (
            <div className="text-[12px] text-neutral-400">no active items</div>
          )}
          {allDay.map((r) => (
            <div
              key={`${r.station}-${r.name}`}
              className="flex items-baseline justify-between gap-2"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium uppercase tracking-[0.04em] text-neutral-800">
                  {r.name}
                </div>
                <div className="text-[10px] uppercase tracking-wider text-neutral-500">
                  {STATIONS.find((s) => s.id === r.station)?.name ?? r.station}
                </div>
              </div>
              <span className="font-serif text-2xl leading-none tabular-nums text-neutral-900">
                {r.qty}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Bottlenecks */}
      <div className="border-b border-cream-dark/70 px-5 py-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cantaloupe-deep">
            Bottlenecks
          </div>
          <span className="text-[10px] uppercase tracking-wider text-neutral-500">
            vs baseline
          </span>
        </div>
        {bottlenecks.length === 0 && (
          <div className="rounded-xl border border-sage/50 bg-sage/30 px-3 py-2 text-[12px] text-neutral-700">
            All stations on pace.
          </div>
        )}
        {bottlenecks.map((b) => (
          <div
            key={b.station}
            className="mb-2 rounded-xl border border-cantaloupe/50 bg-cantaloupe-soft/60 px-3 py-2.5 last:mb-0"
          >
            <div className="flex items-center gap-2 text-[13px] font-semibold text-neutral-900">
              <BoltIcon className="h-3.5 w-3.5 text-cantaloupe-deep" />
              {STATIONS.find((s) => s.id === b.station)?.name ?? b.station} ·{" "}
              {b.severity === "slammed" ? "slammed" : "running hot"}
            </div>
            <p className="mt-1 text-[12px] leading-snug text-neutral-700">
              Avg cook{" "}
              <span className="font-semibold tabular-nums">
                {fmtAvg(b.avgAgeSeconds)}
              </span>
              . <span className="tabular-nums">{b.activeItems}</span> items open.
            </p>
          </div>
        ))}
      </div>

      {/* Help out (chefs who finish early) */}
      <div className="px-5 py-4">
        <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-sage-dark">
          Help out
        </div>
        {bottlenecks.length === 0 ? (
          <div className="text-[12px] text-neutral-500">
            Nothing burning. Take five.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {bottlenecks.map((b) => (
              <div
                key={b.station}
                className="rounded-xl border border-cream-dark bg-white px-3 py-2 text-[12px] text-neutral-700"
              >
                <span className="font-semibold text-neutral-900">
                  Jump to{" "}
                  {STATIONS.find((s) => s.id === b.station)?.name ?? b.station}
                </span>
                <p className="mt-0.5 text-[11px] text-neutral-500">
                  Could use a hand · {b.activeItems} items in queue
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
