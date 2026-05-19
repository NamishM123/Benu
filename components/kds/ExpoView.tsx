"use client";

import { useMemo } from "react";
import type { Order } from "@/lib/order-store";
import type { Lang } from "@/lib/i18n";
import { type StationId } from "@/lib/kds";
import ExpoBanner from "./ExpoBanner";
import ExpoStationStrip from "./ExpoStationStrip";
import ExpoTicketCard from "./ExpoTicketCard";
import ExpoRail from "./ExpoRail";
import ExpoFooter from "./ExpoFooter";

export default function ExpoView({
  orders,
  checkedItems,
  lang,
  onToggleLine,
  onSelectStation,
}: {
  orders: Order[];
  checkedItems: Record<string, Set<string>>;
  lang: Lang;
  onToggleLine: (orderId: string, lineId: string) => void;
  onSelectStation?: (s: StationId) => void;
}) {
  const open = useMemo(
    () =>
      orders
        .filter((o) => o.status !== "pending")
        .sort((a, b) => {
          if (!!a.priority !== !!b.priority) return a.priority ? -1 : 1;
          return a.placedAt - b.placedAt;
        }),
    [orders],
  );

  return (
    <section
      className="overflow-hidden rounded-3xl bg-cream"
      data-screen-label="V4 Expo · Air Traffic"
    >
      <ExpoStationStrip orders={orders} onSelectStation={onSelectStation} />
      <ExpoBanner orders={orders} />
      <div className="flex">
        <main className="flex-1">
          <section className="grid grid-cols-1 gap-5 px-6 pb-6 pt-4 sm:px-10 md:grid-cols-2 xl:grid-cols-3">
            {open.length === 0 && (
              <div className="col-span-full rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center text-sm text-neutral-600">
                No active tickets — kitchen is clear.
              </div>
            )}
            {open.map((o) => (
              <ExpoTicketCard
                key={o.id}
                order={o}
                checked={checkedItems[o.id] ?? new Set()}
                lang={lang}
                onToggleLine={onToggleLine}
              />
            ))}
          </section>
        </main>
        <ExpoRail orders={orders} />
      </div>
      <ExpoFooter orders={orders} />
    </section>
  );
}
