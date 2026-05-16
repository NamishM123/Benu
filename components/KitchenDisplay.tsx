"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  getOrders,
  ORDERS_EVENT,
  removeOrder,
  subscribeToOrders,
  updateOrder,
  type Order,
} from "@/lib/order-store";
import { type MenuItem } from "@/lib/menu";
import LanguageSwitcher from "./LanguageSwitcher";
import SignOutButton from "./SignOutButton";
import BusyHeatmap from "./BusyHeatmap";
import { TicketCard } from "./kds/TicketCard";
import { ExpandedTicket } from "./kds/ExpandedTicket";
import { SoldOutModal } from "./kds/SoldOutModal";
import { EmptyState } from "./kds/EmptyState";
import {
  STATION_COLOR,
  STATION_LABEL,
  STATION_ORDER,
  type RecallEntry,
  type Station,
  type StationFilter,
} from "./kds/types";
import { buildKdsOrder, buildMenuLookup, sortByUrgency } from "./kds/derive";

const DONE_LINES_KEY = "benu.kds.doneLines";
const RECALL_KEY = "benu.kds.recall";
const RECALL_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const UNDO_WINDOW_MS = 30 * 1000; // 30 seconds for bump undo

type View = "active" | "recall";

type Toast = {
  id: string;
  kind: "info" | "success" | "warn";
  message: string;
  // Bump toasts carry an undo callback (cleared after 30s).
  undo?: () => void;
  expires: number;
};

// Synthetic webaudio chime — avoids shipping an audio file. Two-note
// ping that's distinct from typical phone notifications so cooks don't
// confuse it with their own pockets.
function playChime() {
  if (typeof window === "undefined") return;
  try {
    const Ctx = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext
      ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    const notes = [880, 1320];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const start = now + i * 0.12;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.18, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.32);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.34);
    });
    setTimeout(() => ctx.close().catch(() => {}), 800);
  } catch {
    // ignore — chime is non-critical
  }
}

function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function saveJSON(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors
  }
}

