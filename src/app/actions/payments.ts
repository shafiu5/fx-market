"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/dal";
import { saveUploadedFile } from "@/lib/uploads";

export type PaymentRequestFormState =
  | {
      error?: string;
    }
  | undefined;

function isNonEmptyFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}

async function hasPendingRequest(sellerId: string, kind: "SUBSCRIPTION" | "BOOST") {
  const existing = await db.paymentRequest.findFirst({
    where: { sellerId, kind, status: "PENDING" },
  });
  return !!existing;
}

export async function requestSubscriptionRenewal(
  _state: PaymentRequestFormState,
  formData: FormData
): Promise<PaymentRequestFormState> {
  const session = await verifySession();
  if (session.role !== "SELLER") {
    return { error: "Only sellers can request a subscription." };
  }

  if (await hasPendingRequest(session.userId, "SUBSCRIPTION")) {
    return { error: "You already have a subscription request awaiting review." };
  }

  const tierId = formData.get("tierId");
  const slip = formData.get("slip");

  if (typeof tierId !== "string" || !tierId) {
    return { error: "Choose a plan." };
  }
  if (!isNonEmptyFile(slip)) {
    return { error: "Upload your payment slip." };
  }

  const tier = await db.subscriptionTier.findUnique({ where: { id: tierId } });
  if (!tier || !tier.active) {
    return { error: "That plan is no longer available." };
  }

  const slipPath = await saveUploadedFile(
    session.userId,
    `subscription-slip-${Date.now()}`,
    slip
  );

  await db.paymentRequest.create({
    data: {
      sellerId: session.userId,
      kind: "SUBSCRIPTION",
      tierName: tier.name,
      amount: tier.price,
      days: tier.days,
      slipPath,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/seller");
  revalidatePath("/admin/payments");

  return undefined;
}

export async function requestBoost(
  _state: PaymentRequestFormState,
  formData: FormData
): Promise<PaymentRequestFormState> {
  const session = await verifySession();
  if (session.role !== "SELLER") {
    return { error: "Only sellers can request a boost." };
  }

  if (await hasPendingRequest(session.userId, "BOOST")) {
    return { error: "You already have a boost request awaiting review." };
  }

  const tierId = formData.get("tierId");
  const slip = formData.get("slip");

  if (typeof tierId !== "string" || !tierId) {
    return { error: "Choose a boost package." };
  }
  if (!isNonEmptyFile(slip)) {
    return { error: "Upload your payment slip." };
  }

  const tier = await db.boostTier.findUnique({ where: { id: tierId } });
  if (!tier || !tier.active) {
    return { error: "That boost package is no longer available." };
  }

  const slipPath = await saveUploadedFile(session.userId, `boost-slip-${Date.now()}`, slip);

  await db.paymentRequest.create({
    data: {
      sellerId: session.userId,
      kind: "BOOST",
      tierName: tier.name,
      amount: tier.price,
      days: tier.days,
      slipPath,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/seller");
  revalidatePath("/admin/payments");

  return undefined;
}
