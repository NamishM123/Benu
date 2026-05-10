"use client";

import type { SpiceLevel } from "@/lib/menu";

type Props = {
  level: SpiceLevel;
  size?: number;
};

/**
 * Renders 1–3 chili-pepper icons inline based on spice level using the
 * single Chili.png asset. Returns null for non-spicy items.
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
          src="/Chili.png"
          alt=""
          width={size}
          height={size}
          className={[
            "relative -top-1 inline-block align-middle",
            i === 0 ? "ml-0.5" : "-ml-2",
          ].join(" ")}
          aria-hidden="true"
        />
      ))}
      <span className="sr-only">spice level {level} of 3</span>
    </>
  );
}
