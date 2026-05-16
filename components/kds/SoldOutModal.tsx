"use client";

import { useEffect, useMemo, useState } from "react";
import type { MenuItem } from "@/lib/menu";

const CATEGORIES = ["Appetizers", "Dry Noodles", "Noodle Soup", "Rice", "Beverages"] as const;

export function SoldOutModal({
  items,
  onClose,
  onUpdate,
}: {
  items: (MenuItem & { id: string })[];
  onClose: () => void;
  onUpdate: (item: MenuItem & { id: string }) => void;
}) {
  const [search, setSearch] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter((i) => i.name.toLowerCase().includes(q));
  }, [items, search]);

  const soldOutCount = items.filter((i) => i.available === false).length;

  async function toggle(item: MenuItem & { id: string }) {
    setBusyId(item.id);
    try {
      const next = item.available === false;
      const res = await fetch(`/api/menu/items/${encodeURIComponent(item.id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ available: next }),
      });
      if (res.ok) {
        const { item: updated } = await res.json();
        onUpdate(updated);
      }
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Sold out management"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border-2 border-slate-700 bg-slate-900 shadow-2xl"
      >
        <header className="flex items-center gap-4 border-b border-slate-800 bg-slate-950 p-5">
          <div>
            <h2 className="text-2xl font-bold text-white">Sold Out</h2>
            <p className="text-sm text-slate-400">
              {soldOutCount} item{soldOutCount === 1 ? "" : "s"} marked sold out
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="ml-auto flex h-12 w-12 items-center justify-center rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-6 w-6">
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

        <div className="border-b border-slate-800 p-5">
          <input
            type="search"
            placeholder="Search items…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-base text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {CATEGORIES.map((cat) => {
            const inCat = filtered.filter((i) => i.category === cat);
            if (inCat.length === 0) return null;
            return (
              <section key={cat} className="mb-6 last:mb-0">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">{cat}</h3>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {inCat.map((item) => {
                    const soldOut = item.available === false;
                    const busy = busyId === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        disabled={busy}
                        onClick={() => toggle(item)}
                        aria-pressed={soldOut}
                        className={[
                          "flex min-h-[60px] items-center justify-between gap-3 rounded-xl border-2 px-4 py-3 text-left text-base font-medium transition-colors",
                          soldOut
                            ? "border-red-500/60 bg-red-500/10 text-red-200 hover:bg-red-500/20"
                            : "border-slate-700 bg-slate-950 text-white hover:bg-slate-800",
                          busy ? "opacity-50" : "",
                        ].join(" ")}
                      >
                        <span className="flex-1">{item.name}</span>
                        <span
                          className={[
                            "rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wider",
                            soldOut ? "bg-red-500 text-white" : "bg-emerald-500/20 text-emerald-300",
                          ].join(" ")}
                        >
                          {soldOut ? "Sold out" : "Available"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
          {filtered.length === 0 && (
            <p className="py-12 text-center text-slate-400">No items match &ldquo;{search}&rdquo;</p>
          )}
        </div>
      </div>
    </div>
  );
}
