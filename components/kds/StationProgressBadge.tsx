"use client";

import { STATIONS, type StationId } from "@/lib/kds";

export default function StationProgressBadge({
  station,
  done,
  total,
}: {
  station: StationId;
  done: number;
  total: number;
}) {
  if (total === 0) return null;
  const stationName = STATIONS.find((s) => s.id === station)?.shortName ?? station;
  const isDone = done === total;
  const partial = done > 0 && done < total;
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
        {stationName}
      </span>
      <div
        className={[
          "flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider",
          isDone
            ? "bg-sage-dark text-neutral-900"
            : partial
              ? "bg-butter text-neutral-900"
              : "bg-neutral-200 text-neutral-700",
        ].join(" ")}
      >
        {done}/{total}
      </div>
    </div>
  );
}
