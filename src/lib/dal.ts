import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";

export const verifySession = cache(async () => {
  const session = await getSession();
  if (!session?.userId) {
    redirect("/login");
  }

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { id: true, role: true, suspended: true },
  });
  if (!user || user.suspended) {
    redirect("/login");
  }

  return { userId: user.id, role: user.role };
});

export const getOptionalSession = cache(async () => {
  const session = await getSession();
  if (!session?.userId) return null;

  const user = await db.user.findUnique({
    where: { id: session.userId },
    select: { id: true, role: true, suspended: true },
  });
  if (!user || user.suspended) return null;

  return { userId: user.id, role: user.role };
});

export const getCurrentUser = cache(async () => {
  const session = await getOptionalSession();
  if (!session) return null;

  return db.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, role: true },
  });
});
