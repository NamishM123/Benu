"use client";

import type { ClassifiedModifier } from "@/lib/kds";

export function ModifierRow({ mod }: { mod: ClassifiedModifier }) {
  if (mod.kind === "allergen") {
    return (
      <div className="inline-flex items-center gap-2 rounded-md border border-red-300 bg-red-50 px-2 py-1 text-sm font-semibold uppercase tracking-wider text-red-700">
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
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
        </svg>
        {mod.text}
      </div>
    );
  }
  if (mod.kind === "preference") {
    return (
      <p className="relative pl-3 text-sm font-medium text-cantaloupe-deep">
        <span className="absolute left-0 top-[0.65em] h-px w-1.5 bg-cantaloupe-deep/50" />
        {mod.text}
      </p>
    );
  }
  return (
    <p className="relative pl-3 text-sm text-neutral-500">
      <span className="absolute left-0 top-[0.65em] h-px w-1.5 bg-neutral-300" />
      {mod.text}
    </p>
  );
}
