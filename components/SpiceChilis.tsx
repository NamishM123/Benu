"use client";

import type { SpiceLevel } from "@/lib/menu";

type Props = {
  level: SpiceLevel;
  size?: number;
};

/**
 * Renders 1–3 chili-pepper icons inline based on spice level using the
 * single Chili.svg asset. Returns null for non-spicy items.
 *
 * Each chili is an inline-block <img> so they flow with the title text
 * and sit on the same baseline as the last word of the title — they
 * only wrap to a new visual line if the title itself wraps. No
 * animation: peppers are static.
 */
export default function SpiceChilis({ level, size = 20 }: Props) {
  if (level <= 0) return null;
  return (
    <>
      {Array.from({ length: level }).map((_, i) => (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          key={i}
          src="/Chili.svg"
          alt=""
          width={size}
          height={size}
          className="ml-1 inline-block align-middle"
          aria-hidden="true"
        />
      ))}
      <span className="sr-only">spice level {level} of 3</span>
    </>
  );
}
