"use client";

import type { SpiceLevel } from "@/lib/menu";

type Props = {
  level: SpiceLevel;
  size?: number;
};

/**
 * Renders 1–3 small chili-pepper icons inline based on spice level.
 * Returns null for non-spicy items so the row collapses cleanly.
 *
 * Visual: red curved pepper with a green stem. A subtle wiggle
 * keyframe animation is applied per-pepper with a staggered delay
 * so they sway slightly out of phase — enough to draw the eye
 * without being distracting.
 */
export default function SpiceChilis({ level, size = 16 }: Props) {
  if (level <= 0) return null;
  return (
    <span
      className="inline-flex items-center align-middle"
      aria-label={`spice level ${level} of 3`}
    >
      {Array.from({ length: level }).map((_, i) => (
        <Chili key={i} size={size} delayMs={i * 180} />
      ))}
    </span>
  );
}

function Chili({ size, delayMs }: { size: number; delayMs: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className="benu-chili"
      style={{ animationDelay: `${delayMs}ms` }}
      aria-hidden="true"
    >
      {/* Green stem with a small leaf curl */}
      <path
        d="M13.5 3.5 C13 4.5 12.4 5.4 12.2 6.4"
        stroke="#16a34a"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M14.6 3.4 C15.5 3 16.3 3.2 16.6 3.9 C16 4.3 15.2 4.4 14.4 4.2 Z"
        fill="#22c55e"
      />
      {/* Red pepper body — tapered teardrop */}
      <path
        d="M12.2 6.2 C9.4 6.2 6.6 7.6 5.4 10.6 C4 14 5.2 18.4 8.4 20 C11 21.4 14.6 20.6 16.6 18.2 C18.6 16 19.2 12.4 17.6 9.6 C16.4 7.4 14.4 6.2 12.2 6.2 Z"
        fill="#dc2626"
        stroke="#991b1b"
        strokeWidth="0.6"
      />
      {/* Highlight stripe */}
      <path
        d="M9 9.4 C8.4 11 8.4 13.4 9.4 15.2"
        stroke="#fca5a5"
        strokeWidth="1.1"
        strokeLinecap="round"
        fill="none"
        opacity="0.85"
      />
    </svg>
  );
}
