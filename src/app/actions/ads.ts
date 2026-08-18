"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/admin-session";
import { saveAdImage } from "@/lib/uploads";

function isNonEmptyFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}

function isValidLinkUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function clampPercent(value: FormDataEntryValue | null): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 50;
  return Math.min(100, Math.max(0, Math.round(n)));
}

// Empty input means "runs indefinitely" (null). Otherwise expires at the
// end of the chosen day, so the ad still runs through the day it's set to.
function parseExpiresAt(value: FormDataEntryValue | null): Date | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const date = new Date(`${raw}T23:59:59`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function createAd(formData: FormData): Promise<void> {
  if (!(await isAdmin())) return;

  const advertiserName = String(formData.get("advertiserName") ?? "").trim();
  const linkUrl = String(formData.get("linkUrl") ?? "").trim();
  const weight = Number(formData.get("weight")) || 1;
  const image = formData.get("image");
  const focalX = clampPercent(formData.get("focalX"));
  const focalY = clampPercent(formData.get("focalY"));
  const expiresAt = parseExpiresAt(formData.get("expiresAt"));

  if (!advertiserName || !isValidLinkUrl(linkUrl) || !isNonEmptyFile(image) || weight < 1) {
    return;
  }

  // The image path is keyed by ad id, so the row has to exist first.
  const ad = await db.advertisement.create({
    data: { advertiserName, linkUrl, weight, focalX, focalY, expiresAt, imagePath: "" },
  });
  const imagePath = await saveAdImage(ad.id, image);
  await db.advertisement.update({ where: { id: ad.id }, data: { imagePath } });

  revalidatePath("/admin/ads");
  revalidatePath("/");
}

export async function updateAd(formData: FormData): Promise<void> {
  if (!(await isAdmin())) return;

  const id = String(formData.get("id") ?? "");
  const advertiserName = String(formData.get("advertiserName") ?? "").trim();
  const linkUrl = String(formData.get("linkUrl") ?? "").trim();
  const weight = Number(formData.get("weight")) || 1;
  const image = formData.get("image");
  const focalX = clampPercent(formData.get("focalX"));
  const focalY = clampPercent(formData.get("focalY"));
  const expiresAt = parseExpiresAt(formData.get("expiresAt"));

  if (!id || !advertiserName || !isValidLinkUrl(linkUrl) || weight < 1) return;

  const imagePath = isNonEmptyFile(image) ? await saveAdImage(id, image) : undefined;

  await db.advertisement.update({
    where: { id },
    data: {
      advertiserName,
      linkUrl,
      weight,
      focalX,
      focalY,
      expiresAt,
      ...(imagePath ? { imagePath } : {}),
    },
  });

  revalidatePath("/admin/ads");
  revalidatePath("/");
}

export async function setAdActive(id: string, active: boolean): Promise<void> {
  if (!(await isAdmin())) return;
  await db.advertisement.update({ where: { id }, data: { active } });
  revalidatePath("/admin/ads");
  revalidatePath("/");
}

export async function deleteAd(id: string): Promise<void> {
  if (!(await isAdmin())) return;
  await db.advertisement.delete({ where: { id } });
  revalidatePath("/admin/ads");
  revalidatePath("/");
}
