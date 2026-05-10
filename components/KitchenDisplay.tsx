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
import { useTranslation, t as translate, type Lang } from "@/lib/i18n";
import LanguageSwitcher from "./LanguageSwitcher";
import SignOutButton from "./SignOutButton";
import { type MenuItem } from "@/lib/menu";

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function statusLabel(status: OrderStatus, lang: Lang): string {
  if (status === "new") return translate("statusNew", lang);
  if (status === "cooking") return translate("statusCooking", lang);
  return translate("statusReady", lang);
}

function statusClasses(status: OrderStatus): string {
  if (status === "new") return "bg-cantaloupe text-neutral-900";
  if (status === "cooking") return "bg-butter text-neutral-900";
  return "bg-sage-dark text-neutral-900";
}

export default function KitchenDisplay() {
  const { t, lang } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [etaDrafts, setEtaDrafts] = useState<Record<string, string>>({});
  const [menuItems, setMenuItems] = useState<(MenuItem & { id: string })[]>([]);
  const [show86Panel, setShow86Panel] = useState(false);
  const [tab, setTab] = useState<"active" | "completed">("active");

  useEffect(() => {
    fetch("/api/menu/items")
      .then((r) => r.json())
      .then((j) => setMenuItems(j.items ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setOrders(getOrders());
    function onChange(e: Event) {
      const detail = (e as CustomEvent<Order[]>).detail;
      if (Array.isArray(detail)) setOrders(detail);
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
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-cream/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-6 py-4">
          <h1 className="font-serif text-2xl text-neutral-900 sm:text-3xl">
            {t("kitchenTitle")}
          </h1>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShow86Panel((v) => !v)}
              className="rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-100"
            >
              86 items
            </button>
            <Link
              href="/admin/qr"
              className="rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-100"
            >
              QR codes
            </Link>
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
            <div className="flex flex-wrap gap-2">
              {menuItems.map((item) => {
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
                    {soldOut ? "🚫 " : "✓ "}
                    {item.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-6xl px-6 py-6">
        <div className="mb-5 flex gap-1 rounded-full border border-neutral-200 bg-white p-1 w-fit">
          <button
            type="button"
            onClick={() => setTab("active")}
            className={[
              "rounded-full px-5 py-1.5 text-sm font-medium transition-colors",
              tab === "active"
                ? "bg-neutral-900 text-cream"
                : "text-neutral-600 hover:text-neutral-900",
            ].join(" ")}
          >
            Active
          </button>
          <button
            type="button"
            onClick={() => setTab("completed")}
            className={[
              "rounded-full px-5 py-1.5 text-sm font-medium transition-colors",
              tab === "completed"
                ? "bg-neutral-900 text-cream"
                : "text-neutral-600 hover:text-neutral-900",
            ].join(" ")}
          >
            Completed
          </button>
        </div>

        {(() => {
          const filtered = orders.filter((o) =>
            tab === "active" ? o.status !== "ready" : o.status === "ready"
          );
          return filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center text-sm text-neutral-600">
            {tab === "active" ? "No active orders" : "No completed orders"}
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((order) => {
              const shortId = order.id.slice(0, 6).toUpperCase();
              const etaValue =
                etaDrafts[order.id] ??
                (order.etaMinutes !== undefined
                  ? String(order.etaMinutes)
                  : "");

              return (
                <li
                  key={order.id}
                  className="flex flex-col gap-3 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
                >
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
                          {t("orderNumber")} #{shortId}
                        </p>
                        <p className="mt-0.5 text-xs text-neutral-500">
                          {t("placedAt")} · {formatTime(order.placedAt)}
                        </p>
                      </div>
                    </div>
                    <span
                      className={[
                        "rounded-full px-3 py-1 text-xs font-medium",
                        statusClasses(order.status),
                      ].join(" ")}
                    >
                      {statusLabel(order.status, lang)}
                    </span>
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
                            {lang === "zh" && line.itemNameZh
                              ? line.itemNameZh
                              : line.itemName}
                          </p>
                          <p className="text-sm tabular-nums text-neutral-700">
                            ×{line.quantity}
                          </p>
                        </div>
                        {line.selections.length > 0 && (
                          <ul className="mt-1 space-y-0.5 text-xs text-neutral-600">
                            {line.selections.map((s) => (
                              <li key={s.groupLabel}>
                                {s.groupLabel}: {s.choiceLabels.join(", ")}
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
                          className="rounded-full border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none"
                        />
                      </label>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {order.status === "new" && (
                      <button
                        type="button"
                        onClick={() =>
                          updateOrder(order.id, { status: "cooking" })
                        }
                        className="flex-1 rounded-full bg-neutral-900 px-4 py-2 text-xs font-medium text-cream hover:bg-neutral-800"
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
                        className="flex-1 rounded-full bg-neutral-900 px-4 py-2 text-xs font-medium text-cream hover:bg-neutral-800"
                      >
                        {t("markReady")}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeOrder(order.id)}
                      className="rounded-full border border-neutral-300 px-4 py-2 text-xs text-neutral-700 hover:bg-neutral-100"
                    >
                      {t("clearOrder")}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        );
        })()}
      </main>
    </div>
  );
}
