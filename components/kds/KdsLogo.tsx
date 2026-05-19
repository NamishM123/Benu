"use client";

// CSS-rendered Shake·Shake wordmark — matches the kds-shared.jsx Logo from
// the Claude Design handoff so the KDS header reads as the same product as
// the customer site without depending on the PNG asset (which is sized for
// the menu hero, not a kitchen tablet header).

export default function KdsLogo() {
  return (
    <div className="flex items-baseline gap-1.5">
      <span
        className="font-serif text-2xl leading-none text-neutral-900"
        style={{ letterSpacing: "-0.01em" }}
      >
        Shake<span className="font-normal italic">·</span>Shake
      </span>
      <span className="text-[9px] font-semibold uppercase tracking-[0.18em] text-neutral-700 opacity-60">
        Fresh Noodle
      </span>
    </div>
  );
}
