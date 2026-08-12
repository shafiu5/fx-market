"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/dal";
import { OrderSchema, OrderFormState } from "@/lib/definitions";
import { isSubscriptionActive } from "@/lib/boost";
import { sendTelegramMessage } from "@/lib/telegram";
import { LOCAL_CURRENCY } from "@/lib/config";

export async function createOrder(
  _state: OrderFormState,
  formData: FormData
): Promise<OrderFormState> {
  const session = await verifySession();
  if (session.role !== "BUYER") {
    return { message: "Only buyers can place orders." };
  }

  const validated = OrderSchema.safeParse({
    sellerId: formData.get("sellerId"),
    currency: formData.get("currency"),
    type: formData.get("type"),
    amount: formData.get("amount"),
    contactPhone: formData.get("contactPhone"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { sellerId, currency, type, amount, contactPhone } = validated.data;

  const sellerRate = await db.sellerRate.findUnique({
    where: { sellerId_currency: { sellerId, currency } },
    include: {
      seller: {
        select: {
          suspended: true,
          subscriptionActive: true,
          subscriptionExpiresAt: true,
          telegramChatId: true,
        },
      },
    },
  });
  if (!sellerRate || sellerRate.seller.suspended) {
    return { message: "This seller has not posted a rate." };
  }
  if (!isSubscriptionActive(sellerRate.seller)) {
    return { message: "This seller isn't accepting new orders right now." };
  }

  const rate = type === "BUY" ? sellerRate.sellRate : sellerRate.buyRate;
  if (rate <= 0) {
    return { message: "This seller has not posted a rate." };
  }

  await db.order.create({
    data: {
      buyerId: session.userId,
      sellerId,
      currency,
      type,
      amount,
      rate,
      contactPhone,
    },
  });

  const me = await db.user.findUniqueOrThrow({ where: { id: session.userId } });

  // The buyer just created this order, so it's not an "unseen" notification
  // for them — only bump phone if it actually changed.
  await db.user.update({
    where: { id: session.userId },
    data: {
      ...(me.phone !== contactPhone ? { phone: contactPhone } : {}),
      buyerOrdersViewedAt: new Date(),
    },
  });

  if (sellerRate.seller.telegramChatId) {
    const ordersUrl = process.env.APP_URL ? `${process.env.APP_URL}/seller/orders` : null;
    await sendTelegramMessage(
      sellerRate.seller.telegramChatId,
      `🔔 <b>New ${type === "BUY" ? "buy" : "sell"} order</b>\n` +
        `${amount.toLocaleString()} ${currency} @ ${rate.toFixed(2)} ${LOCAL_CURRENCY}\n` +
        `Buyer: ${me.name} (${contactPhone})` +
        (ordersUrl ? `\n\n<a href="${ordersUrl}">View in Seller Orders</a>` : "")
    );
  }

  revalidatePath("/orders");
  revalidatePath("/seller");
  revalidatePath("/seller/orders");
  revalidatePath("/", "layout");

  redirect("/orders");
}

const SELLER_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["COMPLETED", "CANCELLED"],
};

export async function updateOrderStatus(
  orderId: string,
  nextStatus: string
): Promise<void> {
  const session = await verifySession();

  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order) return;

  if (session.role === "SELLER") {
    if (order.sellerId !== session.userId) return;
    const allowed = SELLER_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(nextStatus)) return;

    // "Taking" a new order (confirming it) requires an active subscription.
    // Already-accepted work can still be completed or cancelled either way,
    // so buyers aren't left stranded if the subscription lapses mid-order.
    if (nextStatus === "CONFIRMED") {
      const seller = await db.user.findUniqueOrThrow({
        where: { id: session.userId },
        select: { subscriptionActive: true, subscriptionExpiresAt: true },
      });
      if (!isSubscriptionActive(seller)) return;
    }
  } else {
    if (order.buyerId !== session.userId) return;
    if (nextStatus !== "CANCELLED" || order.status !== "PENDING") return;
  }

  await db.order.update({
    where: { id: orderId },
    data: { status: nextStatus as "CONFIRMED" | "COMPLETED" | "CANCELLED" },
  });

  // Whoever performed this transition has obviously "seen" it — the other
  // side's viewedAt is left untouched so the status change notifies them.
  await db.user.update({
    where: { id: session.userId },
    data:
      session.role === "SELLER"
        ? { sellerOrdersViewedAt: new Date() }
        : { buyerOrdersViewedAt: new Date() },
  });

  revalidatePath("/orders");
  revalidatePath("/seller");
  revalidatePath("/seller/orders");
  revalidatePath("/", "layout");
}
