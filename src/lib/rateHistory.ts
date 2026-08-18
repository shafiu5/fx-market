import "server-only";
import { db } from "@/lib/db";

// Records the market's current average buy/sell rate for this currency as
// a snapshot point for the trend graph. Called whenever any seller's rate
// for the currency changes, so the graph reflects real market movement.
export async function recordRateSnapshot(currency: string): Promise<void> {
  const avg = await db.sellerRate.aggregate({
    where: {
      currency,
      buyRate: { gt: 0 },
      sellRate: { gt: 0 },
      seller: { suspended: false },
    },
    _avg: { buyRate: true, sellRate: true },
  });

  if (avg._avg.buyRate == null || avg._avg.sellRate == null) return;

  await db.rateSnapshot.create({
    data: { currency, avgBuyRate: avg._avg.buyRate, avgSellRate: avg._avg.sellRate },
  });
}
