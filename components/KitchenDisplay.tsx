"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  getOrders,
  ORDERS_EVENT,
  removeOrder,
  subscribeToOrders,
  updateOrder,
  type Order,
  type OrderStatus,
} from "@/lib/order-store";
import Link from "next/link";
import {
  useTranslation,
  t as translate,
  type Lang,
} from "@/lib/i18n";
import { cartLineName, type CartLine } from "@/lib/cart-store";
import LanguageSwitcher from "./LanguageSwitcher";
import SignOutButton from "./SignOutButton";
import BusyHeatmap from "./BusyHeatmap";
import { type MenuItem } from "@/lib/menu";
import {
  STATIONS,
  classifyLineModifiers,
  computeKitchenLoad,
  hasAllergen,
  loadVoided,
  loadView,
  nextForStation,
  orderAllergens,
  saveView,
  saveVoided,
  secondsUntilPromise,
  stationForLine,
  stationProgress,
  ticketStations,
  ticketTouchesStation,
  type StationId,
  type ViewMode,
} from "@/lib/kds";
import { cues } from "@/lib/kds-audio";
import KitchenLoadBadge from "./kds/KitchenLoadBadge";
import NextBanner from "./kds/NextBanner";
import StationStatusStrip from "./kds/StationStatusStrip";
import { ModifierRow } from "./kds/Modifier";
import HoldButton from "./kds/HoldButton";
import AllergenButton from "./kds/AllergenButton";
import GhostSection from "./kds/GhostSection";
import VoidedCollapsed from "./kds/VoidedCollapsed";
import ViewSwitcher from "./kds/ViewSwitcher";
import StationProgressBadge from "./kds/StationProgressBadge";

