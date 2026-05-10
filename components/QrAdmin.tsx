"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { TABLE_COUNT } from "@/lib/prep-time";
import SignOutButton from "./SignOutButton";

type Card = { table: number; url: string; dataUrl: string };

export default function QrAdmin() {
  const [origin, setOrigin] = useState<string>("");
  const [overrideOrigin, setOverrideOrigin] = useState<string>("");
  const [cards, setCards] = useState<Card[]>([]);

  useEffect(() => {
    // Prefer the customer host (where the QR-scanning phones should land)
    // over the host the admin is browsing from — staff might be using the
    // staff subdomain and would otherwise generate codes pointing back at
    // the wrong place.
    const customer = process.env.NEXT_PUBLIC_CUSTOMER_HOST;
    if (customer) {
      setOrigin(`https://${customer}`);
    } else {
      setOrigin(window.location.origin);
    }
  }, []);

  const effectiveOrigin = overrideOrigin.trim() || origin;

  useEffect(() => {
    if (!effectiveOrigin) return;
    let cancelled = false;
    (async () => {
      const next: Card[] = [];
      for (let n = 1; n <= TABLE_COUNT; n++) {
        const url = `${effectiveOrigin}/menu?table=${n}`;
        const dataUrl = await QRCode.toDataURL(url, {
          width: 512,
          margin: 1,
          errorCorrectionLevel: "M",
          color: { dark: "#1a1a1a", light: "#ffffff" },
        });
        next.push({ table: n, url, dataUrl });
      }
      if (!cancelled) setCards(next);
    })();
    return () => {
      cancelled = true;
    };
  }, [effectiveOrigin]);

  return (
    <div className="min-h-screen bg-cream">
      <header className="border-b border-neutral-200 bg-cream/95 print:hidden">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-2xl text-neutral-900 sm:text-3xl">
              Table QR codes
            </h1>
            <p className="mt-1 text-sm text-neutral-600">
              Customers scan and land on the menu with their table pre-filled.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-neutral-700">
              <span className="uppercase tracking-wider text-neutral-500">
                Base URL
              </span>
              <input
                type="text"
                value={overrideOrigin || origin}
                onChange={(e) => setOverrideOrigin(e.target.value)}
                placeholder={origin}
                className="w-72 rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs text-neutral-900 focus:border-neutral-900 focus:outline-none"
              />
            </label>
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
                <p className="mt-2 break-all text-center text-[10px] text-neutral-500">
                  {c.url}
                </p>
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
