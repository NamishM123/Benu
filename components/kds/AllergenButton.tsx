"use client";

import { useEffect, useRef, useState } from "react";

// Two-tap allergen confirmation. First tap arms the button, second tap within
// 3 seconds commits. After 3 seconds the arm resets. Friction is the feature —
// a cook bumping on autopilot cannot accidentally clear an allergen ticket.

export default function AllergenButton({
  onConfirm,
  label = "Confirm & Mark Ready",
}: {
  onConfirm: () => void;
  label?: string;
}) {
  const [armed, setArmed] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function handle() {
    if (!armed) {
      setArmed(true);
      timer.current = setTimeout(() => setArmed(false), 3000);
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    setArmed(false);
    onConfirm();
  }

  if (armed) {
    return (
      <button
        type="button"
        onClick={handle}
        className="flex-1 animate-pulse rounded-full bg-red-600 px-5 py-3 text-base font-bold text-white shadow-sm hover:bg-red-700 focus:outline-none"
      >
        Tap again to confirm
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={handle}
      className="flex-1 rounded-full border-2 border-red-500 bg-red-50 px-5 py-3 text-base font-bold text-red-700 shadow-sm hover:bg-red-100 focus:outline-none"
    >
      <span aria-hidden className="mr-1">
        ⚠
      </span>
      {label}
    </button>
  );
}
