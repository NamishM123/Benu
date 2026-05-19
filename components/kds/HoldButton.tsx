"use client";

import { useEffect, useState } from "react";
import {
  loadHold,
  saveHold,
  type HoldState,
  type StationId,
} from "@/lib/kds";

export default function HoldButton({
  station,
  durationSeconds = 90,
}: {
  station: StationId | "all";
  durationSeconds?: number;
}) {
  const [hold, setHold] = useState<HoldState | null>(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    setHold(loadHold());
    const id = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const remaining =
    hold === null
      ? 0
      : Math.max(0, Math.ceil((hold.startedAt + hold.durationMs - Date.now()) / 1000));
  const active = remaining > 0;

  // Clear once expired
  useEffect(() => {
    if (hold && remaining === 0) {
      saveHold(null);
      setHold(null);
    }
  }, [hold, remaining]);

  function start() {
    const next: HoldState = {
      station: station === "all" ? "wok" : station,
      startedAt: Date.now(),
      durationMs: durationSeconds * 1000,
    };
    saveHold(next);
    setHold(next);
  }

  function cancel() {
    saveHold(null);
    setHold(null);
  }

  if (active) {
    const mm = Math.floor(remaining / 60);
    const ss = remaining % 60;
    return (
      <button
        type="button"
        onClick={cancel}
        className="inline-flex h-10 items-center gap-2 rounded-full border-2 border-butter bg-butter-soft px-4 text-sm font-semibold text-neutral-900 shadow-sm hover:bg-butter focus:outline-none"
      >
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
          <rect x="6" y="5" width="4" height="14" />
          <rect x="14" y="5" width="4" height="14" />
        </svg>
        Hold{" "}
        <span className="tabular-nums">
          {String(mm).padStart(1, "0")}:{String(ss).padStart(2, "0")}
        </span>
        <span className="text-xs font-normal text-neutral-700">tap to cancel</span>
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={start}
      className="inline-flex h-10 items-center gap-2 rounded-full border border-neutral-300 bg-white px-4 text-sm font-medium text-neutral-700 shadow-sm hover:bg-neutral-100 focus:outline-none"
      title="Pause new fires for 90 seconds"
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
        <rect x="6" y="5" width="4" height="14" />
        <rect x="14" y="5" width="4" height="14" />
      </svg>
      90s Hold
    </button>
  );
}
