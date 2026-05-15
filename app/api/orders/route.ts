import { NextResponse } from "next/server";
import {
  createOrder,
  listOrders,
  listOrdersForClient,
} from "@/lib/server-orders";
import { TABLE_COUNT } from "@/lib/prep-time";
import { sendTelegram } from "@/lib/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const clientId = url.searchParams.get("clientId");
  const orders = clientId
    ? await listOrdersForClient(clientId)
    : await listOrders();
  return NextResponse.json({ orders });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const b = body as Record<string, unknown>;

  const lines = Array.isArray(b.lines) ? b.lines : null;
  const preferences = Array.isArray(b.preferences)
    ? (b.preferences as unknown[]).filter((p): p is string => typeof p === "string")
    : [];
  const tableNumber = typeof b.tableNumber === "number" ? b.tableNumber : NaN;
  const clientId = typeof b.clientId === "string" ? b.clientId : undefined;

  if (!lines || lines.length === 0) {
    return NextResponse.json({ error: "lines required" }, { status: 400 });
  }
  if (
    !Number.isInteger(tableNumber) ||
    tableNumber < 1 ||
    tableNumber > TABLE_COUNT
  ) {
    return NextResponse.json(
      { error: `tableNumber must be 1..${TABLE_COUNT}` },
      { status: 400 },
    );
  }

  // Trust the client's CartLine shape — it matches our type. Defensive parsing
  // can come later if/when this is exposed beyond the same-origin app.
  try {
    const order = await createOrder({
      lines: lines as never,
      preferences,
      tableNumber,
      clientId,
    });

    // Telegram: order placed notification
    const shortId = order.id.slice(0, 6).toUpperCase();
    const itemLines = order.lines
      .map((l) => `  • ${l.itemName} ×${l.quantity}`)
      .join("\n");
    const etaText =
      order.etaMinutes !== undefined ? `\n⏱ ETA: ${order.etaMinutes} min` : "";
    const prefText =
      order.preferences.length > 0
        ? `\n🥗 Preferences: ${order.preferences.join(", ")}`
        : "";
    void sendTelegram(
      `🍜 <b>New Order #${shortId}</b>\n🪑 Table ${order.tableNumber}\n\n${itemLines}${prefText}${etaText}`,
    );

    return NextResponse.json({ order }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "createOrder failed", message },
      { status: 500 },
    );
  }
}
