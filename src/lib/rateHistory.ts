import "server-only";
import { db } from "@/lib/db";

// Records the market's current best (lowest) rate to buy this currency —
// the same metric the rate board's default sort uses — as a snapshot point
// for the trend graph. Called whenever any seller's rate for the currency
// changes, so the graph reflects real market movement.
export async function recordRateSnapshot(currency: string): Promise<void> {
  const best = await db.sellerRate.aggregate({
    where: {
      currency,
      buyRate: { gt: 0 },
      sellRate: { gt: 0 },
      seller: { suspended: false },
    },
    _min: { sellRate: true },
  });

  const rate = best._min.sellRate;
  if (rate == null) return;

  await db.rateSnapshot.create({ data: { currency, rate } });
}
