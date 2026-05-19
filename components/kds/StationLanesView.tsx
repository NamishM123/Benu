"use client";

import { useMemo } from "react";
import type { Order } from "@/lib/order-store";
import { updateOrder } from "@/lib/order-store";
import {
  STATIONS,
  ageSeconds,
  classifyLineModifiers,
  laneForOrder,
  linesForStation,
  orderAllergens,
  otherStationsBlocking,
  secondsUntilPromise,
  stationForLine,
  type Lane,
  type KitchenLoad,
  type StationId,
} from "@/lib/kds";
import { cartLineName } from "@/lib/cart-store";
import type { Lang } from "@/lib/i18n";
import { cues } from "@/lib/kds-audio";
import { ArrowURIcon, BoltIcon, CheckIcon, FlameIcon, PauseIcon, WarnIcon } from "./Icons";
import ChannelPill from "./ChannelPill";
import KdsLogo from "./KdsLogo";
import Clock from "./Clock";
import MicButton from "./MicButton";
import KitchenLoadBadge from "./KitchenLoadBadge";
import Eyebrow from "./Eyebrow";

function fmtSeconds(s: number): string {
  if (!Number.isFinite(s)) return "–";
  const sign = s < 0 ? "-" : "";
  const abs = Math.abs(Math.round(s));
  const m = Math.floor(abs / 60);
  const r = abs % 60;
  return `${sign}${m}:${String(r).padStart(2, "0")}`;
}

function ticketShortLabel(order: Order): string {
  return order.ticketNumber !== undefined
    ? String(order.ticketNumber).padStart(4, "0")
    : order.id.slice(0, 4).toUpperCase();
}

function customerLine(order: Order): string {
  const items = order.lines.reduce((s, l) => s + l.quantity, 0);
  return `Table ${order.tableNumber} · ${items} items`;
}

// ─── Per-ticket card inside a lane ───────────────────────────────────────

