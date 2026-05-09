"use client";

import { useEffect, useMemo, useState } from "react";
import {
  getOrders,
  ORDERS_EVENT,
  removeOrder,
  updateOrder,
  type Order,
  type OrderStatus,
} from "@/lib/order-store";
import { estimateOrderMinutes, TABLE_COUNT } from "@/lib/prep-time";
import { useTranslation, t as translate, type Lang } from "@/lib/i18n";
import LanguageSwitcher from "./LanguageSwitcher";

type TableShape = "round" | "rect";

type TableSpec = {
  n: number;
  shape: TableShape;
  /** Center x in % of floor width */
  x: number;
  /** Center y in % of floor height */
  y: number;
};

// 4 two-tops along the top window, 3 round four-tops in the middle, 4 two-tops
// along the bottom — eleven seats arranged like a small dining room.
const TABLES: TableSpec[] = [
  { n: 1, shape: "rect", x: 14, y: 18 },
  { n: 2, shape: "rect", x: 36, y: 18 },
  { n: 3, shape: "rect", x: 58, y: 18 },
  { n: 4, shape: "rect", x: 80, y: 18 },

  { n: 5, shape: "round", x: 22, y: 50 },
  { n: 6, shape: "round", x: 50, y: 50 },
  { n: 7, shape: "round", x: 78, y: 50 },

  { n: 8, shape: "rect", x: 14, y: 82 },
  { n: 9, shape: "rect", x: 36, y: 82 },
  { n: 10, shape: "rect", x: 58, y: 82 },
  { n: 11, shape: "rect", x: 80, y: 82 },
];

