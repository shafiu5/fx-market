import "server-only";

// Fire-and-forget: a failed Telegram delivery (bad token, seller blocked the
// bot, etc.) should never break placing an order, so this only logs.
export async function sendTelegramMessage(chatId: string, text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) return;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });
    if (!res.ok) {
      console.error("Telegram sendMessage failed", res.status, await res.text());
    }
  } catch (e) {
    console.error("Telegram sendMessage error", e);
  }
}
