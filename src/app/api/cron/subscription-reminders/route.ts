import { db } from "@/lib/db";
import { sendTelegramMessage } from "@/lib/telegram";

// Vercel Cron sends `Authorization: Bearer $CRON_SECRET` when that env var
// is set on the project — this rejects any other caller.
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const sellers = await db.user.findMany({
    where: {
      role: "SELLER",
      subscriptionActive: true,
      subscriptionExpiresAt: { gte: now, lte: in24h },
      subscriptionReminderSentAt: null,
      telegramChatId: { not: null },
    },
    select: { id: true, telegramChatId: true, subscriptionExpiresAt: true },
  });

  const settingsUrl = process.env.APP_URL ? `${process.env.APP_URL}/settings?tab=subscription` : null;

  for (const seller of sellers) {
    await sendTelegramMessage(
      seller.telegramChatId!,
      `⏰ <b>Subscription expiring soon</b>\n` +
        `Your Exchange MV subscription expires ${new Date(seller.subscriptionExpiresAt!).toLocaleString()}. ` +
        `Renew before then to keep posting rates and taking orders.` +
        (settingsUrl ? `\n\n<a href="${settingsUrl}">Renew subscription</a>` : "")
    );
    await db.user.update({
      where: { id: seller.id },
      data: { subscriptionReminderSentAt: now },
    });
  }

  return Response.json({ notified: sellers.length });
}
