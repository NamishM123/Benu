"use client";

import { STATIONS, type ViewMode } from "@/lib/kds";

export default function ViewSwitcher({
  view,
  onChange,
}: {
  view: ViewMode;
  onChange: (v: ViewMode) => void;
}) {
  function isActive(v: ViewMode): boolean {
    if (view.kind !== v.kind) return false;
    if (view.kind === "station" && v.kind === "station") {
      return view.station === v.station;
    }
    return true;
  }
  const items: { v: ViewMode; label: string; sub?: string }[] = [
    { v: { kind: "all" }, label: "All" },
    { v: { kind: "expo" }, label: "Expo" },
    ...STATIONS.map((s) => ({
      v: { kind: "station" as const, station: s.id },
      label: s.name,
      sub: "Station",
    })),
  ];

  return (
    <div className="flex flex-wrap items-center gap-1 rounded-full border border-neutral-200 bg-white p-1">
      {items.map((it, i) => {
        const active = isActive(it.v);
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange(it.v)}
            aria-pressed={active}
            className={[
              "rounded-full px-3 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-700/30",
              active
                ? "bg-cantaloupe text-neutral-900 hover:bg-cantaloupe-soft"
                : "text-neutral-600 hover:text-neutral-900",
            ].join(" ")}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}
