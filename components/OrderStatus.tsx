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

type Props = { id: string };

function statusHeadline(
  status: OrderStatusValue,
  lang: Lang,
): { title: string; tone: "default" | "ready" } {
  if (status === "ready") {
    return { title: translate("orderReadyHeadline", lang), tone: "ready" };
  }
  if (status === "cooking") {
    return { title: translate("orderCookingHeadline", lang), tone: "default" };
  }
  return { title: translate("orderConfirmedTitle", lang), tone: "default" };
}

function statusPillClasses(status: OrderStatusValue): string {
  if (status === "new") return "bg-cantaloupe text-neutral-900";
  if (status === "cooking") return "bg-butter text-neutral-900";
  return "bg-sage-dark text-neutral-900";
}

function statusLabel(status: OrderStatusValue, lang: Lang): string {
  if (status === "new") return translate("statusNew", lang);
  if (status === "cooking") return translate("statusCooking", lang);
  return translate("statusReady", lang);
}

export default function OrderStatus({ id }: Props) {
  const { t, lang } = useTranslation();
  const [order, setOrder] = useState<Order | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const refresh = () => {
      const found = getOrders().find((o) => o.id === id) ?? null;
      setOrder(found);
    };
    refresh();
    setHydrated(true);

    function onChange() {
      refresh();
    }
    function onStorage(e: StorageEvent) {
      if (e.key === "benu.orders") refresh();
    }
    window.addEventListener(ORDERS_EVENT, onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(ORDERS_EVENT, onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, [id]);

  if (!hydrated) {
    return <div className="min-h-screen bg-cream" />;
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-cream">
        <header className="sticky top-0 z-10 border-b border-neutral-200 bg-cream/95 backdrop-blur">
          <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
            <h1 className="font-serif text-2xl text-neutral-900">
              {t("yourOrder")}
            </h1>
            <LanguageSwitcher />
          </div>
        </header>
        <main className="mx-auto max-w-2xl px-6 py-10">
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center text-sm text-neutral-600">
            {t("orderNotFound")}
          </div>
          <div className="mt-6 flex justify-center">
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

  const headline = statusHeadline(order.status, lang);
  const shortId = order.id.slice(0, 6).toUpperCase();

  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-cream/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-4">
          <h1 className="font-serif text-2xl text-neutral-900">
            {t("yourOrder")}
          </h1>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-8">
        <div
          className={[
            "rounded-3xl px-6 py-8 text-center shadow-sm",
            headline.tone === "ready"
              ? "bg-sage text-neutral-900"
              : "bg-white text-neutral-900",
          ].join(" ")}
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            {t("orderNumber")} #{shortId}
          </p>
          <h2 className="mt-2 font-serif text-3xl">{headline.title}</h2>
          {order.status === "new" && (
            <p className="mt-1 text-sm text-neutral-600">
              {t("orderConfirmedSubtitle")}
            </p>
          )}

          <div className="mt-5 inline-flex items-center gap-2">
            <span
              className={[
                "rounded-full px-3 py-1 text-xs font-medium",
                statusPillClasses(order.status),
              ].join(" ")}
            >
              {statusLabel(order.status, lang)}
            </span>
          </div>

          <div className="mt-6 border-t border-neutral-200 pt-6">
            {order.etaMinutes !== undefined ? (
              <>
                <p className="text-xs uppercase tracking-wider text-neutral-500">
                  {t("estimatedReady")}
                </p>
                <p className="mt-1 font-serif text-4xl tabular-nums text-neutral-900">
                  {order.etaMinutes}{" "}
                  <span className="text-base text-neutral-600">
                    {t("minutesShort")}
                  </span>
                </p>
              </>
            ) : (
              <p className="text-sm italic text-neutral-600">
                {t("waitingForEta")}
              </p>
            )}
          </div>
        </div>

        <section className="mt-6 rounded-2xl border border-neutral-200 bg-white p-5">
          <ul className="divide-y divide-neutral-200">
            {order.lines.map((line) => (
              <li key={line.id} className="py-3">
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
                  <ul className="mt-1 space-y-0.5 text-xs text-neutral-500">
                    {line.selections.map((s) => (
                      <li key={s.groupLabel}>
                        {s.groupLabel}: {s.choiceLabels.join(", ")}
                      </li>
                    ))}
                  </ul>
                )}
                {line.specialRequest && (
                  <p className="mt-1 text-xs italic text-neutral-500">
                    {t("noteLabel")}: {line.specialRequest}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>

        <div className="mt-6 flex justify-center">
          <Link
            href="/menu"
            className="rounded-full border border-neutral-300 bg-white px-6 py-3 text-sm font-medium text-neutral-900 hover:bg-neutral-100"
          >
            {t("orderAnother")}
          </Link>
        </div>
      </main>
    </div>
  );
}
