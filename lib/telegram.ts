import "server-only";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const CHAT_ID = 1642378656;
const YELP_URL = "https://www.yelp.com/biz/benu-san-luis-obispo";

export async function sendTelegramMessage(
  chatId: number,
  text: string,
): Promise<void> {
  if (!TOKEN) return;
  await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}

export async function notifyOrderPlaced(
  _clientId: string,
  _orderId: string,
  etaMinutes: number | undefined,
  tableNumber: number,
) {
  const eta = etaMinutes ? `~${etaMinutes} min` : "soon";
  await sendTelegramMessage(
    CHAT_ID,
    `✅ <b>Order placed!</b>\n\nTable ${tableNumber} · ETA ${eta}\n\nWe'll text you when it's ready.`,
  );
}

export async function notifyOrderCooking(_clientId: string, tableNumber: number) {
  await sendTelegramMessage(
    CHAT_ID,
    `👨‍🍳 <b>Your food is being prepared!</b>\n\nTable ${tableNumber} — hang tight, it's on its way.`,
  );
}

export async function notifyOrderReady(_clientId: string, tableNumber: number) {
  await sendTelegramMessage(
    CHAT_ID,
    `🍽️ <b>Your order is ready!</b>\n\nTable ${tableNumber} — enjoy your meal!\n\nOnce you're done, we'd love a review:\n${YELP_URL}`,
  );
}
