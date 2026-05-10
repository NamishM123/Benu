import { NextResponse } from "next/server";
import { sendTelegramMessage } from "@/lib/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TEST_CHAT_ID = 1642378656;

export async function POST() {
  try {
    await sendTelegramMessage(
      TEST_CHAT_ID,
      `✅ <b>Order placed!</b>\n\nTable 3 · ETA ~12 min\n\nWe'll text you when it's ready.`,
    );
    await new Promise((r) => setTimeout(r, 1500));
    await sendTelegramMessage(
      TEST_CHAT_ID,
      `👨‍🍳 <b>Your food is being prepared!</b>\n\nTable 3 — hang tight, it's on its way.`,
    );
    await new Promise((r) => setTimeout(r, 1500));
    await sendTelegramMessage(
      TEST_CHAT_ID,
      `🍽️ <b>Your order is ready!</b>\n\nTable 3 — enjoy your meal!\n\nOnce you're done, we'd love a review:\nhttps://www.yelp.com/biz/benu-san-luis-obispo`,
    );
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
