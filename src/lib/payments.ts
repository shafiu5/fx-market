import "server-only";
import { db } from "@/lib/db";

function addDays(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

// Shared by admin approval, admin manual grant, and free-tier auto-approve —
// anywhere a subscription gets (re)activated. Clears the reminder flag so
// the 1-day-before-expiry Telegram nudge can fire again next cycle.
export async function activateSubscription(userId: string, days: number) {
  await db.user.update({
    where: { id: userId },
    data: {
      subscriptionActive: true,
      subscriptionExpiresAt: addDays(days),
      subscriptionReminderSentAt: null,
    },
  });
}

export async function activateBoost(userId: string, days: number) {
  await db.user.update({
    where: { id: userId },
    data: { boostedUntil: addDays(days) },
  });
}

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
