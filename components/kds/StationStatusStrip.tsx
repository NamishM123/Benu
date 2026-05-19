"use client";

import { STATIONS, stationLoad, type StationId } from "@/lib/kds";
import type { Order } from "@/lib/order-store";

export default function StationStatusStrip({
  orders,
  activeStation,
  onSelectStation,
}: {
  orders: Order[];
  activeStation: StationId | "all";
  onSelectStation: (s: StationId | "all") => void;
}) {
  const stations = STATIONS.map((s) => ({
    ...s,
    ...stationLoad(orders, s.id),
  }));

  const totalActive = stations.reduce((sum, s) => sum + s.activeItems, 0);

  return (
    <div className="-mx-1 mb-3 mt-2 flex items-center gap-3 overflow-x-auto px-6 pb-2 sm:px-10 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <button
        type="button"
        onClick={() => onSelectStation("all")}
        aria-pressed={activeStation === "all"}
        className={[
          "flex-none rounded-2xl border-2 px-4 py-3 text-left transition-colors",
          activeStation === "all"
            ? "border-cantaloupe bg-cantaloupe-soft/50"
            : "border-neutral-200 bg-white hover:border-neutral-300",
        ].join(" ")}
      >
        <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
          All Stations
        </div>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-2xl font-bold tabular-nums text-neutral-900">
            {totalActive}
          </span>
          <span className="text-sm text-neutral-600">items</span>
        </div>
      </button>
      {stations.map((s) => {
        const active = activeStation === s.id;
        const tone =
          s.load === "idle"
            ? "bg-white border-neutral-200"
            : s.load === "normal"
              ? "bg-sage/30 border-sage-dark"
              : s.load === "busy"
                ? "bg-butter-soft border-butter"
                : "bg-cantaloupe-soft border-cantaloupe";
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelectStation(s.id)}
            aria-pressed={active}
            className={[
              "flex-none rounded-2xl border-2 px-4 py-3 text-left transition-colors",
              active ? "ring-4 ring-cantaloupe/50 " + tone : tone,
            ].join(" ")}
          >
            <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
              {s.name}
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold tabular-nums text-neutral-900">
                {s.activeItems}
              </span>
              <span className="text-sm text-neutral-600">
                {s.load === "idle"
                  ? "idle"
                  : `${Math.round(s.avgAgeSeconds / 60)}m avg`}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
