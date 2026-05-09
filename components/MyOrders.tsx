"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getOrders,
  ORDERS_EVENT,
  type Order,
  type OrderStatus as OrderStatusValue,
} from "@/lib/order-store";
import { useTranslation, t as translate, type Lang } from "@/lib/i18n";
import LanguageSwitcher from "./LanguageSwitcher";

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function statusLabel(status: OrderStatusValue, lang: Lang): string {
  if (status === "new") return translate("statusNew", lang);
  if (status === "cooking") return translate("statusCooking", lang);
  return translate("statusReady", lang);
}

function statusClasses(status: OrderStatusValue): string {
  if (status === "new") return "bg-cantaloupe text-neutral-900";
  if (status === "cooking") return "bg-butter text-neutral-900";
  return "bg-sage-dark text-neutral-900";
}

export default function MyOrders() {
  const { t, lang } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setOrders(getOrders());
    setHydrated(true);
    function onChange() {
      setOrders(getOrders());
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

  if (!hydrated) {
    return <div className="min-h-screen bg-cream" />;
  }

  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-cream/95 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <h1 className="font-serif text-2xl text-neutral-900 sm:text-3xl">
            {t("myOrdersTitle")}
          </h1>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-8">
        <p className="mb-6 text-sm text-neutral-600">{t("myOrdersSubtitle")}</p>

        {orders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center text-sm text-neutral-600">
            {t("myOrdersEmpty")}
          </div>
        ) : (
          <ul className="space-y-4">
            {orders.map((order) => {
              const shortId = order.id.slice(0, 6).toUpperCase();
              const itemCount = order.lines.reduce(
                (sum, l) => sum + l.quantity,
                0,
              );
              const itemWord =
                itemCount === 1
                  ? t("itemsCount_one")
                  : t("itemsCount_other");

              return (
                <li
                  key={order.id}
                  className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                        {t("orderNumber")} #{shortId}
                        {order.tableNumber !== undefined &&
                          ` · ${t("tableLabel")} ${order.tableNumber}`}
                      </p>
                      <p className="mt-0.5 text-xs text-neutral-500">
                        {t("placedAt")} · {formatTime(order.placedAt)}
                      </p>
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

                  <div className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm text-neutral-700">
                    <span>
                      {itemCount} {itemWord}
                    </span>
                    {order.etaMinutes !== undefined ? (
                      <span className="text-neutral-900">
                        {t("estimatedReady")}:{" "}
                        <span className="font-medium tabular-nums">
                          {order.etaMinutes} {t("minutesShort")}
                        </span>
                      </span>
                    ) : (
                      <span className="italic text-neutral-500">
                        {t("waitingForEta")}
                      </span>
                    )}
                  </div>

                  <ul className="mt-3 divide-y divide-neutral-200 border-t border-neutral-200">
                    {order.lines.map((line) => (
                      <li key={line.id} className="py-2">
                        <div className="flex items-baseline justify-between gap-3">
                          <p className="text-sm font-medium text-neutral-900">
                            {lang === "zh" && line.itemNameZh
                              ? line.itemNameZh
                              : line.itemName}
                          </p>
                          <p className="text-sm tabular-nums text-neutral-700">
                            ×{line.quantity}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 flex justify-end">
                    <Link
                      href={`/order/${order.id}`}
                      className="rounded-full border border-neutral-300 bg-white px-4 py-2 text-xs font-medium text-neutral-900 hover:bg-neutral-100"
                    >
                      {t("viewOrder")}
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-8 flex justify-center">
          <Link
            href="/menu"
            className="rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-cream hover:bg-neutral-800"
          >
            {t("backToMenu")}
          </Link>
        </div>
      </main>
    </div>
  );
}
