"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/dal";
import { saveUploadedFile } from "@/lib/uploads";
import { activateSubscription, activateBoost } from "@/lib/payments";

export type PaymentRequestFormState =
  | {
      error?: string;
      activated?: boolean;
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

  const tier = await db.subscriptionTier.findUnique({ where: { id: tierId } });
  if (!tier || !tier.active) {
    return { error: "That plan is no longer available." };
  }

  // Free plans have nothing to verify, so they skip the slip and the admin
  // queue entirely — the request record still exists for the audit trail.
  if (tier.price === 0) {
    await db.paymentRequest.create({
      data: {
        sellerId: session.userId,
        kind: "SUBSCRIPTION",
        tierName: tier.name,
        amount: 0,
        days: tier.days,
        slipPath: null,
        status: "APPROVED",
        reviewedAt: new Date(),
      },
    });
    await activateSubscription(session.userId, tier.days);

    revalidatePath("/settings");
    revalidatePath("/seller");
    revalidatePath("/admin/payments");
    return { activated: true };
  }

  if (!isNonEmptyFile(slip)) {
    return { error: "Upload your payment slip." };
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

  const tier = await db.boostTier.findUnique({ where: { id: tierId } });
  if (!tier || !tier.active) {
    return { error: "That boost package is no longer available." };
  }

  if (tier.price === 0) {
    await db.paymentRequest.create({
      data: {
        sellerId: session.userId,
        kind: "BOOST",
        tierName: tier.name,
        amount: 0,
        days: tier.days,
        slipPath: null,
        status: "APPROVED",
        reviewedAt: new Date(),
      },
    });
    await activateBoost(session.userId, tier.days);

    revalidatePath("/settings");
    revalidatePath("/seller");
    revalidatePath("/admin/payments");
    return { activated: true };
  }

  if (!isNonEmptyFile(slip)) {
    return { error: "Upload your payment slip." };
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
