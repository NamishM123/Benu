"use client";

import { useMemo, useState } from "react";
import type { Order } from "@/lib/order-store";
import type { Lang } from "@/lib/i18n";
import {
  STATIONS,
  kitchenPaceBars,
  stationLoad,
  ticketsPerHour,
  type KitchenLoad,
  type StationId,
} from "@/lib/kds";
import KdsLogo from "./KdsLogo";
import Clock from "./Clock";
import MicButton from "./MicButton";
import KitchenLoadBadge from "./KitchenLoadBadge";
import Eyebrow from "./Eyebrow";
import { FlameIcon, PauseIcon } from "./Icons";
import ExpoBanner from "./ExpoBanner";
import ExpoTicketCard from "./ExpoTicketCard";
import ExpoRail from "./ExpoRail";

function fmtAvg(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "–";
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

// ─── V4 Header — course controls in center, load/clock/mic right ─────────

function V4Header({
  load,
  mainsHeld,
  appsHeld,
  onToggleMains,
  onFireMains,
  onToggleApps,
  expoName,
  rightExtras,
}: {
  load: KitchenLoad;
  mainsHeld: boolean;
  appsHeld: boolean;
  onToggleMains: () => void;
  onFireMains: () => void;
  onToggleApps: () => void;
  expoName?: string;
  rightExtras?: React.ReactNode;
}) {
  return (
    <header className="border-b border-kds-cream-deep bg-kds-cream/95 backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 pb-4 pt-5 sm:px-8">
        <div className="flex items-center gap-5">
          <KdsLogo />
          <div className="h-7 w-px bg-kds-cream-deep" />
          <Eyebrow>
            Expo · Pass{expoName ? ` · ${expoName}` : ""}
          </Eyebrow>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onToggleMains}
            aria-pressed={mainsHeld}
            className={[
              "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-medium",
              mainsHeld
                ? "border-butter-kds bg-butter-kds-soft text-neutral-900"
                : "border-neutral-300 bg-white text-neutral-700",
            ].join(" ")}
          >
            <PauseIcon className="h-3.5 w-3.5" /> Hold mains
          </button>
          <button
            type="button"
            onClick={onFireMains}
            className="inline-flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-[13px] font-medium text-cream"
          >
            <FlameIcon className="h-3.5 w-3.5" /> Fire mains
          </button>
          <button
            type="button"
            onClick={onToggleApps}
            aria-pressed={appsHeld}
            className={[
              "rounded-full border px-4 py-2 text-[13px] font-medium",
              appsHeld
                ? "border-butter-kds bg-butter-kds-soft text-neutral-900"
                : "border-neutral-300 bg-white text-neutral-700",
            ].join(" ")}
          >
            Hold apps
          </button>
        </div>

        <div className="flex items-center gap-4">
          <KitchenLoadBadge load={load} />
          <Clock />
          <MicButton />
          {rightExtras}
        </div>
      </div>
    </header>
  );
}

// ─── V4 Station strip ────────────────────────────────────────────────────

function V4StationStrip({
  orders,
  onSelectStation,
}: {
  orders: Order[];
  onSelectStation?: (s: StationId) => void;
}) {
  const stations = STATIONS.map((s) => ({ ...s, ...stationLoad(orders, s.id) }));
  // The design shows 5 cards (Wok / Broth / Cold / Fryer / Pass). We have 4
  // real stations; pad with a synthetic "Pass" card derived from ready
  // tickets so the strip still reads as five tiles.
  const readyCount = orders.filter((o) => o.status === "ready").length;
  const tiles: {
    id: string;
    name: string;
    load: "idle" | "normal" | "busy" | "slammed";
    activeItems: number;
    avgAgeSeconds: number;
    clickable: boolean;
    stationId?: StationId;
  }[] = stations.map((s) => ({
    id: s.id,
    name: s.name,
    load: s.load,
    activeItems: s.activeItems,
    avgAgeSeconds: s.avgAgeSeconds,
    clickable: true,
    stationId: s.id,
  }));
  tiles.push({
    id: "pass",
    name: "Pass",
    load: readyCount === 0 ? "idle" : "normal",
    activeItems: readyCount,
    avgAgeSeconds: 0,
    clickable: false,
  });

  const loadStyle: Record<string, string> = {
    idle: "bg-white border-neutral-200 text-neutral-500",
    normal: "bg-sage-kds/40 border-sage-kds text-neutral-900",
    busy: "bg-butter-kds-soft border-butter-kds text-neutral-900",
    slammed: "bg-cantaloupe-kds-soft border-cantaloupe-kds text-neutral-900",
  };

  return (
    <div className="flex items-center gap-3 border-b border-kds-cream-deep px-6 pb-4 pt-4 sm:px-8">
      <Eyebrow className="mr-1 shrink-0">Stations</Eyebrow>
      {tiles.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => {
            if (t.clickable && t.stationId && onSelectStation)
              onSelectStation(t.stationId);
          }}
          disabled={!t.clickable}
          className={`flex-1 rounded-2xl border-2 px-4 py-3 text-left transition-colors ${loadStyle[t.load]} ${t.clickable ? "hover:opacity-90" : "cursor-default"}`}
        >
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em]">
              {t.name}
            </div>
            <div className="text-[10px] uppercase tracking-wider opacity-70">
              {t.load}
            </div>
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="font-serif text-[34px] leading-none tabular-nums">
              {t.activeItems}
            </span>
            <span className="text-[12px] tabular-nums opacity-70">
              {t.load === "idle" ? "idle" : `${fmtAvg(t.avgAgeSeconds)} avg`}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}

