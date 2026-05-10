import { NextResponse } from "next/server";
import { sendTelegramMessage } from "@/lib/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TEST_CHAT_ID = 1642378656;
const YELP_URL = "https://www.yelp.com/biz/benu-san-luis-obispo";

export async function POST(req: Request) {
  try {
    const { tableNumber, etaMinutes, items } = await req.json();
    const eta = etaMinutes ? `~${etaMinutes} min` : "soon";
    const itemList = Array.isArray(items) && items.length > 0
      ? items.map((i: { name: string; quantity: number }) => `• ${i.name} ×${i.quantity}`).join("\n")
      : "";

    await sendTelegramMessage(
      TEST_CHAT_ID,
      `✅ <b>Order placed!</b>\n\nTable ${tableNumber} · ETA ${eta}${itemList ? `\n\n${itemList}` : ""}\n\nWe'll text you when it's ready.`,
    );
    await new Promise((r) => setTimeout(r, 1500));
    await sendTelegramMessage(
      TEST_CHAT_ID,
      `👨‍🍳 <b>Your food is being prepared!</b>\n\nTable ${tableNumber} — hang tight, it's on its way.`,
    );
    await new Promise((r) => setTimeout(r, 1500));
    await sendTelegramMessage(
      TEST_CHAT_ID,
      `🍽️ <b>Your order is ready!</b>\n\nTable ${tableNumber} — enjoy your meal!\n\nOnce you're done, we'd love a review:\n${YELP_URL}`,
    );
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
