"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import LanguageSwitcher from "../LanguageSwitcher";
import SignOutButton from "../SignOutButton";

export default function OverflowMenu({
  muted,
  onToggleMute,
  onOpenSoldOut,
  onOpenBusyTimes,
  tab,
  onToggleTab,
  search,
  onSearchChange,
  view,
  onSwitchView,
}: {
  muted: boolean;
  onToggleMute: () => void;
  onOpenSoldOut: () => void;
  onOpenBusyTimes: () => void;
  tab: "active" | "completed";
  onToggleTab: (t: "active" | "completed") => void;
  search: string;
  onSearchChange: (s: string) => void;
  view: "lanes" | "expo";
  onSwitchView: (v: "lanes" | "expo") => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current) return;
      if (ref.current.contains(e.target as Node)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="More controls"
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50"
      >
        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden
          className="h-5 w-5"
        >
          <circle cx="5" cy="12" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="19" cy="12" r="2" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-72 overflow-hidden rounded-2xl border border-kds-cream-deep bg-white shadow-card-lift"
        >
          {/* View toggle */}
          <div className="border-b border-kds-cream-deep px-4 py-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
              View
            </div>
            <div className="mt-2 flex gap-1 rounded-full border border-neutral-200 bg-white p-1">
              <button
                type="button"
                onClick={() => onSwitchView("lanes")}
                aria-pressed={view === "lanes"}
                className={[
                  "flex-1 rounded-full px-3 py-1.5 text-[12px] font-medium",
                  view === "lanes"
                    ? "bg-cantaloupe-kds text-cream"
                    : "text-neutral-600 hover:text-neutral-900",
                ].join(" ")}
              >
                Lanes
              </button>
              <button
                type="button"
                onClick={() => onSwitchView("expo")}
                aria-pressed={view === "expo"}
                className={[
                  "flex-1 rounded-full px-3 py-1.5 text-[12px] font-medium",
                  view === "expo"
                    ? "bg-cantaloupe-kds text-cream"
                    : "text-neutral-600 hover:text-neutral-900",
                ].join(" ")}
              >
                Expo
              </button>
            </div>
          </div>

          {/* Search + tab */}
          <div className="border-b border-kds-cream-deep px-4 py-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-500">
              Find a ticket
            </div>
            <input
              type="search"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search by ticket, table, item…"
              className="mt-2 w-full rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-[12px] text-neutral-800 placeholder:text-neutral-400 focus:border-neutral-500 focus:outline-none"
            />
            <div className="mt-2 flex gap-1 rounded-full border border-neutral-200 bg-white p-1">
              <button
                type="button"
                onClick={() => onToggleTab("active")}
                aria-pressed={tab === "active"}
                className={[
                  "flex-1 rounded-full px-3 py-1 text-[12px]",
                  tab === "active"
                    ? "bg-neutral-900 text-cream"
                    : "text-neutral-600",
                ].join(" ")}
              >
                Active
              </button>
              <button
                type="button"
                onClick={() => onToggleTab("completed")}
                aria-pressed={tab === "completed"}
                className={[
                  "flex-1 rounded-full px-3 py-1 text-[12px]",
                  tab === "completed"
                    ? "bg-neutral-900 text-cream"
                    : "text-neutral-600",
                ].join(" ")}
              >
                Completed
              </button>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => {
                onOpenSoldOut();
                setOpen(false);
              }}
              className="flex items-center justify-between px-4 py-2.5 text-left text-[13px] text-neutral-800 hover:bg-kds-cream/40"
            >
              Sold out
              <span className="text-[10px] uppercase tracking-wider text-neutral-400">
                86 list
              </span>
            </button>
            <Link
              href="/admin/qr"
              className="flex items-center justify-between px-4 py-2.5 text-left text-[13px] text-neutral-800 hover:bg-kds-cream/40"
              onClick={() => setOpen(false)}
            >
              QR codes
              <span className="text-[10px] uppercase tracking-wider text-neutral-400">
                table tents
              </span>
            </Link>
            <button
              type="button"
              onClick={() => {
                onOpenBusyTimes();
                setOpen(false);
              }}
              className="flex items-center justify-between px-4 py-2.5 text-left text-[13px] text-neutral-800 hover:bg-kds-cream/40"
            >
              Busy times
              <span className="text-[10px] uppercase tracking-wider text-neutral-400">
                heatmap
              </span>
            </button>
            <button
              type="button"
              onClick={() => onToggleMute()}
              className="flex items-center justify-between border-t border-kds-cream-deep px-4 py-2.5 text-left text-[13px] text-neutral-800 hover:bg-kds-cream/40"
            >
              {muted ? "Unmute audio cues" : "Mute audio cues"}
              <span className="text-[10px] uppercase tracking-wider text-neutral-400">
                {muted ? "off" : "on"}
              </span>
            </button>
            <div className="flex items-center justify-between border-t border-kds-cream-deep px-4 py-2.5 text-[13px] text-neutral-800">
              <span>Language</span>
              <LanguageSwitcher />
            </div>
            <div className="border-t border-kds-cream-deep px-4 py-2.5">
              <SignOutButton />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