function elapsedMMSS(ts: number, now: number = Date.now()): string {
  const s = Math.max(0, Math.floor((now - ts) / 1000));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

function statusLabel(status: OrderStatus, lang: Lang): string {
  if (status === "pending") return "Awaiting confirmation";
  if (status === "new") return translate("statusNew", lang);
  if (status === "cooking") return translate("statusCooking", lang);
  return translate("statusReady", lang);
}

// Substring match across the human-visible fields.
function matchesSearch(order: Order, raw: string): boolean {
  const q = raw.trim().toLowerCase();
  if (q === "") return true;
  if (order.ticketNumber !== undefined) {
    const tn = String(order.ticketNumber);
    if (tn.includes(q)) return true;
    if (String(order.ticketNumber).padStart(3, "0").includes(q)) return true;
  }
  if (order.id.slice(0, 8).toLowerCase().includes(q)) return true;
  if (String(order.tableNumber) === q) return true;
  for (const line of order.lines) {
    if (line.itemName.toLowerCase().includes(q)) return true;
    if (line.itemNameZh?.toLowerCase().includes(q)) return true;
  }
  return false;
}

function sortKitchenOrders(
  orders: Order[],
  tab: "active" | "completed",
): Order[] {
  if (tab === "completed") {
    return [...orders].sort((a, b) => b.placedAt - a.placedAt);
  }
  return [...orders].sort((a, b) => {
    const pa = a.priority === true;
    const pb = b.priority === true;
    if (pa !== pb) return pa ? -1 : 1;
    return a.placedAt - b.placedAt;
  });
}

export default function KitchenDisplay() {
  const { t, lang } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoaded, setOrdersLoaded] = useState(false);
  const [etaDrafts, setEtaDrafts] = useState<Record<string, string>>({});
  const [checkedItems, setCheckedItems] = useState<Record<string, Set<string>>>({});
  const [voidedIds, setVoidedIds] = useState<Set<string>>(new Set());
  const [view, setView] = useState<ViewMode>({ kind: "all" });
  const [muted, setMuted] = useState(false);
  const [armedAllergens, setArmedAllergens] = useState<Set<string>>(new Set());
  const seenOrderIds = useRef<Set<string>>(new Set());

  // Persist view selection
  useEffect(() => {
    setView(loadView());
    setVoidedIds(loadVoided());
  }, []);
  useEffect(() => {
    saveView(view);
  }, [view]);

  function changeView(v: ViewMode) {
    setView(v);
  }

  function toggleItem(orderId: string, lineId: string) {
    setCheckedItems((prev) => {
      const set = new Set(prev[orderId] ?? []);
      if (set.has(lineId)) set.delete(lineId);
      else {
        set.add(lineId);
        cues.bumpConfirm();
      }
      return { ...prev, [orderId]: set };
    });
  }

  function voidLine(lineId: string) {
    setVoidedIds((prev) => {
      const next = new Set(prev);
      next.add(lineId);
      saveVoided(next);
      cues.void();
      return next;
    });
  }
  function unvoidLine(lineId: string) {
    setVoidedIds((prev) => {
      const next = new Set(prev);
      next.delete(lineId);
      saveVoided(next);
      return next;
    });
  }

  const [menuItems, setMenuItems] = useState<(MenuItem & { id: string })[]>([]);
  const [show86Panel, setShow86Panel] = useState(false);
  const [itemSearch, setItemSearch] = useState("");
  const [tab, setTab] = useState<"active" | "completed">("active");
  const [orderSearch, setOrderSearch] = useState("");
  const [showBusyHeatmap, setShowBusyHeatmap] = useState(false);
  const [confirmClearId, setConfirmClearId] = useState<string | null>(null);
  const [, setMinuteTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setMinuteTick((n) => n + 1), 1_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    fetch("/api/menu/items")
      .then((r) => r.json())
      .then((j) => setMenuItems(j.items ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const initial = getOrders();
    setOrders(initial);
    if (initial.length > 0) setOrdersLoaded(true);
    // Seed seen ids so the first load doesn't blast audio cues
    for (const o of initial) seenOrderIds.current.add(o.id);

    function onChange(e: Event) {
      const detail = (e as CustomEvent<Order[]>).detail;
      if (Array.isArray(detail)) {
        // Detect new arrivals and play cues
        for (const o of detail) {
          if (!seenOrderIds.current.has(o.id) && o.status !== "pending") {
            seenOrderIds.current.add(o.id);
            if (hasAllergen(o)) cues.newAllergen();
            else cues.newOrder();
          } else {
            seenOrderIds.current.add(o.id);
          }
        }
        setOrders(detail);
        setOrdersLoaded(true);
      }
    }
    window.addEventListener(ORDERS_EVENT, onChange);
    const unsubscribe = subscribeToOrders({ scope: "all" });
    return () => {
      window.removeEventListener(ORDERS_EVENT, onChange);
      unsubscribe();
    };
  }, []);

  function commitEta(id: string) {
    const raw = etaDrafts[id];
    if (raw === undefined) return;
    const trimmed = raw.trim();
    if (trimmed === "") {
      updateOrder(id, { etaMinutes: undefined });
      return;
    }
    const n = Number(trimmed);
    if (!Number.isFinite(n) || n < 0) return;
    updateOrder(id, { etaMinutes: Math.round(n) });
  }

  // ─── Kitchen load and Next recommendation ────────────────────────────
  const kitchenLoad = useMemo(
    () => computeKitchenLoad(orders, 3),
    // Recompute every render so the minute tick above keeps it fresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [orders, /* tick */],
  );

  const nextRec = useMemo(() => {
    if (view.kind === "station") return nextForStation(orders, view.station);
    if (view.kind === "expo") {
      // Pick the most urgent ticket across all stations
      const open = orders.filter(
        (o) => o.status === "new" || o.status === "cooking",
      );
      if (open.length === 0) return null;
      const sorted = [...open].sort(
        (a, b) => secondsUntilPromise(a) - secondsUntilPromise(b),
      );
      const top = sorted[0];
      const secs = secondsUntilPromise(top);
      const reason =
        secs < 0
          ? `${Math.round(-secs / 60)} min over promise`
          : secs < 120
            ? `${secs}s from promise`
            : top.priority
              ? `priority from server`
              : hasAllergen(top)
                ? `allergen ticket`
                : `oldest open ticket`;
      return { order: top, reason };
    }
    return null;
  }, [orders, view]);

  // ─── Per-view filtering ──────────────────────────────────────────────
  const visibleOrders = useMemo(() => {
    if (view.kind === "station") {
      return orders.filter((o) => ticketTouchesStation(o, view.station));
    }
    return orders;
  }, [orders, view]);

  // Visual context label
  const viewLabel =
    view.kind === "station"
      ? STATIONS.find((s) => s.id === view.station)?.name ?? view.station
      : view.kind === "expo"
        ? "Expo"
        : "All Stations";

  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-10 bg-cream/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1800px] items-center justify-between gap-3 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="block h-[60px] flex-none overflow-hidden sm:h-[72px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/shake-shake-logo.png"
                alt="Shake Shake Fresh Noodle"
                width={1536}
                height={831}
                className="block h-[105px] w-auto max-w-none flex-none -mt-0.5 sm:h-[134px] sm:-mt-1.5"
              />
            </div>
            <span className="hidden text-[11px] font-semibold uppercase tracking-wider text-neutral-500 sm:inline">
              Kitchen · {viewLabel}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <KitchenLoadBadge load={kitchenLoad} />
            <button
              type="button"
              onClick={() => {
                setMuted((m) => {
                  const next = !m;
                  import("@/lib/kds-audio").then((m) => m.setMuted(next));
                  return next;
                });
              }}
              aria-pressed={muted}
              className={[
                "inline-flex h-10 w-10 items-center justify-center rounded-full border shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-700/30",
                muted
                  ? "border-neutral-300 bg-neutral-100 text-neutral-500"
                  : "border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-100",
              ].join(" ")}
              aria-label={muted ? "Unmute audio cues" : "Mute audio cues"}
              title={muted ? "Unmute" : "Mute"}
            >
              {muted ? (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M11 5 6 9H2v6h4l5 4z" />
                  <line x1="22" y1="9" x2="16" y2="15" />
                  <line x1="16" y1="9" x2="22" y2="15" />
                </svg>
              ) : (
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M11 5 6 9H2v6h4l5 4z" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
              )}
            </button>
            <button
              type="button"
              onClick={() => setShow86Panel((v) => !v)}
              aria-pressed={show86Panel}
              className={[
                "inline-flex h-10 items-center rounded-full border px-4 text-base font-medium shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-700/30",
                show86Panel
                  ? "border-cantaloupe bg-cantaloupe text-neutral-900 hover:bg-cantaloupe-soft"
                  : "border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-100",
              ].join(" ")}
            >
              Sold Out
            </button>
            <Link
              href="/admin/qr"
              className="inline-flex h-10 items-center rounded-full border border-neutral-300 bg-white px-4 text-base font-medium text-neutral-900 shadow-sm hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-700/30"
            >
              QR Codes
            </Link>
            <button
              type="button"
              onClick={() => setShowBusyHeatmap(true)}
              className="inline-flex h-10 items-center rounded-full border border-neutral-300 bg-white px-4 text-base font-medium text-neutral-900 shadow-sm hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-700/30"
            >
              {t("busyTimes")}
            </button>
            <LanguageSwitcher />
            <SignOutButton />
          </div>
        </div>
      </header>

      {show86Panel && (
        <div className="border-b border-neutral-200 bg-white">
          <div className="mx-auto max-w-[1800px] px-6 py-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Toggle item availability
            </p>
            <input
              type="search"
              placeholder="Search items…"
              value={itemSearch}
              onChange={(e) => setItemSearch(e.target.value)}
              className="mb-3 w-full rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-neutral-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-700/30"
            />
            {(["Appetizers", "Dry Noodles", "Noodle Soup", "Rice", "Beverages"] as const).map((cat) => {
              const filtered = menuItems.filter(
                (item) =>
                  item.category === cat &&
                  item.name.toLowerCase().includes(itemSearch.toLowerCase()),
              );
              if (filtered.length === 0) return null;
              return (
                <div key={cat} className="mb-4">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                    {cat}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {filtered.map((item) => {
                      const soldOut = item.available === false;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={async () => {
                            const res = await fetch(
                              `/api/menu/items/${encodeURIComponent(item.id)}`,
                              {
                                method: "PATCH",
                                headers: { "content-type": "application/json" },
                                body: JSON.stringify({
                                  available: soldOut ? true : false,
                                }),
                              },
                            );
                            if (res.ok) {
                              const { item: updated } = await res.json();
                              setMenuItems((prev) =>
                                prev.map((p) =>
                                  p.id === updated.id ? updated : p,
                                ),
                              );
                            }
                          }}
                          className={[
                            "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                            soldOut
                              ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                              : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100",
                          ].join(" ")}
                        >
                          {item.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <main className="mx-auto max-w-[1800px] px-6 pb-24 pt-3">
        {/* View switcher row */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <ViewSwitcher view={view} onChange={changeView} />
          {(view.kind === "station" || view.kind === "all") && (
            <HoldButton
              station={view.kind === "station" ? view.station : "all"}
            />
          )}
        </div>

        {/* Station status strip — shows on expo or all */}
        {(view.kind === "expo" || view.kind === "all") && (
          <StationStatusStrip
            orders={orders}
            activeStation={view.kind === "expo" ? "all" : "all"}
            onSelectStation={(s) => {
              if (s === "all") setView({ kind: "all" });
              else setView({ kind: "station", station: s });
            }}
          />
        )}

        {/* Next banner */}
        {(view.kind === "station" || view.kind === "expo") && (
          <NextBanner
            rec={nextRec}
            context={viewLabel}
          />
        )}

        {/* ── Pending confirmation ── */}
        {(() => {
          const pending = orders.filter((o) => o.status === "pending");
          if (pending.length === 0) return null;
          return (
            <div className="mb-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Awaiting waiter confirmation — {pending.length} order
                {pending.length > 1 ? "s" : ""}
              </p>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {pending.map((order) => {
                  const shortId =
                    order.ticketNumber !== undefined
                      ? String(order.ticketNumber).padStart(3, "0")
                      : order.id.slice(0, 6).toUpperCase();
                  return (
                    <li
                      key={order.id}
                      className="flex flex-col overflow-hidden rounded-2xl border-2 border-dashed border-neutral-400 bg-white shadow-sm"
                    >
                      <div className="bg-neutral-200 px-4 py-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-baseline gap-2">
                            <span className="text-xl font-bold tabular-nums text-neutral-700">
                              #{shortId}
                            </span>
                            <span className="text-sm font-medium text-neutral-500">
                              {t("tableShort")} {order.tableNumber ?? "—"}
                            </span>
                          </div>
                          <span className="font-mono text-lg font-bold tabular-nums text-neutral-500">
                            {elapsedMMSS(order.placedAt)}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                          Awaiting Confirmation
                        </p>
                      </div>
                      {order.preferences.length > 0 && (
                        <div className="border-b border-neutral-100 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-800">
                          {order.preferences
                            .map((p) => translate(p, lang))
                            .join(" · ")}
                        </div>
                      )}
                      <ul className="flex-1 divide-y divide-neutral-100 px-4">
                        {order.lines.map((line) => (
                          <li
                            key={line.id}
                            className="flex items-baseline justify-between gap-2 py-2.5"
                          >
                            <span className="text-base font-semibold text-neutral-800">
                              {cartLineName(line, lang)}
                            </span>
                            <span className="flex-none rounded-md bg-neutral-900 px-2 py-0.5 text-sm font-bold tabular-nums text-white">
                              ×{line.quantity}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <div className="flex gap-2 border-t border-neutral-200 bg-neutral-50 px-4 py-3">
                        <button
                          type="button"
                          onClick={() => updateOrder(order.id, { status: "new" })}
                          className="flex-1 rounded-xl bg-neutral-900 py-2.5 text-sm font-bold text-white hover:bg-neutral-700"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => removeOrder(order.id)}
                          className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-700 hover:bg-red-100"
                        >
                          Reject
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })()}

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex w-fit gap-1 rounded-full border border-neutral-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setTab("active")}
              aria-pressed={tab === "active"}
              className={[
                "rounded-full px-5 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-700/30",
                tab === "active"
                  ? "bg-cantaloupe text-neutral-900 hover:bg-cantaloupe-soft"
                  : "text-neutral-600 hover:text-neutral-900",
              ].join(" ")}
            >
              {t("tabActive")}
            </button>
            <button
              type="button"
              onClick={() => setTab("completed")}
              aria-pressed={tab === "completed"}
              className={[
                "rounded-full px-5 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-700/30",
                tab === "completed"
                  ? "bg-cantaloupe text-neutral-900 hover:bg-cantaloupe-soft"
                  : "text-neutral-600 hover:text-neutral-900",
              ].join(" ")}
            >
              {t("tabCompleted")}
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
            >
              <path
                fillRule="evenodd"
                d="M9 3.5a5.5 5.5 0 1 0 3.59 9.67l3.12 3.12a.75.75 0 1 0 1.06-1.06l-3.12-3.12A5.5 5.5 0 0 0 9 3.5ZM5 9a4 4 0 1 1 8 0 4 4 0 0 1-8 0Z"
                clipRule="evenodd"
              />
            </svg>
            <input
              type="search"
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
              placeholder={t("searchOrders")}
              className="w-full rounded-full border border-neutral-300 bg-white py-2 pl-9 pr-9 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-neutral-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-700/30"
            />
            {orderSearch && (
              <button
                type="button"
                onClick={() => setOrderSearch("")}
                aria-label={t("clear")}
                className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
              >
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {(() => {
          if (!ordersLoaded) return null;
          const tabPool = visibleOrders.filter((o) => {
            if (o.status === "pending") return false;
            return tab === "active" ? o.status !== "ready" : o.status === "ready";
          });
          const filtered = sortKitchenOrders(
            tabPool.filter((o) => matchesSearch(o, orderSearch)),
            tab,
          );
          const otherTabMatches = orderSearch.trim()
            ? visibleOrders.filter(
                (o) =>
                  o.status !== "pending" &&
                  (tab === "active"
                    ? o.status === "ready"
                    : o.status !== "ready") &&
                  matchesSearch(o, orderSearch),
              ).length
            : 0;
          const emptyMessage = orderSearch.trim()
            ? t("noOrdersMatchSearch").replace("{q}", orderSearch.trim())
            : tab === "active"
              ? t("noActiveOrders")
              : t("noCompletedOrders");
          return filtered.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center text-sm text-neutral-600">
              {emptyMessage}
              {otherTabMatches > 0 && (
                <div className="mt-2 text-xs text-neutral-500">
                  {t("searchOtherTabHint")
                    .replace("{n}", String(otherTabMatches))
                    .replace(
                      "{tab}",
                      tab === "active" ? t("tabCompleted") : t("tabActive"),
                    )}
                </div>
              )}
            </div>
          ) : (
            <>
              {orderSearch.trim() && (
                <p className="mb-3 text-xs text-neutral-500">
                  {t("searchMatchCount").replace("{n}", String(filtered.length))}
                  {otherTabMatches > 0 && (
                    <>
                      {" · "}
                      {t("searchOtherTabHint")
                        .replace("{n}", String(otherTabMatches))
                        .replace(
                          "{tab}",
                          tab === "active" ? t("tabCompleted") : t("tabActive"),
                        )}
                    </>
                  )}
                </p>
              )}
              <ul className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map((order) => (
                  <TicketCard
                    key={order.id}
                    order={order}
                    view={view}
                    lang={lang}
                    etaDrafts={etaDrafts}
                    setEtaDrafts={setEtaDrafts}
                    commitEta={commitEta}
                    checked={checkedItems[order.id] ?? new Set<string>()}
                    voidedIds={voidedIds}
                    toggleItem={toggleItem}
                    voidLine={voidLine}
                    unvoidLine={unvoidLine}
                    isNext={
                      nextRec !== null && nextRec.order.id === order.id
                    }
                    onClear={() => setConfirmClearId(order.id)}
                  />
                ))}
              </ul>
            </>
          );
        })()}
      </main>

      <BusyHeatmap
        open={showBusyHeatmap}
        onClose={() => setShowBusyHeatmap(false)}
      />

      {(() => {
        const target = confirmClearId
          ? orders.find((o) => o.id === confirmClearId)
          : null;
        if (!target) return null;
        const label =
          target.ticketNumber !== undefined
            ? String(target.ticketNumber).padStart(3, "0")
            : target.id.slice(0, 6).toUpperCase();
        return (
          <ClearOrderConfirm
            ticketLabel={label}
            tableNumber={target.tableNumber}
            onCancel={() => setConfirmClearId(null)}
            onConfirm={() => {
              const id = confirmClearId!;
              setConfirmClearId(null);
              void removeOrder(id);
            }}
          />
        );
      })()}
    </div>
  );
}

// ─── TicketCard ──────────────────────────────────────────────────────────

function TicketCard({
  order,
  view,
  lang,
  etaDrafts,
  setEtaDrafts,
  commitEta,
  checked,
  voidedIds,
  toggleItem,
  voidLine,
  unvoidLine,
  isNext,
  onClear,
}: {
  order: Order;
  view: ViewMode;
  lang: Lang;
  etaDrafts: Record<string, string>;
  setEtaDrafts: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  commitEta: (id: string) => void;
  checked: Set<string>;
  voidedIds: Set<string>;
  toggleItem: (orderId: string, lineId: string) => void;
  voidLine: (lineId: string) => void;
  unvoidLine: (lineId: string) => void;
  isNext: boolean;
  onClear: () => void;
}) {
  const { t } = useTranslation();
  const isPriority = order.priority === true;
  const allergens = orderAllergens(order);
  const isAllergen = allergens.length > 0;
  const ticketLabel =
    order.ticketNumber !== undefined
      ? String(order.ticketNumber).padStart(3, "0")
      : order.id.slice(0, 6).toUpperCase();

  // Determine which lines are "primary" for this view (full color) and which
  // are "ghosts" (other stations, dimmed). In all/expo views, every line is
  // primary so the ghost section stays empty.
  const allLines = order.lines.filter((l) => !voidedIds.has(l.id));
  const voidedLines = order.lines.filter((l) => voidedIds.has(l.id));

  const primaryLines: CartLine[] =
    view.kind === "station"
      ? allLines.filter((l) => stationForLine(l) === view.station)
      : allLines;
  const ghostByStation: { station: StationId; lines: CartLine[] }[] = [];
  if (view.kind === "station") {
    const otherStations = new Set<StationId>();
    for (const l of allLines) {
      const s = stationForLine(l);
      if (s !== view.station) otherStations.add(s);
    }
    for (const s of otherStations) {
      ghostByStation.push({
        station: s,
        lines: allLines.filter((l) => stationForLine(l) === s),
      });
    }
  }

  const stationsHere = ticketStations(order);
  const allLinesChecked =
    allLines.length > 0 && allLines.every((l) => checked.has(l.id));

  // ── Card visual state classes ──
  const ringClass = isAllergen
    ? "ring-4 ring-red-400"
    : isNext
      ? "ring-4 ring-cantaloupe"
      : isPriority
        ? "ring-4 ring-red-300"
        : "ring-1 ring-neutral-200";

  const borderL =
    view.kind === "expo" || view.kind === "all"
      ? allLinesChecked
        ? "border-l-4 border-l-sage-dark"
        : order.status === "cooking"
          ? "border-l-4 border-l-butter"
          : "border-l-4 border-l-red-400"
      : "";

  // ── Header background (preserved original colored KDS header look) ──
  const headerCls = isPriority
    ? "bg-red-500 text-white"
    : order.status === "new"
      ? "bg-cantaloupe text-neutral-900"
      : order.status === "cooking"
        ? "bg-butter text-neutral-900"
        : "bg-sage-dark text-neutral-900";

  const promiseSecs = secondsUntilPromise(order);
  const promiseLabel =
    order.status === "ready"
      ? "Ready"
      : promiseSecs < 0
        ? `${Math.round(-promiseSecs / 60)}m over`
        : `${Math.round(promiseSecs / 60)}m to promise`;

  return (
    <li
      className={[
        "flex flex-col overflow-hidden rounded-[28px] bg-white shadow-sm",
        ringClass,
        borderL,
      ].join(" ")}
    >
      {/* HEAD */}
      <div className={["px-5 py-3", headerCls].join(" ")}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-2xl leading-none">
              T {order.tableNumber ?? "—"}
            </span>
            <span className="text-sm font-medium tabular-nums opacity-80">
              #{ticketLabel}
            </span>
          </div>
          <span className="font-mono text-xl font-bold leading-none tabular-nums">
            {elapsedMMSS(order.placedAt)}
          </span>
        </div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <span className="text-xs font-medium uppercase tracking-wider opacity-80">
            {statusLabel(order.status, lang)} · {promiseLabel}
          </span>
          {order.status !== "ready" && (
            <button
              type="button"
              onClick={() =>
                updateOrder(order.id, { priority: !isPriority })
              }
              aria-pressed={isPriority}
              className="text-sm leading-none opacity-80 hover:opacity-100"
              title={isPriority ? t("unmarkPriority") : t("markPriority")}
            >
              {isPriority ? "★" : "☆"}
            </button>
          )}
        </div>
      </div>

      {/* Allergen banner */}
      {isAllergen && (
        <div className="flex items-center gap-2 border-b border-red-300 bg-red-50 px-5 py-2 text-sm font-semibold uppercase tracking-wider text-red-700">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
          Allergen · {allergens.join(", ")}
        </div>
      )}

      {/* Per-station progress chips (expo / all view) */}
      {(view.kind === "expo" || view.kind === "all") && stationsHere.length > 1 && (
        <div className="flex flex-wrap gap-2 border-b border-neutral-100 bg-cream-light/50 px-5 py-2">
          {stationsHere.map((s) => {
            const p = stationProgress(order, s, checked);
            return (
              <StationProgressBadge
                key={s}
                station={s}
                done={p.done}
                total={p.total}
              />
            );
          })}
        </div>
      )}

      {/* Dietary preferences (non-allergen) */}
      {order.preferences.length > 0 && !isAllergen && (
        <div className="border-b border-neutral-100 bg-amber-50 px-5 py-2 text-xs font-medium text-amber-800">
          {order.preferences.map((p) => translate(p, lang)).join(" · ")}
        </div>
      )}

      {/* BODY - primary lines */}
      <ul className="flex-1 divide-y divide-neutral-100 px-5">
        {primaryLines.map((line) => {
          const done = checked.has(line.id);
          const mods = classifyLineModifiers(line, allergens);
          const lineHasAllergen = mods.some((m) => m.kind === "allergen");
          return (
            <li
              key={line.id}
              className="select-none py-3"
            >
              <div
                className="flex cursor-pointer items-start gap-3"
                onClick={() => toggleItem(order.id, line.id)}
              >
                <div
                  className={[
                    "mt-1 flex h-6 w-6 flex-none items-center justify-center rounded-full border-2 transition-colors",
                    done
                      ? "border-sage-dark bg-sage-dark text-white"
                      : "border-neutral-300 bg-white",
                  ].join(" ")}
                >
                  {done && (
                    <svg
                      viewBox="0 0 12 12"
                      fill="none"
                      className="h-3.5 w-3.5"
                    >
                      <path
                        d="M2 6l3 3 5-5"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="grid grid-cols-[auto_1fr] items-start gap-3">
                    <span
                      className={[
                        "tabular-nums text-3xl font-bold leading-none",
                        done ? "text-neutral-400 line-through" : "text-neutral-900",
                      ].join(" ")}
                    >
                      {line.quantity}
                    </span>
                    <div className="pt-1">
                      <p
                        className={[
                          "text-base font-semibold uppercase tracking-[0.06em] leading-snug",
                          done
                            ? "text-neutral-400 line-through"
                            : "text-neutral-900",
                        ].join(" ")}
                      >
                        {cartLineName(line, lang)}
                      </p>
                      {mods.length > 0 && (
                        <div className="mt-1.5 flex flex-col gap-1">
                          {mods.map((m, i) => (
                            <ModifierRow key={i} mod={m} />
                          ))}
                        </div>
                      )}
                      {view.kind === "station" && (
                        <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400">
                          {STATIONS.find((s) => s.id === stationForLine(line))
                            ?.name}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    voidLine(line.id);
                  }}
                  aria-label="Void item"
                  title="Void this item"
                  className="rounded-full p-1 text-neutral-300 hover:bg-neutral-100 hover:text-red-600"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </li>
          );
        })}

        {/* Voided collapsed */}
        {voidedLines.length > 0 && (
          <li className="py-2">
            <VoidedCollapsed
              lines={voidedLines}
              lang={lang}
              onUnvoid={unvoidLine}
            />
          </li>
        )}

        {/* Ghost section for station view */}
        {view.kind === "station" && ghostByStation.length > 0 && (
          <li className="py-2">
            <GhostSection
              groups={ghostByStation}
              checkedItems={checked}
              lang={lang}
            />
          </li>
        )}
      </ul>

      {/* ETA + actions */}
      <div className="space-y-2 border-t border-neutral-200 bg-neutral-50 px-5 py-3">
        {order.status !== "ready" && (
          <div className="flex items-center gap-2">
            <label className="flex flex-1 items-center gap-2 text-xs text-neutral-500">
              <span className="whitespace-nowrap font-semibold uppercase tracking-wider">
                {t("etaOverrideLabel")}
              </span>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={
                  etaDrafts[order.id] ??
                  (order.etaMinutes !== undefined
                    ? String(order.etaMinutes)
                    : "")
                }
                placeholder="—"
                onClick={(e) => e.stopPropagation()}
                onChange={(e) =>
                  setEtaDrafts((prev) => ({
                    ...prev,
                    [order.id]: e.target.value,
                  }))
                }
                onBlur={() => commitEta(order.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter")
                    (e.target as HTMLInputElement).blur();
                }}
                className="w-16 rounded-lg border border-neutral-300 bg-white px-2 py-1 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none"
              />
              <span className="text-neutral-400">min</span>
            </label>
          </div>
        )}
        <div className="flex gap-2">
          {order.status === "new" && (
            <button
              type="button"
              onClick={() => updateOrder(order.id, { status: "cooking" })}
              className={[
                "flex-1 rounded-full py-3 text-base font-bold transition-colors focus:outline-none",
                isNext
                  ? "bg-cantaloupe text-neutral-900 hover:bg-cantaloupe-soft"
                  : "bg-neutral-900 text-cream hover:bg-neutral-800",
              ].join(" ")}
            >
              Fire
            </button>
          )}
          {order.status === "cooking" && isAllergen && (
            <AllergenButton
              onConfirm={() => updateOrder(order.id, { status: "ready" })}
              label="Confirm & Mark Ready"
            />
          )}
          {order.status === "cooking" && !isAllergen && (
            <button
              type="button"
              onClick={() => updateOrder(order.id, { status: "ready" })}
              className={[
                "flex-1 rounded-full py-3 text-base font-bold transition-colors focus:outline-none",
                allLinesChecked
                  ? "bg-sage-dark text-neutral-900 hover:opacity-90"
                  : "bg-neutral-900 text-cream hover:bg-neutral-800",
              ].join(" ")}
            >
              {allLinesChecked ? "Bump to Expo" : "Mark Ready"}
            </button>
          )}
          {order.status === "ready" && (
            <div className="flex-1 rounded-full bg-sage py-3 text-center text-base font-bold text-neutral-900">
              {statusLabel("ready", lang)}
            </div>
          )}
          <button
            type="button"
            onClick={onClear}
            className="rounded-full border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-600 hover:bg-neutral-100 focus:outline-none"
          >
            {t("clearOrder")}
          </button>
        </div>
      </div>
    </li>
  );
}

function ClearOrderConfirm({
  ticketLabel,
  tableNumber,
  onCancel,
  onConfirm,
}: {
  ticketLabel: string;
  tableNumber: number;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { t } = useTranslation();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onConfirm();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel, onConfirm]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={t("clearOrderTitle")}
        onClick={(e) => e.stopPropagation()}
        className="mx-6 w-full max-w-[340px] rounded-2xl bg-cream p-5 shadow-xl"
      >
        <h3 className="font-serif text-xl text-neutral-900">
          {t("clearOrderTitle")}
        </h3>
        <p className="mt-2 text-sm text-neutral-600">
          {t("clearOrderBody")
            .replace("{ticket}", ticketLabel)
            .replace("{table}", String(tableNumber))}
        </p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-full border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-700/30"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            autoFocus
            className="flex-1 rounded-full bg-neutral-900 px-4 py-2.5 text-sm font-medium text-cream hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-700/30"
          >
            {t("clearOrder")}
          </button>
        </div>
      </div>
    </div>
  );
}
