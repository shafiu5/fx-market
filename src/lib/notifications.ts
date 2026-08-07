import "server-only";
import { db } from "@/lib/db";

export async function getUnseenOrderCount(
  userId: string,
  role: "BUYER" | "SELLER"
): Promise<number> {
  const me = await db.user.findUniqueOrThrow({
    where: { id: userId },
    select: { sellerOrdersViewedAt: true, buyerOrdersViewedAt: true },
  });

  const viewedAt =
    role === "SELLER" ? me.sellerOrdersViewedAt : me.buyerOrdersViewedAt;

  return db.order.count({
    where: {
      ...(role === "SELLER" ? { sellerId: userId } : { buyerId: userId }),
      updatedAt: { gt: viewedAt ?? new Date(0) },
    },
  });
}

// Competitor rate changes in currencies this seller has posted, since they
// last checked the Market page. A seller with no posted currencies has no
// competitors to watch yet, so this is always 0 for them.
export async function getUnseenRateChangeCount(sellerId: string): Promise<number> {
  const [me, myRates] = await Promise.all([
    db.user.findUniqueOrThrow({
      where: { id: sellerId },
      select: { marketViewedAt: true },
    }),
    db.sellerRate.findMany({
      where: { sellerId },
      select: { currency: true },
    }),
  ]);

  const currencies = myRates.map((r) => r.currency);
  if (currencies.length === 0) return 0;

  return db.sellerRate.count({
    where: {
      sellerId: { not: sellerId },
      currency: { in: currencies },
      updatedAt: { gt: me.marketViewedAt ?? new Date(0) },
    },
  });
}
