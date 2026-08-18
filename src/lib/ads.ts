import "server-only";
import { db } from "@/lib/db";

// Weighted-random pick among active ads, so a higher `weight` shows up more
// often without needing a separate scheduling system.
export async function pickActiveAd() {
  const ads = await db.advertisement.findMany({
    where: { active: true, weight: { gt: 0 } },
  });
  if (ads.length === 0) return null;

  const totalWeight = ads.reduce((sum, ad) => sum + ad.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const ad of ads) {
    roll -= ad.weight;
    if (roll <= 0) return ad;
  }
  return ads[ads.length - 1];
}
