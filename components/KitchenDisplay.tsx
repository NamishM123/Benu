"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  getOrders,
  ORDERS_EVENT,
  removeOrder,
  subscribeToOrders,
  updateOrder,
  type Order,
} from "@/lib/order-store";
import {
  useTranslation,
  t as translate,
  type Lang,
} from "@/lib/i18n";
import { cartLineName } from "@/lib/cart-store";
import BusyHeatmap from "./BusyHeatmap";
import { type MenuItem } from "@/lib/menu";
import {
  STATIONS,
  computeKitchenLoad,
  hasAllergen,
  loadVoided,
  loadView,
  loadHold,
  saveHold,
  nextForStation,
  orderAllergens,
  saveView,
  saveVoided,
  secondsUntilPromise,
  type StationId,
  type ViewMode,
} from "@/lib/kds";
import { cues, setMuted as setAudioMuted } from "@/lib/kds-audio";
import StationLanesView from "./kds/StationLanesView";
import ExpoView from "./kds/ExpoView";
import OverflowMenu from "./kds/OverflowMenu";

function elapsedMMSS(ts: number, now: number = Date.now()): string {
  const s = Math.max(0, Math.floor((now - ts) / 1000));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

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

export default function KitchenDisplay() {
  const { t, lang } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoaded, setOrdersLoaded] = useState(false);
  const [checkedItems, setCheckedItems] = useState<Record<string, Set<string>>>({});
  const [voidedIds, setVoidedIds] = useState<Set<string>>(new Set());
  const [view, setView] = useState<ViewMode>({ kind: "expo" });
  const [muted, setMutedLocal] = useState(false);
  const [holdInfo, setHoldInfo] = useState<{ until: number } | null>(null);
  const seenOrderIds = useRef<Set<string>>(new Set());

  // Tertiary panels
  const [show86Panel, setShow86Panel] = useState(false);
  const [itemSearch, setItemSearch] = useState("");
  const [showBusyHeatmap, setShowBusyHeatmap] = useState(false);
  const [confirmClearId, setConfirmClearId] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<(MenuItem & { id: string })[]>([]);

  // Search + completed-tab fallback for the overflow menu
  const [tab, setTab] = useState<"active" | "completed">("active");
  const [orderSearch, setOrderSearch] = useState("");

  // Persist view/voided on mount
  useEffect(() => {
    setView(loadView());
    setVoidedIds(loadVoided());
    const h = loadHold();
    if (h) setHoldInfo({ until: h.startedAt + h.durationMs });
  }, []);
  useEffect(() => {
    saveView(view);
  }, [view]);

  // 1s tick for timers / hold countdown
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

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
    for (const o of initial) seenOrderIds.current.add(o.id);

    function onChange(e: Event) {
      const detail = (e as CustomEvent<Order[]>).detail;
      if (Array.isArray(detail)) {
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

  // Kitchen load + next recommendation
  const kitchenLoad = useMemo(() => computeKitchenLoad(orders, 3), [orders]);
  const nextRec = useMemo(() => {
    if (view.kind === "station") return nextForStation(orders, view.station);
    return null;
  }, [orders, view]);

  function onHoldToggle() {
    if (holdInfo) {
      saveHold(null);
      setHoldInfo(null);
    } else {
      const startedAt = Date.now();
      const durationMs = 90_000;
      saveHold({
        station: view.kind === "station" ? view.station : "wok",
        startedAt,
        durationMs,
      });
      setHoldInfo({ until: startedAt + durationMs });
    }
  }
  const holdRemainingSec = holdInfo
    ? Math.max(0, Math.ceil((holdInfo.until - Date.now()) / 1000))
    : 0;
  // Auto-clear when hold expires
  useEffect(() => {
    if (holdInfo && holdRemainingSec === 0) {
      saveHold(null);
      setHoldInfo(null);
    }
  }, [holdInfo, holdRemainingSec]);

  function toggleMute() {
    setMutedLocal((m) => {
      const next = !m;
      setAudioMuted(next);
      return next;
    });
  }

  const overflow = (
    <OverflowMenu
      muted={muted}
      onToggleMute={toggleMute}
      onOpenSoldOut={() => setShow86Panel((v) => !v)}
      onOpenBusyTimes={() => setShowBusyHeatmap(true)}
      tab={tab}
      onToggleTab={setTab}
      search={orderSearch}
      onSearchChange={setOrderSearch}
      view={view.kind === "expo" ? "expo" : "lanes"}
      onSwitchView={(v) => {
        if (v === "expo") setView({ kind: "expo" });
        else {
          // Preserve the previously-selected station, else default to wok
          if (view.kind === "station") return;
          setView({ kind: "station", station: "wok" });
        }
      }}
    />
  );

  // Decide what to render
  const isLanesView = view.kind === "station";
  const isExpoView = view.kind === "expo" || view.kind === "all";
  const useFallbackGrid =
    tab === "completed" ||
    orderSearch.trim() !== "";

  const pending = orders.filter((o) => o.status === "pending");

  return (
    <div className="min-h-screen bg-kds-cream">
      {/* Pending confirmation banner */}
      {pending.length > 0 && (
        <div className="mx-auto max-w-[1800px] px-4 pt-4 sm:px-6">
          <PendingStrip
            pending={pending}
            lang={lang}
            t={t}
            onConfirm={(id) => updateOrder(id, { status: "new" })}
            onReject={(id) => removeOrder(id)}
          />
        </div>
      )}

      {/* Sold-out panel — only when explicitly opened */}
      {show86Panel && (
        <div className="mx-auto max-w-[1800px] px-4 pt-3 sm:px-6">
          <SoldOutPanel
            menuItems={menuItems}
            setMenuItems={setMenuItems}
            itemSearch={itemSearch}
            setItemSearch={setItemSearch}
            onClose={() => setShow86Panel(false)}
          />
        </div>
      )}

      <div className="mx-auto w-full max-w-[1800px] p-2 sm:p-4">
        {useFallbackGrid ? (
          <FallbackGrid
            orders={orders}
            tab={tab}
            search={orderSearch}
            lang={lang}
            t={t}
            onClear={(id) => setConfirmClearId(id)}
            rightExtras={overflow}
          />
        ) : isLanesView && view.kind === "station" ? (
          <StationLanesView
            orders={orders}
            station={view.station}
            checked={checkedItems}
            lang={lang}
            onToggleLine={toggleItem}
            isNextOrderId={nextRec?.order.id ?? null}
            load={kitchenLoad}
            onStationChange={(s) => setView({ kind: "station", station: s })}
            onHoldToggle={onHoldToggle}
            holdActive={holdInfo !== null}
            holdRemainingSec={holdRemainingSec}
            rightExtras={overflow}
            nextReason={nextRec?.reason}
          />
        ) : (
          <ExpoView
            orders={orders}
            checkedItems={checkedItems}
            lang={lang}
            onToggleLine={toggleItem}
            onSelectStation={(s) => setView({ kind: "station", station: s })}
            load={kitchenLoad}
            onHoldAll={onHoldToggle}
            holdAllActive={holdInfo !== null}
            rightExtras={overflow}
          />
        )}
      </div>

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

// ─── Pending strip ───────────────────────────────────────────────────────

function PendingStrip({
  pending,
  lang,
  t,
  onConfirm,
  onReject,
}: {
  pending: Order[];
  lang: Lang;
  t: (k: string) => string;
  onConfirm: (id: string) => void;
  onReject: (id: string) => void;
}) {
  return (
    <div className="mb-3 rounded-2xl border-2 border-dashed border-neutral-300 bg-white p-3">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
        Awaiting waiter confirmation — {pending.length} order
        {pending.length > 1 ? "s" : ""}
      </p>
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {pending.map((order) => {
          const shortId =
            order.ticketNumber !== undefined
              ? String(order.ticketNumber).padStart(3, "0")
              : order.id.slice(0, 6).toUpperCase();
          return (
            <li
              key={order.id}
              className="flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-kds-cream/30"
            >
              <div className="flex items-center justify-between gap-2 bg-neutral-100 px-3 py-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-base font-bold tabular-nums text-neutral-700">
                    #{shortId}
                  </span>
                  <span className="text-xs text-neutral-500">
                    {t("tableShort")} {order.tableNumber ?? "—"}
                  </span>
                </div>
                <span className="font-mono text-sm font-bold tabular-nums text-neutral-500">
                  {elapsedMMSS(order.placedAt)}
                </span>
              </div>
              <ul className="flex-1 divide-y divide-neutral-100 px-3 text-[12px]">
                {order.lines.map((line) => (
                  <li
                    key={line.id}
                    className="flex items-baseline justify-between gap-2 py-1.5"
                  >
                    <span className="truncate font-medium text-neutral-800">
                      {cartLineName(line, lang)}
                    </span>
                    <span className="flex-none rounded bg-neutral-900 px-1.5 text-[11px] font-bold tabular-nums text-white">
                      ×{line.quantity}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="flex gap-2 border-t border-neutral-200 bg-neutral-50 px-3 py-2">
                <button
                  type="button"
                  onClick={() => onConfirm(order.id)}
                  className="flex-1 rounded-lg bg-neutral-900 py-1.5 text-xs font-bold text-white hover:bg-neutral-700"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => onReject(order.id)}
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-100"
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
}

// ─── Sold-out panel ──────────────────────────────────────────────────────

function SoldOutPanel({
  menuItems,
  setMenuItems,
  itemSearch,
  setItemSearch,
  onClose,
}: {
  menuItems: (MenuItem & { id: string })[];
  setMenuItems: React.Dispatch<
    React.SetStateAction<(MenuItem & { id: string })[]>
  >;
  itemSearch: string;
  setItemSearch: (s: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="mb-3 rounded-2xl border border-neutral-200 bg-white p-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
          Toggle item availability · 86 list
        </p>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-neutral-500 hover:text-neutral-800"
        >
          close
        </button>
      </div>
      <input
        type="search"
        placeholder="Search items…"
        value={itemSearch}
        onChange={(e) => setItemSearch(e.target.value)}
        className="mb-3 w-full rounded-full border border-neutral-300 bg-white px-4 py-2 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-neutral-500 focus:outline-none"
      />
      {(
        ["Appetizers", "Dry Noodles", "Noodle Soup", "Rice", "Beverages"] as const
      ).map((cat) => {
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
  );
}

// ─── Fallback grid (search + completed tab) ──────────────────────────────

function FallbackGrid({
  orders,
  tab,
  search,
  lang,
  t,
  onClear,
  rightExtras,
}: {
  orders: Order[];
  tab: "active" | "completed";
  search: string;
  lang: Lang;
  t: (k: string) => string;
  onClear: (id: string) => void;
  rightExtras?: React.ReactNode;
}) {
  const pool = orders
    .filter((o) => {
      if (o.status === "pending") return false;
      return tab === "active" ? o.status !== "ready" : o.status === "ready";
    })
    .filter((o) => matchesSearch(o, search));
  const sorted =
    tab === "completed"
      ? [...pool].sort((a, b) => b.placedAt - a.placedAt)
      : [...pool].sort((a, b) => {
          if (!!a.priority !== !!b.priority) return a.priority ? -1 : 1;
          return a.placedAt - b.placedAt;
        });

  return (
    <section className="rounded-3xl border border-kds-cream-deep bg-kds-cream p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h1 className="font-serif text-2xl text-neutral-900">
          {tab === "completed" ? "Completed tickets" : "Search results"}
          {search.trim() && (
            <span className="ml-2 text-base text-neutral-500">
              · &ldquo;{search.trim()}&rdquo;
            </span>
          )}
        </h1>
        <div className="flex items-center gap-3">{rightExtras}</div>
      </div>
      {sorted.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center text-sm text-neutral-600">
          No tickets to show
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sorted.map((order) => {
            const shortId =
              order.ticketNumber !== undefined
                ? String(order.ticketNumber).padStart(3, "0")
                : order.id.slice(0, 6).toUpperCase();
            return (
              <li
                key={order.id}
                className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-kds-cream-deep/70"
              >
                <div className="flex items-center justify-between gap-2 border-b border-neutral-100 bg-kds-cream-light/40 px-4 py-2">
                  <div className="flex items-baseline gap-2">
                    <span className="font-serif text-xl text-neutral-900">
                      T {order.tableNumber ?? "—"}
                    </span>
                    <span className="text-xs tabular-nums text-neutral-500">
                      #{shortId}
                    </span>
                  </div>
                  <span className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                    {order.status}
                  </span>
                </div>
                <ul className="flex-1 divide-y divide-neutral-100 px-4 text-[13px]">
                  {order.lines.map((line) => (
                    <li
                      key={line.id}
                      className="flex items-baseline justify-between gap-2 py-2"
                    >
                      <span className="truncate font-semibold text-neutral-800">
                        {cartLineName(line, lang)}
                      </span>
                      <span className="flex-none rounded bg-neutral-900 px-1.5 text-xs font-bold tabular-nums text-white">
                        ×{line.quantity}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-neutral-200 bg-neutral-50 px-4 py-2">
                  <button
                    type="button"
                    onClick={() => onClear(order.id)}
                    className="w-full rounded-full border border-neutral-300 bg-white py-1.5 text-xs text-neutral-600 hover:bg-neutral-100"
                  >
                    {t("clearOrder")}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

// ─── Clear confirm modal ─────────────────────────────────────────────────

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
            className="flex-1 rounded-full border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-700 hover:bg-neutral-100"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            autoFocus
            className="flex-1 rounded-full bg-neutral-900 px-4 py-2.5 text-sm font-medium text-cream hover:bg-neutral-800"
          >
            {t("clearOrder")}
          </button>
        </div>
      </div>
    </div>
  );
}
