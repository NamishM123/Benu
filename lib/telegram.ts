import "server-only";

const BOT_TOKEN =
  process.env.TELEGRAM_BOT_TOKEN ??
  "8534344537:AAFtPDWX0ebmPp81H2NHFcLOSlDBeRsNt58";
const CHAT_ID =
  process.env.TELEGRAM_CHAT_ID ?? "1642378656";

export async function sendTelegram(text: string): Promise<void> {
  try {
    await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text,
          parse_mode: "HTML",
        }),
      },
    );
  } catch {
    // Non-fatal — never let a Telegram failure break an order flow
  }
}
