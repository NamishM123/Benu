import { NextResponse } from "next/server";
import { storeChatId, sendTelegramMessage } from "@/lib/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TelegramUpdate = {
  message?: {
    chat: { id: number; first_name?: string };
    text?: string;
  };
};

export async function POST(req: Request) {
  let update: TelegramUpdate;
  try {
    update = await req.json();
  } catch {
    return NextResponse.json({ ok: false });
  }

  const msg = update.message;
  if (!msg?.text) return NextResponse.json({ ok: true });

  const chatId = msg.chat.id;
  const text = msg.text.trim();

  if (text.startsWith("/start")) {
    const clientId = text.split(" ")[1]?.trim();
    if (clientId) {
      await storeChatId(clientId, chatId);
      await sendTelegramMessage(
        chatId,
        `👋 Hi ${msg.chat.first_name ?? "there"}! You're connected to Benu.\n\nWe'll send you updates when your order is placed, being cooked, and ready to eat. Enjoy! 🍜`,
      );
    } else {
      await sendTelegramMessage(
        chatId,
        `👋 Welcome to Benu! Scan your table QR code and connect from the checkout screen to get order updates.`,
      );
    }
  }

  return NextResponse.json({ ok: true });
}
