"use client";

export type Channel = "dine" | "togo" | "delivery";

export default function ChannelPill({
  channel = "dine",
  size = "md",
}: {
  channel?: Channel;
  size?: "sm" | "md";
}) {
  const map: Record<Channel, { bg: string; text: string; label: string }> = {
    dine: { bg: "bg-sage", text: "text-neutral-900", label: "Dine in" },
    togo: { bg: "bg-cantaloupe-soft", text: "text-neutral-900", label: "To go" },
    delivery: {
      bg: "bg-butter-soft",
      text: "text-neutral-900",
      label: "Delivery",
    },
  };
  const s = map[channel];
  const pad =
    size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]";
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold uppercase tracking-wider ${s.bg} ${s.text} ${pad}`}
    >
      {s.label}
    </span>
  );
}
