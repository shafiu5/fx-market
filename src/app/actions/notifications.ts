"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/dal";

export async function markSellerOrdersSeen(): Promise<void> {
  const session = await verifySession();
  if (session.role !== "SELLER") return;

  await db.user.update({
    where: { id: session.userId },
    data: { sellerOrdersViewedAt: new Date() },
  });

  revalidatePath("/", "layout");
}

export async function markBuyerOrdersSeen(): Promise<void> {
  const session = await verifySession();
  if (session.role !== "BUYER") return;

  await db.user.update({
    where: { id: session.userId },
    data: { buyerOrdersViewedAt: new Date() },
  });

  revalidatePath("/", "layout");
}

export async function markMarketSeen(): Promise<void> {
  const session = await verifySession();
  if (session.role !== "SELLER") return;

  await db.user.update({
    where: { id: session.userId },
    data: { marketViewedAt: new Date() },
  });

  // Deliberately not revalidating the current path: this page shows "New"
  // badges based on the pre-visit viewedAt, and revalidating here would
  // immediately re-render it with the just-updated timestamp, erasing them
  // before they could be seen. The bell count catches up on next navigation.
}
