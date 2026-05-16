"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SignOutButton() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function signOut() {
    setSubmitting(true);
    try {
      await fetch("/api/staff/logout", { method: "POST" });
    } finally {
      router.push("/staff/login");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={submitting}
      className="inline-flex h-10 items-center rounded-full border border-neutral-300 bg-white px-4 text-base font-medium text-neutral-900 shadow-sm hover:bg-neutral-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-700/30 disabled:opacity-60 print:hidden"
    >
      Sign Out
    </button>
  );
}