// ─── V4 Footer ───────────────────────────────────────────────────────────

function V4Footer({
  orders,
  onHoldAll,
  holdAllActive,
}: {
  orders: Order[];
  onHoldAll: () => void;
  holdAllActive: boolean;
}) {
  const bars = kitchenPaceBars(orders);
  const tph = ticketsPerHour(orders);
  const [mainsHeld, setMainsHeld] = useState(false);
  const [appsHeld, setAppsHeld] = useState(false);
  const [dessertsHeld, setDessertsHeld] = useState(false);

  return (
    <footer className="border-t border-kds-cream-deep bg-kds-cream">
      <div className="flex flex-wrap items-center gap-4 px-6 py-3 sm:px-8">
        <button
          type="button"
          onClick={onHoldAll}
          className={[
            "inline-flex items-center gap-2 rounded-full border-2 px-5 py-2 text-[14px] font-medium",
            holdAllActive
              ? "border-butter-kds bg-butter-kds-soft text-neutral-900"
              : "border-neutral-300 text-neutral-700",
          ].join(" ")}
        >
          <PauseIcon className="h-4 w-4" /> Hold all stations
        </button>

        <div className="ml-2 flex flex-wrap items-center gap-2">
          <Eyebrow>Courses</Eyebrow>
          <button
            type="button"
            onClick={() => setAppsHeld((v) => !v)}
            className={[
              "rounded-full border px-3 py-1.5 text-[13px]",
              appsHeld
                ? "border-butter-kds bg-butter-kds-soft font-medium"
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
                ? "border-butter-kds bg-butter-kds-soft font-medium"
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
                ? "border-butter-kds bg-butter-kds-soft font-medium"
                : "border-neutral-300 bg-white",
            ].join(" ")}
          >
            Desserts · {dessertsHeld ? "held" : "queued"}
          </button>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <Eyebrow>Kitchen pace</Eyebrow>
          <div className="flex items-center gap-0.5">
            {bars.map((h, i) => (
              <span
                key={i}
                className="block w-1.5 rounded-sm bg-cantaloupe-kds"
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

// ─── Main view ───────────────────────────────────────────────────────────

export default function ExpoView({
  orders,
  checkedItems,
  lang,
  onToggleLine,
  onSelectStation,
  load,
  onHoldAll,
  holdAllActive,
  expoName,
  rightExtras,
}: {
  orders: Order[];
  checkedItems: Record<string, Set<string>>;
  lang: Lang;
  onToggleLine: (orderId: string, lineId: string) => void;
  onSelectStation?: (s: StationId) => void;
  load: KitchenLoad;
  onHoldAll: () => void;
  holdAllActive: boolean;
  expoName?: string;
  rightExtras?: React.ReactNode;
}) {
  const [mainsHeld, setMainsHeld] = useState(false);
  const [appsHeld, setAppsHeld] = useState(false);

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
    <div
      className="flex min-h-[calc(100vh-1rem)] flex-col overflow-hidden rounded-3xl border border-kds-cream-deep bg-kds-cream"
      data-screen-label="V4 Expo · Air Traffic"
    >
      <V4Header
        load={load}
        mainsHeld={mainsHeld}
        appsHeld={appsHeld}
        onToggleMains={() => setMainsHeld((v) => !v)}
        onFireMains={() => setMainsHeld(false)}
        onToggleApps={() => setAppsHeld((v) => !v)}
        expoName={expoName}
        rightExtras={rightExtras}
      />
      <V4StationStrip orders={orders} onSelectStation={onSelectStation} />
      <ExpoBanner orders={orders} />
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto">
          <section className="grid grid-cols-1 gap-5 px-6 pb-6 pt-4 sm:px-8 md:grid-cols-2 xl:grid-cols-3">
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
      <V4Footer
        orders={orders}
        onHoldAll={onHoldAll}
        holdAllActive={holdAllActive}
      />
    </div>
  );
}
