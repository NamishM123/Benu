import "server-only";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
export const BOT_USERNAME = "b3nu_bot";
const YELP_URL = "https://www.yelp.com/biz/benu-san-luis-obispo";

// KV/memory storage for clientId → chatId mapping (same pattern as server-orders)
const useKv =
  !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN;

const MEM_KEY = "__benu_tg_store__";
function memMap(): Map<string, number> {
  const g = globalThis as unknown as Record<string, Map<string, number>>;
  if (!g[MEM_KEY]) g[MEM_KEY] = new Map();
  return g[MEM_KEY];
}

export async function storeChatId(clientId: string, chatId: number) {
  if (useKv) {
    const { kv } = await import("@vercel/kv");
    await kv.set(`benu:tg:${clientId}`, chatId);
  } else {
    memMap().set(clientId, chatId);
  }
}

export async function getChatId(clientId: string): Promise<number | null> {
  if (useKv) {
    const { kv } = await import("@vercel/kv");
    return (await kv.get<number>(`benu:tg:${clientId}`)) ?? null;
  }
  return memMap().get(clientId) ?? null;
}

export function getBotLink(clientId: string): string {
  return `https://t.me/${BOT_USERNAME}?start=${clientId}`;
}

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
  clientId: string,
  orderId: string,
  etaMinutes: number | undefined,
  tableNumber: number,
) {
  const chatId = await getChatId(clientId);
  if (!chatId) return;
  const eta = etaMinutes ? `~${etaMinutes} min` : "soon";
  await sendTelegramMessage(
    chatId,
    `✅ <b>Order placed!</b>\n\nTable ${tableNumber} · ETA ${eta}\n\nWe'll text you when it's ready.`,
  );
}

export async function notifyOrderCooking(clientId: string, tableNumber: number) {
  const chatId = await getChatId(clientId);
  if (!chatId) return;
  await sendTelegramMessage(
    chatId,
    `👨‍🍳 <b>Your food is being prepared!</b>\n\nTable ${tableNumber} — hang tight, it's on its way.`,
  );
}

export async function notifyOrderReady(clientId: string, tableNumber: number) {
  const chatId = await getChatId(clientId);
  if (!chatId) return;
  await sendTelegramMessage(
    chatId,
    `🍽️ <b>Your order is ready!</b>\n\nTable ${tableNumber} — enjoy your meal!\n\nOnce you're done, we'd love a review:\n${YELP_URL}`,
  );
}
