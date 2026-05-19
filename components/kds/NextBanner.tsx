"use client";

import { useState } from "react";
import type { NextRecommendation } from "@/lib/kds";

export default function NextBanner({
  rec,
  context,
}: {
  rec: NextRecommendation;
  context: string; // e.g. "Wok" or "Expo"
}) {
  const [explain, setExplain] = useState(false);
  if (!rec) {
    return (
      <div className="mx-6 mt-4 mb-2 rounded-[28px] border-2 border-sage-dark/40 bg-sage/20 px-6 py-3 sm:mx-10">
        <div className="flex items-center gap-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-600">
            {context}
          </span>
          <p className="font-serif text-lg text-neutral-700">
            All clear · work the queue
          </p>
        </div>
      </div>
    );
  }
  const ticketLabel =
    rec.order.ticketNumber !== undefined
      ? `T ${rec.order.tableNumber} · #${String(rec.order.ticketNumber).padStart(3, "0")}`
      : `T ${rec.order.tableNumber}`;
  return (
    <div className="mx-6 mt-4 mb-2 rounded-[28px] border-2 border-cantaloupe bg-cantaloupe-soft/40 px-6 py-4 sm:mx-10">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-cantaloupe-deep">
            ↗ Next · {context}
          </span>
          <p className="font-serif text-xl text-neutral-900">
            Fire <strong>{ticketLabel}</strong>
            <span className="ml-2 text-base font-normal text-neutral-700">
              · {rec.reason}
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setExplain((v) => !v)}
          className="text-sm text-neutral-500 underline-offset-2 hover:text-neutral-800 hover:underline"
        >
          {explain ? "Hide" : "Why?"}
        </button>
      </div>
      {explain && (
        <p className="mt-2 text-sm text-neutral-600">
          Priority weighs urgency (time to promise), allergen flag, server priority
          star, and items already firing. The highest score is suggested. Tap fire
          to commit.
        </p>
      )}
    </div>
  );
}