function LaneCard({
  order,
  station,
  lane,
  checked,
  lang,
  onToggleLine,
  isNext,
  onFire,
  onBump,
}: {
  order: Order;
  station: StationId;
  lane: Lane;
  checked: Set<string>;
  lang: Lang;
  onToggleLine: (orderId: string, lineId: string) => void;
  isNext: boolean;
  onFire: (order: Order) => void;
  onBump: (order: Order) => void;
}) {
  const stationLines = linesForStation(order, station);
  const others = otherStationsBlocking(order, station, checked);
  const allergens = orderAllergens(order);
  const allergen = allergens.length > 0;
  const promiseSecs = secondsUntilPromise(order);
  const past = promiseSecs < 0;

  const accent: Record<Lane, { ring: string; tick: string }> = {
    queue: {
      ring: isNext ? "ring-2 ring-cantaloupe-kds" : "ring-1 ring-kds-cream-deep/70",
      tick: "",
    },
    fire: {
      ring: "ring-1 ring-kds-cream-deep/70",
      tick: "border-l-[5px] border-l-butter-kds",
    },
    bumped: {
      ring: "ring-1 ring-kds-cream-deep/70",
      tick: "border-l-[5px] border-l-sage-kds-dark",
    },
    pass: {
      ring: "ring-2 ring-sage-kds-dark",
      tick: "border-l-[5px] border-l-sage-kds-dark",
    },
  };
  const a = accent[lane];
  const allergenRing = allergen ? "ring-2 ring-red-300" : "";
  const firedAt = order.status === "cooking" ? ageSeconds(order) : null;

  return (
    <article
      className={`overflow-hidden rounded-2xl bg-white shadow-card ${a.ring} ${a.tick} ${allergenRing}`}
    >
      {/* HEAD */}
      <div className="flex items-center justify-between gap-2 px-3.5 pb-2 pt-3">
        <div className="flex items-baseline gap-2">
          <span className="font-serif text-[22px] leading-none text-neutral-900">
            T {order.tableNumber ?? "—"}
          </span>
          <span className="text-[11px] tabular-nums text-neutral-500">
            #{ticketShortLabel(order)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {order.priority && (
            <span className="inline-flex items-center gap-1 rounded-full border border-red-300 bg-red-50 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-red-700">
              <BoltIcon className="h-2.5 w-2.5" /> Rush
            </span>
          )}
          {lane === "fire" && firedAt !== null && (
            <span className="inline-flex items-center gap-1 text-[14px] font-bold tabular-nums">
              <span className="block h-1.5 w-1.5 rounded-full bg-butter-kds-deep animate-pulse-dot" />
              <span className={past ? "text-red-700" : "text-neutral-900"}>
                {fmtSeconds(firedAt)}
              </span>
            </span>
          )}
          {lane === "queue" && (
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500 tabular-nums">
              {past ? (
                <span className="text-red-700">
                  past · {fmtSeconds(-promiseSecs)}
                </span>
              ) : (
                `in ${fmtSeconds(promiseSecs)}`
              )}
            </span>
          )}
        </div>
      </div>

      {/* CHIPS */}
      <div className="flex flex-wrap items-center gap-2 px-3.5 pb-2">
        <ChannelPill channel="dine" size="sm" />
        <span className="flex-1 truncate text-[11px] text-neutral-500">
          {customerLine(order)}
        </span>
      </div>

      {allergen && (
        <div className="mx-3.5 mb-2 inline-flex items-center gap-1.5 rounded-md border border-red-300 bg-red-50 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-red-700">
          <WarnIcon className="h-3 w-3" />
          {allergens.join(" · ")} allergy · no {allergens.join(", ").toLowerCase()}
        </div>
      )}

      {/* ITEMS */}
      <div className="flex flex-col gap-2 border-t border-neutral-100 px-3.5 pb-3 pt-2.5">
        {stationLines.map((line) => {
          const mods = classifyLineModifiers(line, allergens);
          const struck = checked.has(line.id);
          return (
            <div
              key={line.id}
              className="grid cursor-pointer select-none grid-cols-[auto_1fr] items-start gap-x-3"
              onClick={() => onToggleLine(order.id, line.id)}
            >
              <span
                className={`min-w-[1.5ch] text-[26px] font-bold leading-none tabular-nums text-neutral-900 ${
                  struck ? "opacity-40" : ""
                }`}
              >
                {line.quantity}
              </span>
              <div className="flex min-w-0 flex-col gap-0.5 pt-0.5">
                <span
                  className={`truncate text-[13px] font-semibold uppercase tracking-[0.05em] ${
                    struck
                      ? "text-neutral-400 line-through"
                      : "text-neutral-900"
                  }`}
                >
                  {cartLineName(line, lang)}
                </span>
                {mods
                  .filter((m) => m.kind !== "allergen")
                  .slice(0, 2)
                  .map((m, j) => (
                    <span
                      key={j}
                      className={`truncate text-[12px] ${
                        m.kind === "preference"
                          ? "font-medium text-cantaloupe-kds-deep"
                          : "text-neutral-500"
                      }`}
                    >
                      {m.text}
                    </span>
                  ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Per-lane footer */}
      <LaneFooter
        order={order}
        lane={lane}
        allergen={allergen}
        others={others}
        isNext={isNext}
        onFire={onFire}
        onBump={onBump}
      />
    </article>
  );
}

function LaneFooter({
  order,
  lane,
  allergen,
  others,
  isNext,
  onFire,
  onBump,
}: {
  order: Order;
  lane: Lane;
  allergen: boolean;
  others: { station: StationId; allDone: boolean }[];
  isNext: boolean;
  onFire: (o: Order) => void;
  onBump: (o: Order) => void;
}) {
  if (lane === "queue") {
    return (
      <div className="border-t border-neutral-100 px-3 pb-3 pt-1">
        <button
          type="button"
          onClick={() => onFire(order)}
          className={`inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full text-[13px] font-medium ${
            allergen
              ? "border-2 border-red-500 bg-red-50 text-red-700"
              : isNext
                ? "bg-cantaloupe-kds text-cream"
                : "bg-neutral-900 text-cream hover:bg-neutral-800"
          }`}
        >
          {allergen ? (
            <>
              <WarnIcon className="h-3.5 w-3.5" /> Confirm &amp; Fire
            </>
          ) : (
            <>
              <FlameIcon className="h-3.5 w-3.5" /> Fire
            </>
          )}
        </button>
      </div>
    );
  }
  if (lane === "fire") {
    return (
      <div className="border-t border-neutral-100 px-3 pb-3 pt-1">
        <button
          type="button"
          onClick={() => onBump(order)}
          className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full bg-neutral-900 text-[13px] font-medium text-cream hover:bg-neutral-800"
        >
          <CheckIcon className="h-3.5 w-3.5" /> Bump
        </button>
      </div>
    );
  }
  if (lane === "bumped") {
    const waitingOn =
      others
        .filter((g) => !g.allDone)
        .map(
          (g) =>
            STATIONS.find((s) => s.id === g.station)?.shortName ?? g.station,
        )
        .join(" + ") || "plating";
    return (
      <div className="border-t border-neutral-100 px-3.5 pb-3 pt-1">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
          <span className="block h-1.5 w-1.5 rounded-full bg-neutral-300 animate-pulse-dot" />
          Waiting on {waitingOn}
        </div>
      </div>
    );
  }
  return (
    <div className="border-t border-neutral-100 px-3 pb-3 pt-1">
      <button
        type="button"
        onClick={() => updateOrder(order.id, { status: "ready" })}
        className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-full bg-sage-kds-dark text-[13px] font-medium text-cream"
      >
        <CheckIcon className="h-3.5 w-3.5" /> Send to pass
      </button>
    </div>
  );
}

// ─── Lane column ─────────────────────────────────────────────────────────

function LaneColumn({
  title,
  count,
  hint,
  accent,
  children,
}: {
  title: string;
  count: number;
  hint?: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-0 min-w-0 flex-col">
      <div
        className={`mb-3 flex items-center justify-between border-b-2 px-2 pb-2 ${accent}`}
      >
        <div className="flex items-baseline gap-2.5">
          <h2 className="font-serif text-[22px] leading-none text-neutral-900">
            {title}
          </h2>
          <span className="text-[12px] font-semibold uppercase tracking-wider text-neutral-500 tabular-nums">
            {count}
          </span>
        </div>
        {hint && (
          <span className="text-[11px] uppercase tracking-wider text-neutral-500">
            {hint}
          </span>
        )}
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
        {children}
        {count === 0 && (
          <div className="rounded-2xl border border-dashed border-neutral-200 px-3 py-6 text-center text-[12px] text-neutral-400">
            empty
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Header + Footer matching the V3 design ──────────────────────────────

function V3Header({
  station,
  onStationChange,
  load,
  cookName,
  rightExtras,
}: {
  station: StationId;
  onStationChange: (s: StationId) => void;
  load: KitchenLoad;
  cookName?: string;
  rightExtras?: React.ReactNode;
}) {
  return (
    <header className="border-b border-kds-cream-deep bg-kds-cream/95 backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 pb-4 pt-5 sm:px-8">
        <div className="flex items-center gap-5">
          <KdsLogo />
          <div className="h-7 w-px bg-kds-cream-deep" />
          <Eyebrow>
            Lanes · {STATIONS.find((s) => s.id === station)?.name ?? station}
            {cookName ? ` · ${cookName}` : ""}
          </Eyebrow>
        </div>
        <nav className="flex items-center gap-1.5">
          {STATIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onStationChange(s.id)}
              aria-pressed={s.id === station}
              className={
                s.id === station
                  ? "rounded-full bg-cantaloupe-kds px-5 py-2 text-base font-medium text-cream"
                  : "rounded-full px-5 py-2 text-base font-medium text-neutral-600 hover:text-neutral-900"
              }
            >
              {s.name}
            </button>
          ))}
        </nav>
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

function V3Footer({
  serverAsks,
  avgCookSeconds,
  onPace,
  onHold,
  holdActive,
  holdRemainingSec,
}: {
  serverAsks: { label: string; question: string }[];
  avgCookSeconds: number;
  onPace: "on pace" | "slow" | "fast";
  onHold: () => void;
  holdActive: boolean;
  holdRemainingSec: number;
}) {
  const mm = Math.floor(avgCookSeconds / 60);
  const ss = Math.round(avgCookSeconds % 60);
  const avgLabel = avgCookSeconds > 0 ? `${mm}:${String(ss).padStart(2, "0")}` : "–:––";

  return (
    <footer className="border-t border-kds-cream-deep bg-kds-cream">
      <div className="flex flex-wrap items-center gap-4 px-6 py-3 sm:px-8">
        <button
          type="button"
          onClick={onHold}
          className={[
            "inline-flex items-center gap-2 rounded-full border-2 px-5 py-2 text-[14px] font-medium",
            holdActive
              ? "border-butter-kds bg-butter-kds-soft text-neutral-900"
              : "border-neutral-300 text-neutral-700 hover:bg-neutral-50",
          ].join(" ")}
        >
          <PauseIcon className="h-4 w-4" />
          {holdActive
            ? `Holding · ${Math.floor(holdRemainingSec / 60)}:${String(holdRemainingSec % 60).padStart(2, "0")}`
            : "Hold · 90s"}
        </button>

        <Eyebrow>Server asks</Eyebrow>
        {serverAsks.length === 0 && (
          <span className="text-[12px] italic text-neutral-400">none right now</span>
        )}
        {serverAsks.map((a, i) => (
          <button
            key={i}
            type="button"
            className="rounded-full border border-butter-kds/60 bg-butter-kds-soft px-3 py-1.5 text-[13px]"
          >
            <span className="font-semibold">{a.label}</span> · {a.question}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-3">
          <Eyebrow>Avg cook</Eyebrow>
          <span className="font-serif text-xl tabular-nums text-neutral-900">
            {avgLabel}
          </span>
          <span
            className={[
              "text-[11px] font-semibold uppercase tracking-wider",
              onPace === "on pace"
                ? "text-sage-kds-dark"
                : onPace === "slow"
                  ? "text-cantaloupe-kds-deep"
                  : "text-neutral-500",
            ].join(" ")}
          >
            {onPace}
          </span>
        </div>
      </div>
    </footer>
  );
}

// ─── Main view ───────────────────────────────────────────────────────────

export default function StationLanesView({
  orders,
  station,
  cookName,
  checked,
  lang,
  onToggleLine,
  isNextOrderId,
  load,
  onStationChange,
  onHoldToggle,
  holdActive,
  holdRemainingSec,
  rightExtras,
  nextReason,
}: {
  orders: Order[];
  station: StationId;
  cookName?: string;
  checked: Record<string, Set<string>>;
  lang: Lang;
  onToggleLine: (orderId: string, lineId: string) => void;
  isNextOrderId: string | null;
  load: KitchenLoad;
  onStationChange: (s: StationId) => void;
  onHoldToggle: () => void;
  holdActive: boolean;
  holdRemainingSec: number;
  rightExtras?: React.ReactNode;
  nextReason?: string;
}) {
  const active = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.status !== "pending" &&
          o.status !== "ready" &&
          o.lines.some((l) => stationForLine(l) === station),
      ),
    [orders, station],
  );
  const ready = useMemo(
    () => orders.filter((o) => o.status === "ready"),
    [orders],
  );

  const lanes: Record<Lane, Order[]> = {
    queue: [],
    fire: [],
    bumped: [],
    pass: [],
  };
  for (const o of active) {
    const lane = laneForOrder(o, station, checked[o.id] ?? new Set());
    lanes[lane].push(o);
  }
  for (const o of ready) {
    if (!lanes.pass.find((x) => x.id === o.id)) lanes.pass.push(o);
  }
  for (const k of Object.keys(lanes) as Lane[]) {
    lanes[k].sort((a, b) => {
      if (!!a.priority !== !!b.priority) return a.priority ? -1 : 1;
      return a.placedAt - b.placedAt;
    });
  }

  function fire(order: Order) {
    if (order.status !== "cooking") {
      updateOrder(order.id, { status: "cooking" });
      cues.bumpConfirm();
    }
  }
  function bump(order: Order) {
    const stationLines = linesForStation(order, station);
    for (const l of stationLines) {
      if (!(checked[order.id] ?? new Set()).has(l.id)) {
        onToggleLine(order.id, l.id);
      }
    }
    cues.bumpConfirm();
  }

  // Avg cook = avg age of currently-firing tickets at this station
  const firingNow = lanes.fire;
  const avg =
    firingNow.length === 0
      ? 0
      : firingNow.reduce((s, o) => s + ageSeconds(o), 0) / firingNow.length;
  const pace: "on pace" | "slow" | "fast" =
    avg === 0 ? "on pace" : avg > 300 ? "slow" : avg < 120 ? "fast" : "on pace";

  // Surface a couple of fake "server asks" for now — the real backend hook
  // isn't wired but the design calls for chips so cooks see the shape.
  const serverAsks: { label: string; question: string }[] = [];
  const overPromise = orders.filter(
    (o) =>
      (o.status === "new" || o.status === "cooking") &&
      secondsUntilPromise(o) < 0,
  );
  if (overPromise.length > 0) {
    serverAsks.push({
      label: `T ${overPromise[0].tableNumber}`,
      question: "How long?",
    });
  }
  const allergenOrder = orders.find(
    (o) =>
      (o.status === "new" || o.status === "cooking") &&
      orderAllergens(o).length > 0,
  );
  if (allergenOrder) {
    serverAsks.push({
      label: `T ${allergenOrder.tableNumber}`,
      question: "Allergy ok?",
    });
  }

  const nextOrder = isNextOrderId
    ? orders.find((o) => o.id === isNextOrderId)
    : null;

  return (
    <div
      className="flex min-h-[calc(100vh-1rem)] flex-col overflow-hidden rounded-3xl border border-kds-cream-deep bg-kds-cream"
      data-screen-label={`V3 Station · ${
        STATIONS.find((s) => s.id === station)?.name
      }`}
    >
      <V3Header
        station={station}
        onStationChange={onStationChange}
        load={load}
        cookName={cookName}
        rightExtras={rightExtras}
      />

      {/* Mini Next banner + legend */}
      <div className="flex flex-wrap items-center gap-3 px-7 pb-4 pt-5">
        {nextOrder ? (
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-cantaloupe-kds bg-cantaloupe-kds-soft/70 px-4 py-1.5">
            <ArrowURIcon className="h-3.5 w-3.5 text-cantaloupe-kds-deep" />
            <Eyebrow className="!text-cantaloupe-kds-deep">Next</Eyebrow>
            <span className="font-serif text-[16px] text-neutral-900">
              Fire T {nextOrder.tableNumber}
              {nextReason ? ` — ${nextReason}` : ""}
            </span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 rounded-full border-2 border-sage/40 bg-sage/30 px-4 py-1.5">
            <Eyebrow className="!text-sage-kds-dark">All clear</Eyebrow>
            <span className="font-serif text-[16px] text-neutral-700">
              work the queue
            </span>
          </div>
        )}
        <div className="ml-auto flex items-center gap-3 text-[12px] text-neutral-500">
          <span className="inline-flex items-center gap-1">
            <span className="block h-2 w-2 rounded-sm bg-cantaloupe-kds" />{" "}
            queue
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="block h-2 w-2 rounded-sm bg-butter-kds" /> cooking
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="block h-2 w-2 rounded-sm bg-sage-kds-dark" /> done
          </span>
        </div>
      </div>

      {/* Lanes */}
      <main className="grid min-h-[480px] flex-1 grid-cols-1 gap-5 overflow-hidden px-7 pb-6 sm:grid-cols-2 lg:grid-cols-4">
        <LaneColumn
          title="Queue"
          count={lanes.queue.length}
          hint="unfired"
          accent="border-neutral-300"
        >
          {lanes.queue.map((o) => (
            <LaneCard
              key={o.id}
              order={o}
              station={station}
              lane="queue"
              checked={checked[o.id] ?? new Set()}
              lang={lang}
              onToggleLine={onToggleLine}
              isNext={isNextOrderId === o.id}
              onFire={fire}
              onBump={bump}
            />
          ))}
        </LaneColumn>
        <LaneColumn
          title="Firing"
          count={lanes.fire.length}
          hint="actively cooking"
          accent="border-butter-kds"
        >
          {lanes.fire.map((o) => (
            <LaneCard
              key={o.id}
              order={o}
              station={station}
              lane="fire"
              checked={checked[o.id] ?? new Set()}
              lang={lang}
              onToggleLine={onToggleLine}
              isNext={isNextOrderId === o.id}
              onFire={fire}
              onBump={bump}
            />
          ))}
        </LaneColumn>
        <LaneColumn
          title="Bumped · waiting"
          count={lanes.bumped.length}
          hint="other stations"
          accent="border-sage-kds"
        >
          {lanes.bumped.map((o) => (
            <LaneCard
              key={o.id}
              order={o}
              station={station}
              lane="bumped"
              checked={checked[o.id] ?? new Set()}
              lang={lang}
              onToggleLine={onToggleLine}
              isNext={false}
              onFire={fire}
              onBump={bump}
            />
          ))}
        </LaneColumn>
        <LaneColumn
          title="Ready · pass"
          count={lanes.pass.length}
          hint="all stations done"
          accent="border-sage-kds-dark"
        >
          {lanes.pass.map((o) => (
            <LaneCard
              key={o.id}
              order={o}
              station={station}
              lane="pass"
              checked={checked[o.id] ?? new Set()}
              lang={lang}
              onToggleLine={onToggleLine}
              isNext={false}
              onFire={fire}
              onBump={bump}
            />
          ))}
        </LaneColumn>
      </main>

      <V3Footer
        serverAsks={serverAsks}
        avgCookSeconds={avg}
        onPace={pace}
        onHold={onHoldToggle}
        holdActive={holdActive}
        holdRemainingSec={holdRemainingSec}
      />
    </div>
  );
}
