import "server-only";
import { db } from "@/lib/db";

export async function getActiveSubscriptionTiers() {
  return db.subscriptionTier.findMany({
    where: { active: true },
    orderBy: { days: "asc" },
  });
}

export async function getActiveBoostTiers() {
  return db.boostTier.findMany({
    where: { active: true },
    orderBy: { days: "asc" },
  });
}

export async function getPaymentSettings() {
  return db.paymentSettings.upsert({
    where: { id: "singleton" },
    update: {},
    create: { id: "singleton" },
  });
}
