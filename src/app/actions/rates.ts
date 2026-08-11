"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/dal";
import { RateSchema, RateFormState } from "@/lib/definitions";
import { isCurrencyCode } from "@/lib/config";
import { isSubscriptionActive } from "@/lib/boost";
import { recordRateSnapshot } from "@/lib/rateHistory";

export async function updateRate(
  _state: RateFormState,
  formData: FormData
): Promise<RateFormState> {
  const session = await verifySession();
  if (session.role !== "SELLER") {
    return { message: "Only sellers can update rates." };
  }

  const me = await db.user.findUniqueOrThrow({
    where: { id: session.userId },
    select: { subscriptionActive: true, subscriptionExpiresAt: true },
  });
  if (!isSubscriptionActive(me)) {
    return {
      message:
        "Your subscription is inactive. Contact the admin to reactivate it before posting rates.",
    };
  }

  const validated = RateSchema.safeParse({
    currency: formData.get("currency"),
    buyRate: formData.get("buyRate"),
    sellRate: formData.get("sellRate"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { currency, buyRate, sellRate } = validated.data;

  if (!isCurrencyCode(currency)) {
    return { message: "Unsupported currency." };
  }

  await db.sellerRate.upsert({
    where: { sellerId_currency: { sellerId: session.userId, currency } },
    update: { buyRate, sellRate },
    create: { sellerId: session.userId, currency, buyRate, sellRate },
  });
  await recordRateSnapshot(currency);

  revalidatePath("/");
  revalidatePath("/seller");

  return { message: `${currency} rate updated.`, success: true };
}