if (TABLES.length !== TABLE_COUNT) {
  throw new Error("TABLES layout out of sync with TABLE_COUNT");
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function statusLabel(status: OrderStatus, lang: Lang): string {
  if (status === "new") return translate("statusNew", lang);
  if (status === "cooking") return translate("statusCooking", lang);
  return translate("statusReady", lang);
}

function statusFill(status: OrderStatus): string {
  if (status === "new") return "bg-cantaloupe text-neutral-900";
  if (status === "cooking") return "bg-butter text-neutral-900";
  return "bg-sage-dark text-neutral-900";
}

// Hottest-status drives the table colour. new > cooking > ready.
function hottestStatus(orders: Order[]): OrderStatus | null {
  if (orders.length === 0) return null;
  if (orders.some((o) => o.status === "new")) return "new";
  if (orders.some((o) => o.status === "cooking")) return "cooking";
  return "ready";
}

function tableLineCount(orders: Order[]): number {
  let n = 0;
  for (const o of orders) for (const l of o.lines) n += l.quantity;
  return n;
}

export default function KitchenDisplay() {
  const { t, lang } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [etaDrafts, setEtaDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    setOrders(getOrders());
    function onChange(e: Event) {
      const detail = (e as CustomEvent<Order[]>).detail;
      if (Array.isArray(detail)) setOrders(detail);
    }
    function onStorage(e: StorageEvent) {
      if (e.key === "benu.orders") setOrders(getOrders());
    }
    window.addEventListener(ORDERS_EVENT, onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(ORDERS_EVENT, onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  // Close detail modal with Escape
  useEffect(() => {
    if (selectedTable === null) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSelectedTable(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedTable]);

  const ordersByTable = useMemo(() => {
    const map = new Map<number, Order[]>();
    for (let i = 1; i <= TABLE_COUNT; i++) map.set(i, []);
    for (const o of orders) {
      const n = o.tableNumber ?? 0;
      if (n >= 1 && n <= TABLE_COUNT) map.get(n)!.push(o);
    }
    return map;
  }, [orders]);

  const selectedOrders =
    selectedTable !== null ? ordersByTable.get(selectedTable) ?? [] : [];

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
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-cream/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <h1 className="font-serif text-2xl text-neutral-900 sm:text-3xl">
            {t("kitchenTitle")}
          </h1>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="relative w-full overflow-hidden rounded-3xl border-[6px] border-neutral-300 bg-[#F1E4CB] shadow-inner">
          {/* Wood-plank floor stripes */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, rgba(120,80,40,0.06) 0px, rgba(120,80,40,0.06) 1px, transparent 1px, transparent 36px), repeating-linear-gradient(90deg, rgba(120,80,40,0.04) 0px, rgba(120,80,40,0.04) 1px, transparent 1px, transparent 90px)",
            }}
          />

          <div className="relative aspect-[16/10] w-full">
            {/* Window strip along top wall */}
            <div
              aria-hidden="true"
              className="absolute left-[3%] right-[3%] top-[2%] h-[3%] rounded-full border border-sky-300/70 bg-sky-100/70"
            />
            <div
              aria-hidden="true"
              className="absolute left-1/2 top-[2%] -translate-x-1/2 -translate-y-[110%] text-[10px] font-semibold uppercase tracking-[0.25em] text-neutral-500"
            >
              {t("floorWindow")}
            </div>

            {/* Kitchen pass on the right wall */}
            <div
              aria-hidden="true"
              className="absolute right-[1.5%] top-[35%] flex h-[30%] w-[3%] items-center justify-center rounded-l-md bg-neutral-700/80 text-[9px] font-semibold uppercase tracking-[0.3em] text-cream [writing-mode:vertical-rl]"
            >
              {t("floorKitchen")}
            </div>

            {/* Entrance arrow at the bottom-left */}
            <div
              aria-hidden="true"
              className="absolute bottom-[1.5%] left-[2%] flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-700 shadow-sm"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
              {t("floorEntrance")}
            </div>

            {TABLES.map((spec) => {
              const tableOrders = ordersByTable.get(spec.n) ?? [];
              const status = hottestStatus(tableOrders);
              const lineCount = tableLineCount(tableOrders);
              const isActive = status !== null;
              const sizeClass =
                spec.shape === "round" ? "h-[26%] w-[16%]" : "h-[15%] w-[12%]";
              const shapeClass =
                spec.shape === "round" ? "rounded-full" : "rounded-xl";
              const fillClass = !isActive
                ? "bg-white/90 border-neutral-400 text-neutral-700"
                : status === "new"
                ? "bg-cantaloupe border-cantaloupe-deep text-neutral-900"
                : status === "cooking"
                ? "bg-butter border-butter-deep text-neutral-900"
                : "bg-sage-dark border-sage-dark text-neutral-900";

              return (
                <button
                  key={spec.n}
                  type="button"
                  onClick={() => setSelectedTable(spec.n)}
                  aria-label={`${translate("tableLabel", lang)} ${spec.n}`}
                  style={{ left: `${spec.x}%`, top: `${spec.y}%` }}
                  className={[
                    "absolute -translate-x-1/2 -translate-y-1/2 border-2 shadow-md transition-all duration-150",
                    "flex flex-col items-center justify-center gap-0.5",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-700/40",
                    "hover:scale-[1.04] active:scale-[0.97]",
                    sizeClass,
                    shapeClass,
                    fillClass,
                  ].join(" ")}
                >
                  {/* Chair markers — small dashes around the table */}
                  {spec.shape === "rect" ? (
                    <>
                      <span
                        aria-hidden="true"
                        className="absolute -top-1.5 left-1/2 h-1.5 w-3 -translate-x-1/2 rounded-sm bg-neutral-400/70"
                      />
                      <span
                        aria-hidden="true"
                        className="absolute -bottom-1.5 left-1/2 h-1.5 w-3 -translate-x-1/2 rounded-sm bg-neutral-400/70"
                      />
                    </>
                  ) : (
                    <>
                      <span
                        aria-hidden="true"
                        className="absolute -top-1.5 left-1/2 h-1.5 w-3 -translate-x-1/2 rounded-full bg-neutral-400/70"
                      />
                      <span
                        aria-hidden="true"
                        className="absolute -bottom-1.5 left-1/2 h-1.5 w-3 -translate-x-1/2 rounded-full bg-neutral-400/70"
                      />
                      <span
                        aria-hidden="true"
                        className="absolute -left-1.5 top-1/2 h-3 w-1.5 -translate-y-1/2 rounded-full bg-neutral-400/70"
                      />
                      <span
                        aria-hidden="true"
                        className="absolute -right-1.5 top-1/2 h-3 w-1.5 -translate-y-1/2 rounded-full bg-neutral-400/70"
                      />
                    </>
                  )}

                  <span className="font-serif text-lg leading-none sm:text-xl">
                    {spec.n}
                  </span>
                  {isActive && (
                    <span className="text-[9px] font-semibold uppercase tracking-wider leading-tight">
                      {lineCount}{" "}
                      {lineCount === 1
                        ? translate("dish", lang)
                        : translate("dishes", lang)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 border-t border-neutral-300/60 bg-cream/70 px-4 py-2 text-[11px] text-neutral-700">
            <LegendDot
              className="bg-cantaloupe border-cantaloupe-deep"
              label={t("statusNew")}
            />
            <LegendDot
              className="bg-butter border-butter-deep"
              label={t("statusCooking")}
            />
            <LegendDot
              className="bg-sage-dark border-sage-dark"
              label={t("statusReady")}
            />
            <LegendDot
              className="bg-white border-neutral-400"
              label={t("tableEmpty")}
            />
          </div>
        </div>
      </main>

      {selectedTable !== null && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center"
          onClick={() => setSelectedTable(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${t("tableLabel")} ${selectedTable}`}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[520px] max-h-[88vh] overflow-y-auto rounded-t-3xl bg-cream shadow-xl sm:rounded-3xl"
          >
            <header className="sticky top-0 z-10 flex items-baseline justify-between border-b border-neutral-200 bg-cream/95 px-6 py-4 backdrop-blur">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  {t("tableLabel")}
                </p>
                <h2 className="font-serif text-3xl text-neutral-900">
                  {selectedTable}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTable(null)}
                aria-label={t("close")}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-200 text-neutral-700 hover:bg-neutral-300"
              >
                ×
              </button>
            </header>

            <div className="px-6 py-4">
              {selectedOrders.length === 0 ? (
                <p className="rounded-xl border border-dashed border-neutral-300 bg-white px-4 py-12 text-center text-sm text-neutral-500">
                  {t("tableEmpty")}
                </p>
              ) : (
                <ul className="space-y-3">
                  {selectedOrders.map((order) => {
                    const shortId = order.id.slice(0, 6).toUpperCase();
                    const overallEta =
                      order.etaMinutes ?? estimateOrderMinutes(order.lines);
                    const etaValue =
                      etaDrafts[order.id] ??
                      (order.etaMinutes !== undefined
                        ? String(order.etaMinutes)
                        : "");
                    return (
                      <li
                        key={order.id}
                        className="rounded-2xl border border-neutral-200 bg-white p-4"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                              #{shortId} · {formatTime(order.placedAt)}
                            </p>
                            <p className="mt-0.5 text-xs text-neutral-700">
                              {t("estTime")} ~{overallEta} {t("minutesShort")}
                            </p>
                          </div>
                          <span
                            className={[
                              "rounded-full px-2.5 py-1 text-[11px] font-medium",
                              statusFill(order.status),
                            ].join(" ")}
                          >
                            {statusLabel(order.status, lang)}
                          </span>
                        </div>

                        {order.preferences.length > 0 && (
                          <p className="mt-2 rounded-md bg-cantaloupe-soft/40 px-2 py-1 text-[11px] text-neutral-800">
                            <span className="font-semibold uppercase tracking-wider">
                              {t("preferencesLabel")}:
                            </span>{" "}
                            {order.preferences
                              .map((p) => translate(p, lang))
                              .join(" · ")}
                          </p>
                        )}

                        <ul className="mt-2 divide-y divide-neutral-200">
                          {order.lines.map((line) => (
                            <li key={line.id} className="py-2">
                              <div className="flex items-baseline justify-between gap-2">
                                <p className="text-sm font-medium text-neutral-900">
                                  {lang === "zh" && line.itemNameZh
                                    ? line.itemNameZh
                                    : line.itemName}
                                  <span className="ml-1 text-xs text-neutral-500">
                                    ×{line.quantity}
                                  </span>
                                </p>
                              </div>
                              {line.selections.length > 0 && (
                                <ul className="mt-0.5 space-y-0.5 text-[11px] text-neutral-600">
                                  {line.selections.map((s) => (
                                    <li key={s.groupLabel}>
                                      {s.groupLabel}:{" "}
                                      {s.choiceLabels.join(", ")}
                                    </li>
                                  ))}
                                </ul>
                              )}
                              {line.specialRequest && (
                                <p className="mt-0.5 text-[11px] italic text-neutral-700">
                                  {t("noteLabel")}: {line.specialRequest}
                                </p>
                              )}
                            </li>
                          ))}
                        </ul>

                        <label className="mt-2 flex items-center gap-2 border-t border-neutral-200 pt-2">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
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
                            className="w-20 rounded-full border border-neutral-300 bg-white px-3 py-1 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none"
                          />
                        </label>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {order.status === "new" && (
                            <button
                              type="button"
                              onClick={() =>
                                updateOrder(order.id, { status: "cooking" })
                              }
                              className="flex-1 rounded-full bg-neutral-900 px-3 py-2 text-xs font-medium text-cream hover:bg-neutral-800"
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
                              className="flex-1 rounded-full bg-neutral-900 px-3 py-2 text-xs font-medium text-cream hover:bg-neutral-800"
                            >
                              {t("markReady")}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeOrder(order.id)}
                            className="rounded-full border border-neutral-300 px-3 py-2 text-xs text-neutral-700 hover:bg-neutral-100"
                          >
                            {t("clearOrder")}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={["inline-block h-3 w-3 rounded-full border", className].join(
          " ",
        )}
      />
      {label}
    </span>
  );
}
