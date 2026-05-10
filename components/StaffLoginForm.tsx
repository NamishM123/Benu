"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = { next: string };

// Only allow same-origin redirects so a malicious ?next=https://evil... can't
// hijack the post-login redirect.
function safeNext(value: string): string {
  if (!value.startsWith("/") || value.startsWith("//")) return "/kitchen";
  return value;
}

export default function StaffLoginForm({ next }: Props) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/staff/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.status === 401) {
        setError("Wrong password.");
        return;
      }
      if (!res.ok) {
        setError("Sign-in failed. Try again.");
        return;
      }
      router.push(safeNext(next));
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-cream">
      <div className="mx-auto flex min-h-screen max-w-md items-center justify-center px-6">
        <form
          onSubmit={handleSubmit}
          className="w-full rounded-3xl border border-neutral-200 bg-white p-8 shadow-sm"
        >
          <h1 className="font-serif text-2xl text-neutral-900">Staff sign in</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Enter the kitchen password to access orders and QR codes.
          </p>
          <label className="mt-6 block">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
              Password
            </span>
            <input
              type="password"
              autoComplete="current-password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-full border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-900 focus:border-neutral-900 focus:outline-none"
            />
          </label>
          {error && (
            <p className="mt-3 text-xs text-red-600" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting || password.length === 0}
            className="mt-6 w-full rounded-full bg-neutral-900 px-6 py-3 text-sm font-medium text-cream hover:bg-neutral-800 disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </main>
  );
}
