"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/dal";

export async function disconnectTelegram(): Promise<void> {
  const session = await verifySession();
  if (session.role !== "SELLER") return;

  await db.user.update({
    where: { id: session.userId },
    data: { telegramChatId: null },
  });

  revalidatePath("/settings");
}
