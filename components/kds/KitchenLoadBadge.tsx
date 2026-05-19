"use client";

import type { KitchenLoad } from "@/lib/kds";

// Segmented bar + level + label, matching the KitchenLoadBadge from the
// Claude Design handoff (kds-shared.jsx).
export default function KitchenLoadBadge({ load }: { load: KitchenLoad }) {
  const tone: Record<number, { bg: string; fg: string; label: string }> = {
    1: { bg: "bg-sage-kds-dark", fg: "text-cream", label: "Calm" },
    2: { bg: "bg-sage-kds-dark", fg: "text-cream", label: "Steady" },
    3: { bg: "bg-butter-kds", fg: "text-neutral-900", label: "Busy" },
    4: { bg: "bg-cantaloupe-kds", fg: "text-cream", label: "Slammed" },
    5: { bg: "bg-red-500", fg: "text-cream", label: "Drowning" },
  };
  const s = tone[load.level];
  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 ${s.bg} ${s.fg}`}
      title={`Score ${load.score.toFixed(1)}`}
    >
      <span className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <span
            key={n}
            className="block w-1 rounded-full"
            style={{
              height: n <= load.level ? "14px" : "6px",
              background: "currentColor",
              opacity: n <= load.level ? 1 : 0.3,
            }}
          />
        ))}
      </span>
      <span className="text-sm font-semibold tabular-nums">{load.level}</span>
      <span className="text-[11px] font-semibold uppercase tracking-wider opacity-90">
        {s.label.toUpperCase()}
      </span>
    </div>
  );
}
