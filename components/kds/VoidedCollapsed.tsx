"use client";

import { useState } from "react";
import type { CartLine } from "@/lib/cart-store";
import { cartLineName } from "@/lib/cart-store";
import type { Lang } from "@/lib/i18n";

export default function VoidedCollapsed({
  lines,
  lang,
  onUnvoid,
}: {
  lines: CartLine[];
  lang: Lang;
  onUnvoid?: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  if (lines.length === 0) return null;
  return (
    <div className="rounded-lg bg-neutral-100 px-3 py-1.5">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between text-xs italic text-neutral-400 hover:text-neutral-700"
      >
        <span>
          {lines.length} item{lines.length > 1 ? "s" : ""} voided
        </span>
        <span aria-hidden>{expanded ? "−" : "+"}</span>
      </button>
      {expanded && (
        <ul className="mt-1 space-y-1">
          {lines.map((l) => (
            <li
              key={l.id}
              className="flex items-center justify-between gap-2 text-xs text-neutral-500"
            >
              <span className="line-through">
                {l.quantity} · {cartLineName(l, lang)}
              </span>
              {onUnvoid && (
                <button
                  type="button"
                  onClick={() => onUnvoid(l.id)}
                  className="text-[11px] text-neutral-500 underline-offset-2 hover:text-neutral-800 hover:underline"
                >
                  restore
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
