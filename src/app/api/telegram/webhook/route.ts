import { db } from "@/lib/db";
import { sendTelegramMessage } from "@/lib/telegram";

// Telegram calls this on every update sent to the bot. We only care about
// `/start <sellerId>` — the payload from the deep link a seller clicks in
// Settings — which links their chat to their account for order alerts.
export async function POST(request: Request) {
  const secret = request.headers.get("x-telegram-bot-api-secret-token");
  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }

  const update = await request.json().catch(() => null);
  const message = update?.message;
  const text: string | undefined = message?.text;
  const chatId: number | undefined = message?.chat?.id;

  if (text?.startsWith("/start") && chatId) {
    const sellerId = text.replace("/start", "").trim();

    if (sellerId) {
      const seller = await db.user.findUnique({
        where: { id: sellerId },
        select: { id: true, role: true, name: true },
      });

      if (seller && seller.role === "SELLER") {
        await db.user.update({
          where: { id: seller.id },
          data: { telegramChatId: chatId.toString() },
        });
        await sendTelegramMessage(
          chatId.toString(),
          `✅ Connected! You'll get a message here whenever a buyer places a new order with ${seller.name}.`
        );
      } else {
        await sendTelegramMessage(
          chatId.toString(),
          "This link isn't valid. Open it from your Exchange MV seller settings page."
        );
      }
    }
  }

  // Telegram retries on non-2xx, so always ack even for updates we ignore.
  return new Response("OK", { status: 200 });
}
