import { NextResponse } from "next/server";
import { deleteOrder, getOrder, patchOrder } from "@/lib/server-orders";
import type { OrderStatus } from "@/lib/order-store";
import { sendTelegram } from "@/lib/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_STATUSES: OrderStatus[] = ["new", "cooking", "ready"];

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ order });
}

export async function PATCH(req: Request, { params }: Ctx) {
  const { id } = await params;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const b = (body ?? {}) as Record<string, unknown>;

  const patch: {
    status?: OrderStatus;
    etaMinutes?: number;
    priority?: boolean;
  } = {};
  if ("status" in b) {
    if (
      typeof b.status !== "string" ||
      !VALID_STATUSES.includes(b.status as OrderStatus)
    ) {
      return NextResponse.json({ error: "invalid status" }, { status: 400 });
    }
    patch.status = b.status as OrderStatus;
  }
  if ("etaMinutes" in b) {
    if (b.etaMinutes === null || b.etaMinutes === undefined) {
      patch.etaMinutes = undefined;
    } else if (typeof b.etaMinutes === "number" && b.etaMinutes >= 0) {
      patch.etaMinutes = Math.round(b.etaMinutes);
    } else {
      return NextResponse.json({ error: "invalid etaMinutes" }, { status: 400 });
    }
  }
  if ("priority" in b) {
    if (typeof b.priority !== "boolean") {
      return NextResponse.json({ error: "invalid priority" }, { status: 400 });
    }
    patch.priority = b.priority;
  }

  const updated = await patchOrder(id, patch);
  if (!updated) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  // Telegram: notify on status transitions
  if (patch.status) {
    const shortId =
      updated.ticketNumber !== undefined
        ? String(updated.ticketNumber).padStart(3, "0")
        : updated.id.slice(0, 6).toUpperCase();
    if (patch.status === "ready") {
      void sendTelegram(
        `<b>Order Ready — #${shortId}</b>\n<b>Table ${updated.tableNumber}</b>\n\n<i>Your food is ready and your waiter will bring it to your table right away. Thank you for your patience!</i>`,
      );
    } else if (patch.status === "cooking") {
      void sendTelegram(
        `<b>Order In Progress — #${shortId}</b>\n<b>Table ${updated.tableNumber}</b>\n\n<i>Our kitchen has started on your order. We will let you know as soon as it is ready.</i>`,
      );
    }
  }

  return NextResponse.json({ order: updated });
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const { id } = await params;
  const ok = await deleteOrder(id);
  if (!ok) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
