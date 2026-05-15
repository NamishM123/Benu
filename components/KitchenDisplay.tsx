"use client";

import { useEffect, useState } from "react";
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
  languageMeta,
  useTranslation,
  t as translate,
  translateChoiceLabel,
  translateGroupLabel,
  type Lang,
} from "@/lib/i18n";
import { cartLineName } from "@/lib/cart-store";
import LanguageSwitcher from "./LanguageSwitcher";
import SignOutButton from "./SignOutButton";
import BusyHeatmap from "./BusyHeatmap";
import { type MenuItem } from "@/lib/menu";

function minutesSince(ts: number, now: number = Date.now()): number {
  return Math.max(0, Math.floor((now - ts) / 60000));
}

function formatPlacedAt(ts: number, lang: Lang): string {
  const locale = languageMeta(lang).locale;
  return new Date(ts).toLocaleString(locale, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusLabel(status: OrderStatus, lang: Lang): string {
  if (status === "pending") return "Awaiting confirmation";
  if (status === "new") return translate("statusNew", lang);
  if (status === "cooking") return translate("statusCooking", lang);
  return translate("statusReady", lang);
}

function statusClasses(status: OrderStatus): string {
  if (status === "pending") return "bg-neutral-200 text-neutral-700";
  if (status === "new") return "bg-cantaloupe text-neutral-900";
  if (status === "cooking") return "bg-butter text-neutral-900";
  return "bg-sage-dark text-neutral-900";
}

// Substring match across the human-visible fields: ticket number (with and
// without leading zeros), table number, item name (en + zh), and the UUID
// short prefix as a fallback.
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

// Active tab: starred orders first, then strict FIFO (oldest order = next to cook).
// Completed tab: newest first so just-finished tickets are at the top.
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
  const [menuItems, setMenuItems] = useState<(MenuItem & { id: string })[]>([]);
  const [show86Panel, setShow86Panel] = useState(false);
  const [itemSearch, setItemSearch] = useState("");
  const [tab, setTab] = useState<"active" | "completed">("active");
  const [orderSearch, setOrderSearch] = useState("");
  const [showBusyHeatmap, setShowBusyHeatmap] = useState(false);
  const [confirmClearId, setConfirmClearId] = useState<string | null>(null);
  // Tick once a minute so the per-card "Nm" pill stays current even when the
  // orders list isn't changing.
  const [, setMinuteTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setMinuteTick((n) => n + 1), 30_000);
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
    // If the cache already has data (warm mount), skip the loading flash.
    if (initial.length > 0) setOrdersLoaded(true);
    function onChange(e: Event) {
      const detail = (e as CustomEvent<Order[]>).detail;
      if (Array.isArray(detail)) {
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

  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-10 bg-cream/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="block overflow-hidden h-[60px] sm:h-[72px] flex-none">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/shake-shake-logo.png"
                alt="Shake Shake Fresh Noodle"
                width={1536}
                height={831}
                className="block h-[105px] w-auto max-w-none sm:h-[134px] -mt-0.5 sm:-mt-1.5 flex-none"
              />
            </div>
            <h1 className="font-serif text-2xl text-neutral-900 sm:text-3xl">
              Kitchen
            </h1>
          </div>
          <div className="flex items-center gap-3">
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
              Sold out
            </button>
            <Link
              href="/admin/qr"
              className="inline-flex h-10 items-center rounded-full border border-neutral-300 bg-white px-4 text-base font-medium text-neutral-900 shadow-sm hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-700/30"
            >
              QR codes
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
          <div className="mx-auto max-w-6xl px-6 py-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Toggle item availability
            </p>
            <input
              type="search"
              placeholder="Search items…"
              value={itemSearch}
              onChange={(e) => setItemSearch(e.target.value)}
              className="mb-3 w-full rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-500 focus-visible:ring-2 focus-visible:ring-neutral-700/30"
            />
            {(["Appetizers", "Dry Noodles", "Noodle Soup", "Rice", "Beverages"] as const).map((cat) => {
                const filtered = menuItems.filter(
                  (item) =>
                    item.category === cat &&
                    item.name.toLowerCase().includes(itemSearch.toLowerCase())
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
                              const res = await fetch(`/api/menu/items/${encodeURIComponent(item.id)}`, {
                                method: "PATCH",
                                headers: { "content-type": "application/json" },
                                body: JSON.stringify({ available: soldOut ? true : false }),
                              });
                              if (res.ok) {
                                const { item: updated } = await res.json();
                                setMenuItems((prev) =>
                                  prev.map((p) => (p.id === updated.id ? updated : p))
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

      <main className="mx-auto max-w-6xl px-6 py-6">

        {/* ── Pending confirmation ── */}
        {(() => {
          const pending = orders.filter((o) => o.status === "pending");
          if (pending.length === 0) return null;
          return (
            <div className="mb-6">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Awaiting waiter confirmation — {pending.length} order{pending.length > 1 ? "s" : ""}
              </p>
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {pending.map((order) => {
                  const shortId = order.ticketNumber !== undefined
                    ? String(order.ticketNumber).padStart(3, "0")
                    : order.id.slice(0, 6).toUpperCase();
                  return (
                    <li key={order.id} className="flex flex-col gap-3 rounded-2xl border-2 border-dashed border-neutral-300 bg-white p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="flex h-12 w-12 flex-none flex-col items-center justify-center rounded-xl bg-neutral-200 text-neutral-700">
                            <span className="text-[9px] font-semibold uppercase tracking-wider text-neutral-500">
                              {t("tableShort")}
                            </span>
                            <span className="font-serif text-lg leading-none tabular-nums">
                              {order.tableNumber ?? "—"}
                            </span>
                          </div>
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                              Order #{shortId}
                            </p>
                            <p className="mt-0.5 text-xs text-neutral-500">
                              {formatTime(order.placedAt)}
                            </p>
                          </div>
                        </div>
                        <span className="rounded-full bg-neutral-200 px-3 py-1 text-xs font-medium text-neutral-600">
                          Pending
                        </span>
                      </div>
                      <ul className="divide-y divide-neutral-100 text-sm">
                        {order.lines.map((line) => (
                          <li key={line.id} className="flex items-baseline justify-between gap-2 py-1.5">
                            <span className="text-neutral-800">
                              {lang === "zh" && line.itemNameZh ? line.itemNameZh : line.itemName}
                            </span>
                            <span className="tabular-nums text-neutral-500">×{line.quantity}</span>
                          </li>
                        ))}
                      </ul>
                      {order.preferences.length > 0 && (
                        <p className="text-xs text-neutral-500">
                          {order.preferences.map((p) => translate(p, lang)).join(" · ")}
                        </p>
                      )}
                      <div className="flex gap-2 border-t border-neutral-100 pt-3">
                        <button
                          type="button"
                          onClick={() => updateOrder(order.id, { status: "new" })}
                          className="flex-1 rounded-full bg-neutral-900 px-4 py-2 text-xs font-medium text-cream hover:bg-neutral-800"
                        >
                          Confirm order
                        </button>
                        <button
                          type="button"
                          onClick={() => removeOrder(order.id)}
                          className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-medium text-red-700 hover:bg-red-100"
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
          <div className="flex gap-1 rounded-full border border-neutral-200 bg-white p-1 w-fit">
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
            Active
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
            Completed
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
              className="w-full rounded-full border border-neutral-300 bg-white pl-9 pr-9 py-2 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-500 focus-visible:ring-2 focus-visible:ring-neutral-700/30"
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
          const tabPool = orders.filter((o) => {
            if (o.status === "pending") return false; // shown above in pending section
            return tab === "active" ? o.status !== "ready" : o.status === "ready";
          });
          const filtered = sortKitchenOrders(
            tabPool.filter((o) => matchesSearch(o, orderSearch)),
            tab,
          );
          const otherTabMatches = orderSearch.trim()
            ? orders.filter(
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
              ? "No active orders"
              : "No completed orders";
          return filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center text-sm text-neutral-600">
            {emptyMessage}
            {otherTabMatches > 0 && (
              <div className="mt-2 text-xs text-neutral-500">
                {t("searchOtherTabHint")
                  .replace("{n}", String(otherTabMatches))
                  .replace(
                    "{tab}",
                    tab === "active" ? "Completed" : "Active",
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
                      tab === "active" ? "Completed" : "Active",
                    )}
                </>
              )}
            </p>
          )}
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((order) => {
              const ticketLabel =
                order.ticketNumber !== undefined
                  ? String(order.ticketNumber).padStart(3, "0")
                  : order.id.slice(0, 6).toUpperCase();
              const etaValue =
                etaDrafts[order.id] ??
                (order.etaMinutes !== undefined
                  ? String(order.etaMinutes)
                  : "");
              const isPriority = order.priority === true;

              return (
                <li
                  key={order.id}
                  className={[
                    "flex flex-col gap-3 rounded-2xl border bg-white p-5 shadow-sm",
                    isPriority
                      ? "border-red-300 ring-1 ring-red-200"
                      : "border-neutral-200",
                  ].join(" ")}
                >
                  {isPriority && (
                    <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-1.5 text-red-700">
                      <svg
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden
                        className="h-4 w-4 flex-none"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495ZM10 6a.75.75 0 0 1 .75.75v3.5a.75.75 0 0 1-1.5 0v-3.5A.75.75 0 0 1 10 6Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-[11px] font-semibold uppercase tracking-wider">
                        {t("priorityBadge")}
                      </span>
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 flex-none flex-col items-center justify-center rounded-xl bg-neutral-900 text-cream">
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-cream/70">
                          {t("tableShort")}
                        </span>
                        <span className="font-serif text-lg leading-none tabular-nums">
                          {order.tableNumber ?? "—"}
                        </span>
                      </div>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                          {t("orderNumber")} #{ticketLabel}
                        </p>
                        <p className="mt-0.5 text-xs text-neutral-500">
                          {t("placedAt")} · {formatPlacedAt(order.placedAt, lang)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {order.status !== "ready" && (
                        <span
                          className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium tabular-nums text-neutral-700"
                          aria-label={t("waitedMinutes").replace(
                            "{n}",
                            String(minutesSince(order.placedAt)),
                          )}
                        >
                          {t("waitedShort").replace(
                            "{n}",
                            String(minutesSince(order.placedAt)),
                          )}
                        </span>
                      )}
                      {order.status !== "ready" && (
                        <button
                          type="button"
                          onClick={() =>
                            updateOrder(order.id, { priority: !isPriority })
                          }
                          title={
                            isPriority
                              ? t("unmarkPriority")
                              : t("markPriority")
                          }
                          aria-label={
                            isPriority
                              ? t("unmarkPriority")
                              : t("markPriority")
                          }
                          aria-pressed={isPriority}
                          className={[
                            "flex h-7 w-7 items-center justify-center rounded-full border text-sm leading-none transition-colors",
                            isPriority
                              ? "border-red-300 bg-red-100 text-red-600 hover:bg-red-200"
                              : "border-neutral-300 bg-white text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700",
                          ].join(" ")}
                        >
                          <span aria-hidden>
                            {isPriority ? "★" : "☆"}
                          </span>
                        </button>
                      )}
                      <span
                        className={[
                          "rounded-full px-3 py-1 text-xs font-medium",
                          statusClasses(order.status),
                        ].join(" ")}
                      >
                        {statusLabel(order.status, lang)}
                      </span>
                    </div>
                  </div>

                  {order.preferences.length > 0 && (
                    <div className="rounded-lg bg-cantaloupe-soft/40 px-3 py-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-700">
                        {t("preferencesLabel")}
                      </p>
                      <p className="mt-0.5 text-sm text-neutral-900">
                        {order.preferences
                          .map((p) => translate(p, lang))
                          .join(" · ")}
                      </p>
                    </div>
                  )}

                  <ul className="divide-y divide-neutral-200">
                    {order.lines.map((line) => (
                      <li key={line.id} className="py-2">
                        <div className="flex items-baseline justify-between gap-3">
                          <p className="font-medium text-neutral-900">
                            {cartLineName(line, lang)}
                          </p>
                          <p className="text-sm tabular-nums text-neutral-700">
                            ×{line.quantity}
                          </p>
                        </div>
                        {line.selections.length > 0 && (
                          <ul className="mt-1 space-y-0.5 text-xs text-neutral-600">
                            {line.selections.map((s) => (
                              <li key={s.groupLabel}>
                                {translateGroupLabel(s.groupLabel, lang)}:{" "}
                                {s.choiceLabels
                                  .map((c) =>
                                    translateChoiceLabel(c, s.groupLabel, lang),
                                  )
                                  .join(", ")}
                              </li>
                            ))}
                          </ul>
                        )}
                        {line.specialRequest && (
                          <p className="mt-1 text-xs italic text-neutral-700">
                            {t("noteLabel")}: {line.specialRequest}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>

                  {order.status !== "ready" && (
                    <div className="flex items-end gap-2 border-t border-neutral-200 pt-3">
                      <label className="flex flex-1 flex-col gap-1">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                          {t("etaOverrideLabel")}
                        </span>
                        <input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          value={etaValue}
                          placeholder="—"
                          onChange={(e) =>
                            setEtaDrafts((prev) => ({
                              ...prev,
                              [order.id]: e.target.value,
                            }))
                          }
                          onBlur={() => commitEta(order.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              (e.target as HTMLInputElement).blur();
                            }
                          }}
                          className="rounded-full border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none focus:border-neutral-500 focus-visible:ring-2 focus-visible:ring-neutral-700/30"
                        />
                      </label>
                    </div>
                  )}

                  <div className="mt-auto flex flex-wrap gap-2 pt-2">
                    {order.status === "new" && (
                      <button
                        type="button"
                        onClick={() =>
                          updateOrder(order.id, { status: "cooking" })
                        }
                        className="flex-1 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-cream hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-700/30"
                      >
                        {t("startCooking")}
                      </button>
                    )}
                    {order.status === "cooking" && (
                      <button
                        type="button"
                        onClick={() =>
                          updateOrder(order.id, { status: "ready" })
                        }
                        className="flex-1 rounded-full bg-neutral-900 px-5 py-2.5 text-sm font-medium text-cream hover:bg-neutral-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-700/30"
                      >
                        {t("markReady")}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setConfirmClearId(order.id)}
                      className="rounded-full border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-700/30"
                    >
                      {t("clearOrder")}
                    </button>
                  </div>
                </li>
              );
            })}
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
