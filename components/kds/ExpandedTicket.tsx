"use client";

import { useEffect } from "react";
import { STATION_COLOR, STATION_LABEL, type KdsOrder } from "./types";

// Full-screen single-ticket detail. Used when a cook taps the ticket
// number — surfaces the full text of every modification, every selection
// group, allergen list, and the raw timestamp/clientId for accountability.
export function ExpandedTicket({
  order,
  onClose,
  onToggleLine,
  onBump,
  onPriority,
}: {
  order: KdsOrder;
  onClose: () => void;
  onToggleLine: (lineId: string) => void;
  onBump: () => void;
  onPriority: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const isPriority = order.raw.priority === true;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Ticket ${order.ticketLabel}`}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border-2 border-slate-700 bg-slate-900 shadow-2xl"
      >
        <header className="flex items-center gap-4 border-b border-slate-800 bg-slate-950 p-5">
          <span className="text-sm uppercase tracking-wider text-slate-400">Ticket</span>
          <span className="font-mono text-5xl font-bold tabular-nums text-white">#{order.ticketLabel}</span>
          <div className="ml-auto flex items-center gap-3">
            <span
              className={[
                "rounded-xl px-4 py-2 text-2xl font-bold tabular-nums",
                order.urgency === "overdue" ? "bg-red-500 text-white" : order.urgency === "warn" ? "bg-amber-500 text-slate-950" : "bg-emerald-500 text-slate-950",
              ].join(" ")}
            >
              {order.elapsedMin}m
            </span>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="flex h-12 w-12 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-6 w-6">
                <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        </header>

        <div className="flex flex-wrap items-center gap-3 border-b border-slate-800 px-5 py-3 text-base text-slate-300">
          <span className="font-semibold text-white">
            {order.type.kind === "dine-in" && `Table ${order.type.tableNumber}`}
            {order.type.kind === "takeout" && "Takeout"}
            {order.type.kind === "delivery" && `Delivery · ${order.type.platform}`}
          </span>
          <span className="text-slate-500">·</span>
          <span>Placed {new Date(order.raw.placedAt).toLocaleTimeString()}</span>
          <button
            type="button"
            onClick={onPriority}
            aria-pressed={isPriority}
            className={[
              "ml-auto inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors",
              isPriority
                ? "bg-red-500/20 text-red-300 ring-1 ring-red-500/40"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700",
            ].join(" ")}
          >
            {isPriority ? "★ Priority" : "☆ Mark priority"}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <ul className="flex flex-col gap-3">
            {order.lines.map((line) => {
              const c = STATION_COLOR[line.station];
              return (
                <li
                  key={line.raw.id}
                  className={[
                    "rounded-xl border-2 p-4 transition-colors",
                    line.done ? "border-slate-800 bg-slate-950/40 opacity-60" : "border-slate-700 bg-slate-950/60",
                  ].join(" ")}
                >
                  <label className="flex cursor-pointer items-start gap-4">
                    <input
                      type="checkbox"
                      checked={line.done}
                      onChange={() => onToggleLine(line.raw.id)}
                      className="mt-1 h-8 w-8 flex-none cursor-pointer accent-emerald-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-baseline gap-3">
                        <span className="font-mono text-3xl font-bold tabular-nums text-white">{line.raw.quantity}×</span>
                        <h3 className={`text-2xl font-semibold ${line.done ? "text-slate-500 line-through" : "text-white"}`}>
                          {line.raw.itemName}
                        </h3>
                        <span className={`ml-auto inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-semibold ring-1 ${c.bg} ${c.fg} ${c.ring}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
                          {STATION_LABEL[line.station]}
                        </span>
                      </div>
                      {line.allergens.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {line.allergens.map((a) => (
                            <span key={a} className="inline-flex items-center gap-1 rounded-md bg-red-500/20 px-2.5 py-1 text-sm font-bold uppercase tracking-wide text-red-300 ring-1 ring-red-500/40">
                              ⚠ Allergen: {a}
                            </span>
                          ))}
                        </div>
                      )}
                      {line.modifications.length > 0 && (
                        <ul className="mt-2 flex flex-col gap-1">
                          {line.modifications.map((m, i) => (
                            <li key={i} className="rounded-md bg-amber-400/15 px-3 py-1.5 text-base font-medium text-amber-200 ring-1 ring-amber-400/30">
                              {m}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </label>
                </li>
              );
            })}
          </ul>

          {order.raw.preferences.length > 0 && (
            <div className="mt-4 rounded-xl bg-amber-500/10 p-4 ring-1 ring-amber-500/30">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">Diner preferences</p>
              <p className="mt-1 text-base text-amber-100">{order.raw.preferences.join(" · ")}</p>
            </div>
          )}
        </div>

        <footer className="border-t border-slate-800 bg-slate-950 p-5">
          <button
            type="button"
            onClick={onBump}
            className="flex h-[64px] w-full items-center justify-center gap-3 rounded-2xl bg-emerald-500 text-2xl font-bold text-slate-950 shadow-lg transition-colors hover:bg-emerald-400 focus:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400/60 active:scale-[0.99]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className="h-7 w-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            BUMP TICKET
          </button>
        </footer>
      </div>
    </div>
  );
}
