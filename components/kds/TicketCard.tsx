"use client";

import { STATION_COLOR, STATION_LABEL, type KdsOrder, type Station } from "./types";

// Three thresholds → three colours. Anything past 10m also pulses to draw
// the eye from across the room. Border + timer chip use the same hue so
// urgency reads from card outline alone.
function urgencyTheme(o: KdsOrder) {
  if (o.urgency === "overdue") {
    return {
      border: "border-red-500/70 ring-2 ring-red-500/40",
      timer: "bg-red-500 text-white",
      pulse: "animate-pulse",
    };
  }
  if (o.urgency === "warn") {
    return {
      border: "border-amber-500/60 ring-1 ring-amber-500/30",
      timer: "bg-amber-500 text-slate-950",
      pulse: "",
    };
  }
  return {
    border: "border-slate-700/60",
    timer: "bg-emerald-500 text-slate-950",
    pulse: "",
  };
}

function TypeBadge({ type }: { type: KdsOrder["type"] }) {
  if (type.kind === "dine-in") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-700 px-2.5 py-1 text-sm font-semibold text-white">
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
          <path d="M3 6a3 3 0 013-3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6zm3-1a1 1 0 00-1 1v3h14V6a1 1 0 00-1-1H6z" />
        </svg>
        Table {type.tableNumber}
      </span>
    );
  }
  if (type.kind === "takeout") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/20 px-2.5 py-1 text-sm font-semibold text-emerald-300 ring-1 ring-emerald-500/40">
        <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
          <path d="M5 7l1.5-3h11L19 7M5 7h14v12a2 2 0 01-2 2H7a2 2 0 01-2-2V7z" stroke="currentColor" strokeWidth={1.5} fill="none" />
        </svg>
        Takeout
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-500/20 px-2.5 py-1 text-sm font-semibold text-blue-300 ring-1 ring-blue-500/40">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
        <path strokeLinecap="round" d="M3 17h13l3-4h2v4M3 17v-3l2-6h11l3 6m-16 3a2 2 0 104 0 2 2 0 00-4 0zm12 0a2 2 0 104 0 2 2 0 00-4 0z" />
      </svg>
      {type.platform}
    </span>
  );
}

function StationBadge({ station }: { station: Station }) {
  const c = STATION_COLOR[station];
  return (
    <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ${c.bg} ${c.fg} ${c.ring}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {STATION_LABEL[station]}
    </span>
  );
}

export function TicketCard({
  order,
  density,
  onToggleLine,
  onBump,
  onPriority,
  onExpand,
}: {
  order: KdsOrder;
  density: "comfortable" | "compact";
  onToggleLine: (lineId: string) => void;
  onBump: () => void;
  onPriority: () => void;
  onExpand: () => void;
}) {
  const t = urgencyTheme(order);
  const compact = density === "compact";
  const isPriority = order.raw.priority === true;
  const totalQty = order.lines.reduce((s, l) => s + l.raw.quantity, 0);

  return (
    <li
      className={[
        "relative flex flex-col rounded-2xl border-2 bg-slate-900 shadow-lg transition-colors",
        t.border,
        compact ? "p-3" : "p-4",
      ].join(" ")}
    >
      {/* Header row: ticket #, type, timer */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-baseline gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">#</span>
          <button
            type="button"
            onClick={onExpand}
            className="font-mono text-3xl font-bold tabular-nums leading-none text-white hover:text-emerald-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
            aria-label={`Expand ticket ${order.ticketLabel}`}
          >
            {order.ticketLabel}
          </button>
        </div>
        <div className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-2xl font-bold tabular-nums ${t.timer} ${t.pulse}`}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5">
            <circle cx="12" cy="13" r="8" />
            <path strokeLinecap="round" d="M12 9v4l2 2M9 3h6" />
          </svg>
          {order.elapsedMin}m
        </div>
      </div>

      {/* Type + priority row */}
      <div className="mt-2 flex items-center gap-2">
        <TypeBadge type={order.type} />
        {isPriority && (
          <span className="inline-flex items-center gap-1 rounded-lg bg-red-500/20 px-2 py-1 text-xs font-semibold text-red-300 ring-1 ring-red-500/40">
            ★ PRIORITY
          </span>
        )}
        <button
          type="button"
          onClick={onPriority}
          aria-pressed={isPriority}
          aria-label={isPriority ? "Unmark priority" : "Mark priority"}
          className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-lg text-slate-400 hover:bg-slate-800 hover:text-amber-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
        >
          {isPriority ? "★" : "☆"}
        </button>
      </div>

      {/* Items */}
      <ul className={`mt-3 flex flex-col ${compact ? "gap-1" : "gap-1.5"}`}>
        {order.lines.map((line) => {
          return (
            <li
              key={line.raw.id}
              className={[
                "rounded-lg border bg-slate-950/40 transition-colors",
                line.done ? "border-slate-800 opacity-50" : "border-slate-800",
                compact ? "p-2" : "p-2.5",
              ].join(" ")}
            >
              <label className="flex cursor-pointer items-start gap-3">
                {/* 28px box → ~44px tap target with padding */}
                <input
                  type="checkbox"
                  checked={line.done}
                  onChange={() => onToggleLine(line.raw.id)}
                  className="mt-0.5 h-7 w-7 flex-none cursor-pointer accent-emerald-500"
                  aria-label={`Mark ${line.raw.itemName} done`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-2xl font-bold tabular-nums text-white">
                      {line.raw.quantity}×
                    </span>
                    <span className={`text-lg font-semibold leading-tight ${line.done ? "text-slate-500 line-through" : "text-white"}`}>
                      {line.raw.itemName}
                    </span>
                  </div>
                  {/* badges row */}
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <StationBadge station={line.station} />
                    {line.allergens.map((a) => (
                      <span
                        key={a}
                        className="inline-flex items-center gap-1 rounded-md bg-red-500/20 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-red-300 ring-1 ring-red-500/40"
                      >
                        ⚠ {a}
                      </span>
                    ))}
                    {!compact && line.modifications.map((m, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center rounded-md bg-amber-400/20 px-2 py-0.5 text-xs font-semibold text-amber-200 ring-1 ring-amber-400/40"
                      >
                        {m}
                      </span>
                    ))}
                    {compact && line.modifications.length > 0 && (
                      <span className="inline-flex items-center rounded-md bg-amber-400/20 px-2 py-0.5 text-xs font-semibold text-amber-200 ring-1 ring-amber-400/40">
                        +{line.modifications.length} mod
                      </span>
                    )}
                  </div>
                </div>
              </label>
            </li>
          );
        })}
      </ul>

      {/* Order-level prefs */}
      {order.raw.preferences.length > 0 && (
        <p className="mt-2 rounded-md bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-200 ring-1 ring-amber-500/30">
          {order.raw.preferences.join(" · ")}
        </p>
      )}

      {/* Footer: line progress + bump */}
      <div className="mt-3 flex items-center gap-2 border-t border-slate-800 pt-3">
        <span className="text-xs uppercase tracking-wider text-slate-400">
          {order.lines.filter((l) => l.done).length}/{order.lines.length} items · {totalQty} qty
        </span>
        <button
          type="button"
          onClick={onBump}
          className="ml-auto inline-flex h-[60px] items-center gap-2 rounded-xl bg-emerald-500 px-6 text-lg font-bold text-slate-950 shadow-md transition-colors hover:bg-emerald-400 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/60 active:scale-[0.98]"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="h-6 w-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          BUMP
        </button>
      </div>
    </li>
  );
}
