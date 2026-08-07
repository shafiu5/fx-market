"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/admin-session";

function addDays(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function parseTierForm(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const days = Number(formData.get("days"));
  const price = Number(formData.get("price"));
  return { name, days, price };
}

export async function createSubscriptionTier(formData: FormData): Promise<void> {
  if (!(await isAdmin())) return;
  const { name, days, price } = parseTierForm(formData);
  if (!name || !(days > 0) || !(price >= 0)) return;

  await db.subscriptionTier.create({ data: { name, days, price } });
  revalidatePath("/admin/billing");
  revalidatePath("/settings");
}

export async function setSubscriptionTierActive(
  id: string,
  active: boolean
): Promise<void> {
  if (!(await isAdmin())) return;
  await db.subscriptionTier.update({ where: { id }, data: { active } });
  revalidatePath("/admin/billing");
  revalidatePath("/settings");
}

export async function createBoostTier(formData: FormData): Promise<void> {
  if (!(await isAdmin())) return;
  const { name, days, price } = parseTierForm(formData);
  if (!name || !(days > 0) || !(price >= 0)) return;

  await db.boostTier.create({ data: { name, days, price } });
  revalidatePath("/admin/billing");
  revalidatePath("/settings");
}

export async function setBoostTierActive(id: string, active: boolean): Promise<void> {
  if (!(await isAdmin())) return;
  await db.boostTier.update({ where: { id }, data: { active } });
  revalidatePath("/admin/billing");
  revalidatePath("/settings");
}

export async function updatePaymentSettings(formData: FormData): Promise<void> {
  if (!(await isAdmin())) return;

  const bankName = String(formData.get("bankName") ?? "").trim();
  const accountName = String(formData.get("accountName") ?? "").trim();
  const accountNumber = String(formData.get("accountNumber") ?? "").trim();
  const branch = String(formData.get("branch") ?? "").trim();
  const instructions = String(formData.get("instructions") ?? "").trim();

  await db.paymentSettings.upsert({
    where: { id: "singleton" },
    update: { bankName, accountName, accountNumber, branch, instructions },
    create: {
      id: "singleton",
      bankName,
      accountName,
      accountNumber,
      branch,
      instructions,
    },
  });

  revalidatePath("/admin/billing");
  revalidatePath("/settings");
}

export async function approvePaymentRequest(requestId: string): Promise<void> {
  if (!(await isAdmin())) return;

  const request = await db.paymentRequest.findUnique({ where: { id: requestId } });
  if (!request || request.status !== "PENDING") return;

  await db.$transaction([
    db.paymentRequest.update({
      where: { id: requestId },
      data: { status: "APPROVED", reviewedAt: new Date() },
    }),
    db.user.update({
      where: { id: request.sellerId },
      data:
        request.kind === "SUBSCRIPTION"
          ? { subscriptionActive: true, subscriptionExpiresAt: addDays(request.days) }
          : { boostedUntil: addDays(request.days) },
    }),
  ]);

  revalidatePath("/admin/payments");
  revalidatePath("/admin/sellers");
  revalidatePath("/seller");
  revalidatePath("/settings");
  revalidatePath("/");
  revalidatePath("/seller/market");
}

export async function rejectPaymentRequest(requestId: string): Promise<void> {
  if (!(await isAdmin())) return;

  await db.paymentRequest.updateMany({
    where: { id: requestId, status: "PENDING" },
    data: { status: "REJECTED", reviewedAt: new Date() },
  });

  revalidatePath("/admin/payments");
  revalidatePath("/settings");
}
