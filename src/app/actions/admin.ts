"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  createAdminSession,
  deleteAdminSession,
  isAdmin,
} from "@/lib/admin-session";

export type AdminLoginState = { message?: string } | undefined;

export async function adminLogin(
  _state: AdminLoginState,
  formData: FormData
): Promise<AdminLoginState> {
  const password = formData.get("password");

  if (typeof password !== "string" || password !== process.env.ADMIN_PASSWORD) {
    return { message: "Incorrect password." };
  }

  await createAdminSession();
  redirect("/admin");
}

export async function adminLogout() {
  await deleteAdminSession();
  redirect("/admin/login");
}

export async function setVerificationStatus(
  userId: string,
  status: "VERIFIED" | "REJECTED" | "PENDING"
): Promise<void> {
  if (!(await isAdmin())) return;

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== "SELLER") return;

  await db.user.update({
    where: { id: userId },
    data: { verificationStatus: status },
  });

  revalidatePath("/admin/sellers");
  revalidatePath("/");
  revalidatePath("/seller");
}

function addDays(days: number): Date {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

// days=null deactivates the subscription immediately. A positive number
// (re)activates it and sets/extends the expiry from now.
export async function setSubscriptionStatus(
  userId: string,
  days: number | null
): Promise<void> {
  if (!(await isAdmin())) return;

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== "SELLER") return;

  await db.user.update({
    where: { id: userId },
    data:
      days === null
        ? { subscriptionActive: false }
        : { subscriptionActive: true, subscriptionExpiresAt: addDays(days) },
  });

  revalidatePath("/admin/sellers");
  revalidatePath("/seller");
}

// days=null clears the boost immediately. A positive number sets/extends
// boostedUntil from now, independent of subscription status.
export async function setSellerBoost(
  userId: string,
  days: number | null
): Promise<void> {
  if (!(await isAdmin())) return;

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user || user.role !== "SELLER") return;

  await db.user.update({
    where: { id: userId },
    data: { boostedUntil: days === null ? null : addDays(days) },
  });

  revalidatePath("/admin/sellers");
  revalidatePath("/");
  revalidatePath("/seller");
  revalidatePath("/seller/market");
}

export async function setUserSuspended(
  userId: string,
  suspended: boolean
): Promise<void> {
  if (!(await isAdmin())) return;

  await db.user.update({
    where: { id: userId },
    data: { suspended },
  });

  revalidatePath("/admin/users");
  revalidatePath("/admin/sellers");
  revalidatePath("/");
  revalidatePath("/seller");
  revalidatePath("/seller/market");
}
