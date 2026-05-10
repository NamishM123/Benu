"use client";

import type { SpiceLevel } from "@/lib/menu";

type Props = {
  level: SpiceLevel;
  size?: number;
};

/**
 * Renders 1–3 chili-pepper icons inline based on spice level using the
 * single Chili.svg asset. Returns null for non-spicy items so the row
 * collapses cleanly.
 *
 * Each pepper has a subtle wiggle keyframe applied with a staggered
 * delay so they sway slightly out of phase.
 */
export default function SpiceChilis({ level, size = 18 }: Props) {
  if (level <= 0) return null;
  return (
    <span
      className="inline-flex items-center gap-0.5 align-middle"
      aria-label={`spice level ${level} of 3`}
    >
      {Array.from({ length: level }).map((_, i) => (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          key={i}
          src="/Chili.svg"
          alt=""
          width={size}
          height={size}
          className="benu-chili"
          style={{ animationDelay: `${i * 180}ms` }}
        />
      ))}
    </span>
  );
}
