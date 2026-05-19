"use client";

import { STATIONS, type StationId } from "@/lib/kds";
import type { CartLine } from "@/lib/cart-store";
import type { Lang } from "@/lib/i18n";
import { cartLineName } from "@/lib/cart-store";

export default function GhostSection({
  groups,
  checkedItems,
  lang,
}: {
  groups: { station: StationId; lines: CartLine[] }[];
  checkedItems: Set<string>;
  lang: Lang;
}) {
  if (groups.length === 0) return null;
  return (
    <div className="mt-2 border-t border-dashed border-neutral-200 pt-3">
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
        Other stations
      </p>
      <div className="flex flex-col gap-1.5">
        {groups.map((g) => {
          const stationName =
            STATIONS.find((s) => s.id === g.station)?.name ?? g.station;
          const allDone =
            g.lines.length > 0 && g.lines.every((l) => checkedItems.has(l.id));
          if (allDone) {
            return (
              <div
                key={g.station}
                className="rounded-md bg-sage/40 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-700"
              >
                ✓ {stationName} complete
              </div>
            );
          }
          return (
            <div key={g.station}>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                waiting on {stationName}
              </p>
              {g.lines.map((l) => (
                <p
                  key={l.id}
                  className="pl-2 text-sm text-neutral-400 opacity-80"
                >
                  {l.quantity} · {cartLineName(l, lang)}
                </p>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
