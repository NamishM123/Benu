"use client";

import { useState } from "react";
import type { Order } from "@/lib/order-store";
import { kitchenPaceBars, ticketsPerHour } from "@/lib/kds";
import { PauseIcon } from "./Icons";
import HoldButton from "./HoldButton";

export default function ExpoFooter({ orders }: { orders: Order[] }) {
  const bars = kitchenPaceBars(orders);
  const tph = ticketsPerHour(orders);
  const [mainsHeld, setMainsHeld] = useState(false);
  const [appsHeld, setAppsHeld] = useState(false);
  const [dessertsHeld, setDessertsHeld] = useState(false);

  return (
    <footer className="sticky bottom-0 z-20 border-t border-cream-dark bg-cream">
      <div className="flex flex-wrap items-center gap-3 px-6 py-3 sm:px-10">
        <HoldButton station="all" />
        <div className="ml-1 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Courses
          </span>
          <button
            type="button"
            onClick={() => setAppsHeld((v) => !v)}
            className={[
              "rounded-full border px-3 py-1.5 text-[13px]",
              appsHeld
                ? "border-butter bg-butter-soft font-medium"
                : "border-neutral-300 bg-white",
            ].join(" ")}
          >
            Apps · {appsHeld ? "held" : "firing"}
          </button>
          <button
            type="button"
            onClick={() => setMainsHeld((v) => !v)}
            className={[
              "rounded-full border px-3 py-1.5 text-[13px]",
              mainsHeld
                ? "border-butter bg-butter-soft font-medium"
                : "border-neutral-300 bg-white",
            ].join(" ")}
          >
            Mains · {mainsHeld ? "held" : "firing"}
          </button>
          <button
            type="button"
            onClick={() => setDessertsHeld((v) => !v)}
            className={[
              "rounded-full border px-3 py-1.5 text-[13px]",
              dessertsHeld
                ? "border-butter bg-butter-soft font-medium"
                : "border-neutral-300 bg-white",
            ].join(" ")}
          >
            Desserts · {dessertsHeld ? "held" : "queued"}
          </button>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
            Kitchen pace
          </span>
          <div className="flex items-center gap-0.5">
            {bars.map((h, i) => (
              <span
                key={i}
                className="block w-1.5 rounded-sm bg-cantaloupe"
                style={{
                  height: 4 + h * 1.6,
                  opacity: 0.3 + i * 0.07,
                }}
              />
            ))}
          </div>
          <span className="font-serif text-xl tabular-nums text-neutral-900">
            {tph.toFixed(1)}
          </span>
          <span className="text-[11px] uppercase tracking-wider text-neutral-500">
            tix / hr
          </span>
        </div>
      </div>
    </footer>
  );
}
