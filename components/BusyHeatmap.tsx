"use client";

import { useEffect, useMemo } from "react";
import type { Order } from "@/lib/order-store";
import { useTranslation, type Lang } from "@/lib/i18n";

type Props = {
  open: boolean;
  orders: Order[];
  onClose: () => void;
};

const HOURS = Array.from({ length: 24 }, (_, h) => h);
// Sunday-first to match JS Date.getDay().
const DAYS = [0, 1, 2, 3, 4, 5, 6];

function bucketCounts(orders: Order[]): number[][] {
  const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
  for (const o of orders) {
    const d = new Date(o.placedAt);
    grid[d.getDay()][d.getHours()]++;
  }
  return grid;
}

function intensityClass(count: number, max: number): string {
  if (count === 0 || max === 0) return "bg-neutral-100";
  const ratio = count / max;
  if (ratio <= 0.25) return "bg-orange-200";
  if (ratio <= 0.5) return "bg-orange-300";
  if (ratio <= 0.75) return "bg-orange-500";
  return "bg-orange-700";
}

function dayShort(weekday: number, lang: Lang): string {
  // Jan 7 2024 was a Sunday — offset by weekday to get a reference date.
  const ref = new Date(2024, 0, 7 + weekday);
  const locale = lang === "zh" ? "zh-CN" : "en-US";
  return ref.toLocaleDateString(locale, { weekday: "short" });
}

function hourLabel(hour: number, lang: Lang): string {
  if (hour % 3 !== 0) return "";
  if (lang === "zh") return `${hour}:00`;
  const h = hour % 12 || 12;
  return `${h}${hour < 12 ? "a" : "p"}`;
}

function tooltipFor(
  weekday: number,
  hour: number,
  count: number,
  lang: Lang,
): string {
  const day = dayShort(weekday, lang);
  const hr = lang === "zh"
    ? `${hour}:00–${hour + 1}:00`
    : `${hour % 12 || 12}${hour < 12 ? "am" : "pm"}`;
  return `${day} ${hr} · ${count}`;
}

export default function BusyHeatmap({ open, orders, onClose }: Props) {
  const { t, lang } = useTranslation();

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const { grid, max, total } = useMemo(() => {
    const g = bucketCounts(orders);
    let m = 0;
    let tot = 0;
    for (const row of g) for (const v of row) {
      if (v > m) m = v;
      tot += v;
    }
    return { grid: g, max: m, total: tot };
  }, [orders]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("busyTimesTitle")}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto bg-cream shadow-xl sm:rounded-3xl"
      >
        <header className="flex items-start justify-between gap-3 px-6 pt-5 pb-3 sm:pt-4">
          <div>
            <h2 className="font-serif text-xl text-neutral-900 sm:text-2xl">
              {t("busyTimesTitle")}
            </h2>
            <p className="mt-0.5 text-xs text-neutral-500">
              {t("busyTimesSubtitle").replace("{n}", String(total))}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-neutral-500 hover:bg-neutral-200 hover:text-neutral-900"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
            </svg>
          </button>
        </header>

        <div className="px-6 pb-6">
          {total === 0 ? (
            <div className="rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-12 text-center text-sm text-neutral-600">
              {t("busyTimesEmpty")}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full">
                <div className="grid grid-cols-[auto_repeat(24,minmax(1.5rem,1fr))] gap-1 text-[10px] text-neutral-500">
                  <div />
                  {HOURS.map((h) => (
                    <div key={h} className="text-center font-medium tabular-nums">
                      {hourLabel(h, lang)}
                    </div>
                  ))}
                  {DAYS.map((weekday) => (
                    <div key={`row-${weekday}`} className="contents">
                      <div className="pr-2 text-right text-xs font-medium leading-7 text-neutral-700">
                        {dayShort(weekday, lang)}
                      </div>
                      {HOURS.map((h) => {
                        const count = grid[weekday][h];
                        return (
                          <div
                            key={`${weekday}-${h}`}
                            title={tooltipFor(weekday, h, count, lang)}
                            className={[
                              "aspect-square w-full rounded-sm",
                              intensityClass(count, max),
                            ].join(" ")}
                          />
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {total > 0 && (
            <div className="mt-4 flex items-center justify-end gap-2 text-[11px] text-neutral-500">
              <span>{t("legendLess")}</span>
              <div className="h-3 w-3 rounded-sm bg-neutral-100" />
              <div className="h-3 w-3 rounded-sm bg-orange-200" />
              <div className="h-3 w-3 rounded-sm bg-orange-300" />
              <div className="h-3 w-3 rounded-sm bg-orange-500" />
              <div className="h-3 w-3 rounded-sm bg-orange-700" />
              <span>{t("legendMore")}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