export default function KitchenDisplay() {
  // ── Persistent UI prefs ────────────────────────────────────────────
  const [darkMode, setDarkMode] = useState(true);
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [stationFilter, setStationFilter] = useState<StationFilter>("all");
  const [view, setView] = useState<View>("active");
  const [audioOn, setAudioOn] = useState(true);

  // Hydrate prefs from localStorage on mount so a refresh keeps the cook's
  // settings. Done in effect (not initial state) to avoid SSR mismatches.
  useEffect(() => {
    const raw = loadJSON<Partial<{ dark: boolean; density: "comfortable" | "compact"; audio: boolean }>>(
      "benu.kds.prefs",
      {},
    );
    if (typeof raw.dark === "boolean") setDarkMode(raw.dark);
    if (raw.density === "compact" || raw.density === "comfortable") setDensity(raw.density);
    if (typeof raw.audio === "boolean") setAudioOn(raw.audio);
  }, []);
  useEffect(() => {
    saveJSON("benu.kds.prefs", { dark: darkMode, density, audio: audioOn });
  }, [darkMode, density, audioOn]);

  // ── Server-driven data ─────────────────────────────────────────────
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoaded, setOrdersLoaded] = useState(false);
  const [menuItems, setMenuItems] = useState<(MenuItem & { id: string })[]>([]);

  useEffect(() => {
    fetch("/api/menu/items")
      .then((r) => r.json())
      .then((j) => setMenuItems(j.items ?? []))
      .catch(() => {});
  }, []);

  // Track previously-seen ticket IDs so new arrivals can chime + toast.
  const seenIdsRef = useRef<Set<string>>(new Set());
  const firstLoadRef = useRef(true);
  // Mirror audioOn into a ref so the orders subscription doesn't have to
  // re-subscribe (and re-fire seen-detection) every time the cook mutes.
  const audioOnRef = useRef(audioOn);
  useEffect(() => {
    audioOnRef.current = audioOn;
  }, [audioOn]);

  useEffect(() => {
    const initial = getOrders();
    setOrders(initial);
    if (initial.length > 0) setOrdersLoaded(true);
    function onChange(e: Event) {
      const detail = (e as CustomEvent<Order[]>).detail;
      if (!Array.isArray(detail)) return;
      // Detect newly-arrived active tickets (placed ≤90s ago and unseen).
      // The "≤90s" gate stops the first poll-after-bump from triggering
      // a chime for every existing ticket already on screen.
      const seen = seenIdsRef.current;
      if (!firstLoadRef.current) {
        const fresh = detail.filter(
          (o) => !seen.has(o.id) && o.status !== "ready" && o.status !== "pending" && Date.now() - o.placedAt < 90_000,
        );
        if (fresh.length > 0) {
          if (audioOnRef.current) playChime();
          for (const o of fresh) {
            const label = o.ticketNumber !== undefined ? String(o.ticketNumber).padStart(3, "0") : o.id.slice(0, 6).toUpperCase();
            pushToast({ kind: "info", message: `New ticket #${label}` });
          }
        }
      }
      for (const o of detail) seen.add(o.id);
      firstLoadRef.current = false;
      setOrders(detail);
      setOrdersLoaded(true);
    }
    window.addEventListener(ORDERS_EVENT, onChange);
    const unsub = subscribeToOrders({ scope: "all" });
    return () => {
      window.removeEventListener(ORDERS_EVENT, onChange);
      unsub();
    };
  }, []);

  // ── Derived KDS state ──────────────────────────────────────────────
  const [doneLines, setDoneLines] = useState<Set<string>>(() => new Set());
  const [recall, setRecall] = useState<RecallEntry[]>([]);
  useEffect(() => {
    setDoneLines(new Set(loadJSON<string[]>(DONE_LINES_KEY, [])));
    setRecall(loadJSON<RecallEntry[]>(RECALL_KEY, []));
  }, []);
  useEffect(() => {
    saveJSON(DONE_LINES_KEY, Array.from(doneLines));
  }, [doneLines]);
  useEffect(() => {
    saveJSON(RECALL_KEY, recall);
  }, [recall]);

  // Tick the "elapsed" timer every 15s. We don't need second-precision —
  // the urgency thresholds are 5min and 10min, and a 15s drift is invisible
  // at typical glance distance.
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(id);
  }, []);

  // Garbage-collect recall entries older than the 10-minute window so the
  // recall view doesn't grow forever.
  useEffect(() => {
    const id = setInterval(() => {
      const cutoff = Date.now() - RECALL_WINDOW_MS;
      setRecall((r) => (r.some((e) => e.bumpedAt < cutoff) ? r.filter((e) => e.bumpedAt >= cutoff) : r));
    }, 30_000);
    return () => clearInterval(id);
  }, []);

  const menuLookup = useMemo(() => buildMenuLookup(menuItems), [menuItems]);

  const pendingOrders = useMemo(() => orders.filter((o) => o.status === "pending"), [orders]);
  const activeOrders = useMemo(() => orders.filter((o) => o.status !== "pending" && o.status !== "ready"), [orders]);

  const kdsOrders = useMemo(
    () => activeOrders.map((o) => buildKdsOrder(o, menuLookup, doneLines, now)).sort(sortByUrgency),
    [activeOrders, menuLookup, doneLines, now],
  );

  const visibleOrders = useMemo(() => {
    if (stationFilter === "all") return kdsOrders;
    return kdsOrders.filter((o) => o.activeStations.includes(stationFilter));
  }, [kdsOrders, stationFilter]);

  // Per-station counts power both the filter pill badges and the empty-
  // state station summary.
  const stationCounts = useMemo(() => {
    const c: Record<Station, number> = { wok: 0, cold: 0, drinks: 0, bar: 0 };
    for (const o of kdsOrders) for (const s of o.activeStations) c[s] += 1;
    return c;
  }, [kdsOrders]);

  // ── Toast queue ────────────────────────────────────────────────────
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);
  function pushToast(t: Omit<Toast, "id" | "expires">) {
    const id = `t-${++toastIdRef.current}`;
    const expires = Date.now() + (t.undo ? UNDO_WINDOW_MS : 4000);
    setToasts((prev) => [...prev, { id, expires, ...t }]);
  }
  useEffect(() => {
    if (toasts.length === 0) return;
    const id = setInterval(() => {
      const now = Date.now();
      setToasts((prev) => prev.filter((t) => t.expires > now));
    }, 500);
    return () => clearInterval(id);
  }, [toasts.length]);

  // ── Actions ────────────────────────────────────────────────────────
  function toggleLine(orderId: string, lineId: string) {
    const key = `${orderId}:${lineId}`;
    setDoneLines((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  // Bump = mark ready on the server + push to recall queue + offer undo.
  // Optimistic: we don't roll the UI back if the network call fails (the
  // poll loop will reconcile within 4s). The undo path re-PATCHes the
  // status back; if the order has been GC'd by the server in the meantime
  // it'll just no-op.
  function bump(orderId: string) {
    const target = orders.find((o) => o.id === orderId);
    if (!target) return;
    const label = target.ticketNumber !== undefined ? String(target.ticketNumber).padStart(3, "0") : target.id.slice(0, 6).toUpperCase();
    const bumpedAt = Date.now();
    setRecall((r) => [{ order: target, bumpedAt }, ...r].slice(0, 50));
    void updateOrder(orderId, { status: "ready" });
    pushToast({
      kind: "success",
      message: `Ticket #${label} bumped`,
      undo: () => {
        void updateOrder(orderId, { status: "cooking" });
        setRecall((r) => r.filter((e) => !(e.order.id === orderId && e.bumpedAt === bumpedAt)));
        pushToast({ kind: "info", message: `Ticket #${label} restored` });
      },
    });
  }

  function recallTicket(orderId: string, bumpedAt: number) {
    void updateOrder(orderId, { status: "cooking" });
    setRecall((r) => r.filter((e) => !(e.order.id === orderId && e.bumpedAt === bumpedAt)));
    setView("active");
  }

  function togglePriority(orderId: string) {
    const target = orders.find((o) => o.id === orderId);
    if (!target) return;
    void updateOrder(orderId, { priority: !target.priority });
  }

  // ── Modals ─────────────────────────────────────────────────────────
  const [show86, setShow86] = useState(false);
  const [showBusy, setShowBusy] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const expandedOrder = useMemo(
    () => (expandedId ? kdsOrders.find((o) => o.raw.id === expandedId) ?? null : null),
    [expandedId, kdsOrders],
  );

  // Theme tokens — selecting between dark (default, kitchen wall) and
  // light (good for handheld review on a tablet in daylight).
  const theme = darkMode
    ? {
        appBg: "bg-slate-950",
        headerBg: "bg-slate-900/95 border-slate-800",
        text: "text-white",
        mutedText: "text-slate-400",
        chipBg: "bg-slate-800",
        chipBorder: "border-slate-700",
      }
    : {
        appBg: "bg-slate-100",
        headerBg: "bg-white/95 border-slate-200",
        text: "text-slate-900",
        mutedText: "text-slate-600",
        chipBg: "bg-white",
        chipBorder: "border-slate-300",
      };

  const soldOutCount = menuItems.filter((i) => i.available === false).length;

  return (
    <div className={`min-h-screen ${theme.appBg} ${theme.text}`}>
      {/* ── Persistent header ─────────────────────────────────────── */}
      <header className={`sticky top-0 z-30 border-b ${theme.headerBg} backdrop-blur`}>
        <div className="mx-auto flex max-w-[1800px] flex-wrap items-center gap-3 px-4 py-3">
          <h1 className="text-2xl font-bold">Kitchen</h1>

          {/* View tabs */}
          <div className={`ml-2 flex rounded-xl border ${theme.chipBorder} ${theme.chipBg} p-1`}>
            <button
              type="button"
              onClick={() => setView("active")}
              aria-pressed={view === "active"}
              className={[
                "rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
                view === "active" ? "bg-emerald-500 text-slate-950" : `${theme.mutedText} hover:${theme.text}`,
              ].join(" ")}
            >
              Active · {kdsOrders.length}
            </button>
            <button
              type="button"
              onClick={() => setView("recall")}
              aria-pressed={view === "recall"}
              className={[
                "rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
                view === "recall" ? "bg-emerald-500 text-slate-950" : `${theme.mutedText} hover:${theme.text}`,
              ].join(" ")}
            >
              Recall · {recall.length}
            </button>
          </div>

          {/* Station status pills — also clickable as filters */}
          <div className="hidden items-center gap-1.5 md:flex">
            {STATION_ORDER.map((s) => {
              const c = STATION_COLOR[s];
              const active = stationFilter === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStationFilter(active ? "all" : s)}
                  aria-pressed={active}
                  className={[
                    "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ring-1",
                    c.bg,
                    c.fg,
                    active ? c.ring : "ring-transparent",
                  ].join(" ")}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
                  {STATION_LABEL[s]} · {stationCounts[s]}
                </button>
              );
            })}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShow86(true)}
              className={[
                "inline-flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition-colors",
                theme.chipBorder,
                theme.chipBg,
                soldOutCount > 0 ? "border-red-500/60 text-red-400" : theme.text,
              ].join(" ")}
            >
              Sold out
              {soldOutCount > 0 && (
                <span className="rounded-md bg-red-500 px-1.5 py-0.5 text-xs font-bold text-white">{soldOutCount}</span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setShowBusy(true)}
              className={`inline-flex h-10 items-center rounded-xl border px-3 text-sm font-semibold ${theme.chipBorder} ${theme.chipBg}`}
            >
              Busy times
            </button>
            <Link
              href="/admin/qr"
              className={`inline-flex h-10 items-center rounded-xl border px-3 text-sm font-semibold ${theme.chipBorder} ${theme.chipBg}`}
            >
              QR
            </Link>
            <button
              type="button"
              onClick={() => setAudioOn((v) => !v)}
              aria-pressed={audioOn}
              aria-label={audioOn ? "Mute chime" : "Unmute chime"}
              className={`flex h-10 w-10 items-center justify-center rounded-xl border ${theme.chipBorder} ${theme.chipBg}`}
            >
              {audioOn ? "🔔" : "🔕"}
            </button>
            <button
              type="button"
              onClick={() => setDarkMode((v) => !v)}
              aria-pressed={darkMode}
              aria-label={darkMode ? "Light mode" : "Dark mode"}
              className={`flex h-10 w-10 items-center justify-center rounded-xl border ${theme.chipBorder} ${theme.chipBg}`}
            >
              {darkMode ? "☀" : "☾"}
            </button>
            <LanguageSwitcher />
            <SignOutButton />
          </div>
        </div>

        {/* Filter + density bar */}
        <div className="mx-auto flex max-w-[1800px] flex-wrap items-center gap-2 px-4 pb-3">
          <span className={`text-xs font-semibold uppercase tracking-wider ${theme.mutedText}`}>Stations</span>
          <button
            type="button"
            onClick={() => setStationFilter("all")}
            aria-pressed={stationFilter === "all"}
            className={[
              "rounded-lg px-3 py-1.5 text-sm font-semibold",
              stationFilter === "all" ? "bg-emerald-500 text-slate-950" : `${theme.chipBg} ${theme.mutedText} ring-1 ${theme.chipBorder}`,
            ].join(" ")}
          >
            All · {kdsOrders.length}
          </button>
          {STATION_ORDER.map((s) => {
            const c = STATION_COLOR[s];
            const active = stationFilter === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => setStationFilter(active ? "all" : s)}
                aria-pressed={active}
                className={[
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold ring-1",
                  active ? `${c.bg} ${c.fg} ${c.ring}` : `${theme.chipBg} ${theme.mutedText} ${theme.chipBorder}`,
                ].join(" ")}
              >
                <span className={`h-2 w-2 rounded-full ${c.dot}`} />
                {STATION_LABEL[s]} · {stationCounts[s]}
              </button>
            );
          })}

          <div className={`ml-auto flex rounded-lg border ${theme.chipBorder} ${theme.chipBg} p-0.5`}>
            <button
              type="button"
              onClick={() => setDensity("comfortable")}
              aria-pressed={density === "comfortable"}
              className={[
                "rounded-md px-3 py-1 text-xs font-semibold",
                density === "comfortable" ? "bg-emerald-500 text-slate-950" : theme.mutedText,
              ].join(" ")}
            >
              Comfortable
            </button>
            <button
              type="button"
              onClick={() => setDensity("compact")}
              aria-pressed={density === "compact"}
              className={[
                "rounded-md px-3 py-1 text-xs font-semibold",
                density === "compact" ? "bg-emerald-500 text-slate-950" : theme.mutedText,
              ].join(" ")}
            >
              Compact
            </button>
          </div>
        </div>
      </header>

      {/* ── Main ──────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-[1800px] p-4">
        {/* Pending confirmation strip — kept from the previous KDS so the
            waiter-confirmation step still works end-to-end. */}
        {pendingOrders.length > 0 && (
          <section className="mb-4 rounded-2xl border-2 border-dashed border-amber-500/50 bg-amber-500/5 p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-amber-300">
              Awaiting waiter confirmation — {pendingOrders.length}
            </p>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {pendingOrders.map((order) => {
                const label = order.ticketNumber !== undefined ? String(order.ticketNumber).padStart(3, "0") : order.id.slice(0, 6).toUpperCase();
                return (
                  <li key={order.id} className="rounded-xl border border-slate-700 bg-slate-900 p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xl font-bold tabular-nums text-white">#{label}</span>
                      <span className="text-xs text-slate-400">Table {order.tableNumber}</span>
                    </div>
                    <ul className="mt-2 text-sm text-slate-300">
                      {order.lines.map((l) => (
                        <li key={l.id} className="flex justify-between">
                          <span>{l.itemName}</span>
                          <span className="tabular-nums text-slate-500">×{l.quantity}</span>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => updateOrder(order.id, { status: "new" })}
                        className="flex-1 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => removeOrder(order.id)}
                        className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/20"
                      >
                        Reject
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {!ordersLoaded ? (
          <div className="rounded-2xl border border-slate-700/60 p-12 text-center text-slate-400">Loading…</div>
        ) : view === "active" ? (
          visibleOrders.length === 0 ? (
            <EmptyState
              servedToday={recall.length}
              averageTicketMin={
                recall.length === 0
                  ? 0
                  : Math.round(
                      recall.reduce((sum, e) => sum + Math.max(0, Math.floor((e.bumpedAt - e.order.placedAt) / 60000)), 0) /
                        recall.length,
                    )
              }
              stationStatus={stationCounts}
            />
          ) : (
            <ul
              className={[
                "grid gap-3",
                density === "compact"
                  ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
                  : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
              ].join(" ")}
            >
              {visibleOrders.map((order) => (
                <TicketCard
                  key={order.raw.id}
                  order={order}
                  density={density}
                  onToggleLine={(lineId) => toggleLine(order.raw.id, lineId)}
                  onBump={() => bump(order.raw.id)}
                  onPriority={() => togglePriority(order.raw.id)}
                  onExpand={() => setExpandedId(order.raw.id)}
                />
              ))}
            </ul>
          )
        ) : (
          <RecallView entries={recall} onRecall={recallTicket} />
        )}
      </main>

      {/* ── Toasts (bottom-right) ─────────────────────────────────── */}
      <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={[
              "pointer-events-auto flex items-center gap-3 rounded-xl border-2 px-4 py-3 shadow-lg backdrop-blur",
              t.kind === "success"
                ? "border-emerald-500/60 bg-emerald-500/15 text-emerald-100"
                : t.kind === "warn"
                  ? "border-amber-500/60 bg-amber-500/15 text-amber-100"
                  : "border-blue-500/60 bg-blue-500/15 text-blue-100",
            ].join(" ")}
          >
            <span className="flex-1 text-sm font-semibold">{t.message}</span>
            {t.undo && (
              <button
                type="button"
                onClick={() => {
                  t.undo?.();
                  setToasts((prev) => prev.filter((x) => x.id !== t.id));
                }}
                className="rounded-md bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider hover:bg-white/20"
              >
                Undo
              </button>
            )}
          </div>
        ))}
      </div>

      {/* ── Modals ────────────────────────────────────────────────── */}
      {show86 && (
        <SoldOutModal
          items={menuItems}
          onClose={() => setShow86(false)}
          onUpdate={(updated) => setMenuItems((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))}
        />
      )}
      {expandedOrder && (
        <ExpandedTicket
          order={expandedOrder}
          onClose={() => setExpandedId(null)}
          onToggleLine={(lineId) => toggleLine(expandedOrder.raw.id, lineId)}
          onBump={() => {
            bump(expandedOrder.raw.id);
            setExpandedId(null);
          }}
          onPriority={() => togglePriority(expandedOrder.raw.id)}
        />
      )}
      <BusyHeatmap open={showBusy} onClose={() => setShowBusy(false)} />
    </div>
  );
}

// ── Recall view ────────────────────────────────────────────────────
function RecallView({
  entries,
  onRecall,
}: {
  entries: RecallEntry[];
  onRecall: (orderId: string, bumpedAt: number) => void;
}) {
  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-700/60 bg-slate-900/40 p-12 text-center">
        <p className="text-lg font-semibold text-slate-300">No recently bumped tickets</p>
        <p className="mt-1 text-sm text-slate-500">Bumped tickets stay here for 10 minutes.</p>
      </div>
    );
  }
  const now = Date.now();
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {entries.map((e) => {
        const label = e.order.ticketNumber !== undefined ? String(e.order.ticketNumber).padStart(3, "0") : e.order.id.slice(0, 6).toUpperCase();
        const minsAgo = Math.max(0, Math.floor((now - e.bumpedAt) / 60000));
        const remainingMin = Math.max(0, 10 - minsAgo);
        return (
          <li key={`${e.order.id}-${e.bumpedAt}`} className="rounded-2xl border border-slate-700 bg-slate-900 p-4">
            <div className="flex items-center justify-between">
              <span className="font-mono text-2xl font-bold tabular-nums text-white">#{label}</span>
              <span className="rounded-md bg-slate-800 px-2 py-1 text-xs font-semibold text-slate-300">
                Bumped {minsAgo}m ago
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-400">
              Table {e.order.tableNumber} · {e.order.lines.length} item{e.order.lines.length === 1 ? "" : "s"}
            </p>
            <ul className="mt-3 max-h-32 space-y-0.5 overflow-y-auto text-sm text-slate-300">
              {e.order.lines.map((l) => (
                <li key={l.id} className="flex justify-between">
                  <span className="truncate">{l.itemName}</span>
                  <span className="tabular-nums text-slate-500">×{l.quantity}</span>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => onRecall(e.order.id, e.bumpedAt)}
              className="mt-3 flex h-[60px] w-full items-center justify-center gap-2 rounded-xl bg-amber-500 text-base font-bold text-slate-950 hover:bg-amber-400 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-400/60"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l-4-4 4-4M5 10h11a4 4 0 014 4v0a4 4 0 01-4 4H9" />
              </svg>
              Recall ticket
              <span className="ml-1 text-xs font-medium opacity-70">({remainingMin}m left)</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
