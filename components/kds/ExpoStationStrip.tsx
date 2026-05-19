"use client";

import type { Order } from "@/lib/order-store";
import { STATIONS, stationLoad, type StationId } from "@/lib/kds";

function fmtAvg(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "–";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function ExpoStationStrip({
  orders,
  onSelectStation,
}: {
  orders: Order[];
  onSelectStation?: (s: StationId) => void;
}) {
  const stations = STATIONS.map((s) => ({ ...s, ...stationLoad(orders, s.id) }));
  const loadStyle: Record<string, string> = {
    idle: "bg-white border-neutral-200 text-neutral-500",
    normal: "bg-sage/40 border-sage text-neutral-900",
    busy: "bg-butter-soft border-butter text-neutral-900",
    slammed: "bg-cantaloupe-soft border-cantaloupe text-neutral-900",
  };
  return (
    <div className="flex items-center gap-3 border-b border-cream-dark px-6 pb-4 pt-4 sm:px-10">
      <div className="mr-1 shrink-0 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
        Stations
      </div>
      {stations.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onSelectStation?.(s.id)}
          className={`flex-1 rounded-2xl border-2 px-4 py-3 text-left transition-colors ${loadStyle[s.load]}`}
        >
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em]">
              {s.name}
            </div>
            <div className="text-[10px] uppercase tracking-wider opacity-70">
              {s.load}
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-serif text-[34px] leading-none tabular-nums">
              {s.activeItems}
            </span>
            <span className="text-[12px] tabular-nums opacity-70">
              {s.load === "idle"
                ? "idle"
                : `${fmtAvg(s.avgAgeSeconds)} avg`}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
