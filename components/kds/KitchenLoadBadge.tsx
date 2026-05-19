"use client";

import type { KitchenLoad } from "@/lib/kds";

export default function KitchenLoadBadge({ load }: { load: KitchenLoad }) {
  return (
    <div
      className={[
        "inline-flex h-10 items-center gap-2 rounded-full px-3 shadow-sm",
        load.bgClass,
        load.textClass,
      ].join(" ")}
      aria-label={`Kitchen load level ${load.level}, ${load.label}`}
      title={`Score ${load.score.toFixed(1)}`}
    >
      <span className="text-[11px] font-semibold uppercase tracking-wider opacity-80">
        Load
      </span>
      <span className="text-base font-bold tabular-nums leading-none">
        {load.level}
      </span>
      <span className="hidden text-sm font-medium opacity-90 sm:inline">
        {load.label}
      </span>
    </div>
  );
}
