"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import SignOutButton from "./SignOutButton";

type Card = { table: number; url: string; dataUrl: string };

function fmt(ms: number): string {
  const s = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function QrAdmin() {
  const [cards, setCards] = useState<Card[]>([]);
  const [expiresAt, setExpiresAt] = useState<number>(0);
  const [remaining, setRemaining] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function fetchAndGenerate() {
    setLoading(true);
    try {
      const res = await fetch("/api/qr/tokens");
      const { entries, expiresAt: exp } = await res.json();
      setExpiresAt(exp);

      const next: Card[] = [];
      for (const { table, url } of entries as { table: number; url: string }[]) {
        const dataUrl = await QRCode.toDataURL(url, {
          width: 512,
          margin: 1,
          errorCorrectionLevel: "M",
          color: { dark: "#1a1a1a", light: "#ffffff" },
        });
        next.push({ table, url, dataUrl });
      }
      setCards(next);

      // Schedule auto-refresh 30 seconds before expiry
      const msUntilRefresh = exp - Date.now() - 30_000;
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
      refreshTimer.current = setTimeout(fetchAndGenerate, Math.max(msUntilRefresh, 0));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAndGenerate();
    return () => {
      if (refreshTimer.current) clearTimeout(refreshTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Countdown ticker
  useEffect(() => {
    if (!expiresAt) return;
    const id = setInterval(() => {
      setRemaining(expiresAt - Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  const urgent = remaining < 60_000 && remaining > 0;

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-neutral-200 bg-cream/95 print:hidden">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-2xl text-neutral-900 sm:text-3xl">
              Table QR codes
            </h1>
            <p className="mt-1 text-sm text-neutral-600">
              Codes rotate every 15 minutes — old scans won&apos;t work.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {expiresAt > 0 && (
              <span
                className={[
                  "rounded-full border px-3 py-1.5 text-xs font-medium tabular-nums",
                  urgent
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-neutral-200 bg-white text-neutral-600",
                ].join(" ")}
              >
                Refreshes in {fmt(remaining)}
              </span>
            )}
            <button
              type="button"
              onClick={fetchAndGenerate}
              disabled={loading}
              className="rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
            >
              {loading ? "Refreshing…" : "Refresh now"}
            </button>
            <Link
              href="/kitchen"
              className="rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-100 print:hidden"
            >
              Kitchen
            </Link>
            <Link
              href="/admin/menu"
              className="rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-100 print:hidden"
            >
              Edit menu
            </Link>
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-full bg-neutral-900 px-4 py-2 text-xs font-medium text-cream hover:bg-neutral-800 print:hidden"
            >
              Print
            </button>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-6">
        {cards.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center text-sm text-neutral-600">
            Generating…
          </div>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 print:grid-cols-3 print:gap-2">
            {cards.map((c) => (
              <li
                key={c.table}
                className="flex flex-col items-center rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm print:break-inside-avoid print:shadow-none"
              >
                <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                  Table
                </p>
                <p className="font-serif text-4xl text-neutral-900">
                  {c.table}
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={c.dataUrl}
                  alt={`QR code for table ${c.table}`}
                  className="mt-2 h-44 w-44"
                />
                <a
                  href={c.dataUrl}
                  download={`benu-table-${c.table}.png`}
                  className="mt-3 rounded-full border border-neutral-300 px-3 py-1 text-[11px] text-neutral-700 hover:bg-neutral-100 print:hidden"
                >
                  Download PNG
                </a>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
