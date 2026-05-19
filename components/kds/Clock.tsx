"use client";

import { useEffect, useState } from "react";

function format(now: Date): { time: string; ampm: string } {
  const h24 = now.getHours();
  const m = now.getMinutes();
  const ampm = h24 >= 12 ? "PM" : "AM";
  const h12 = ((h24 + 11) % 12) + 1;
  return { time: `${h12}:${String(m).padStart(2, "0")}`, ampm };
}

export default function Clock() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const { time, ampm } = now ? format(now) : { time: "—:—", ampm: "" };
  return (
    <div className="flex items-baseline gap-1.5 tabular-nums text-neutral-900">
      <span className="text-2xl font-semibold">{time}</span>
      <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
        {ampm}
      </span>
    </div>
  );
}
