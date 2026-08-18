"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/dal";
import { saveUploadedFile, saveDataUrl } from "@/lib/uploads";
import { VerificationDocsFormState } from "@/lib/definitions";

function isNonEmptyFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}

export async function updateVerificationDocuments(
  _state: VerificationDocsFormState,
  formData: FormData
): Promise<VerificationDocsFormState> {
  const session = await verifySession();
  if (session.role !== "SELLER") {
    return { message: "Only sellers have verification documents." };
  }

  const me = await db.user.findUniqueOrThrow({ where: { id: session.userId } });

  const isBusiness = formData.get("isBusiness") === "on";
  const fxLicense = formData.get("fxLicense");
  const businessRegistration = formData.get("businessRegistration");
  const idCard = formData.get("idCard");
  const livePhoto = formData.get("livePhoto");

  const willHaveBusinessRegistration =
    isNonEmptyFile(businessRegistration) || (!!me.businessRegistrationPath && isBusiness);

  if (isBusiness && !willHaveBusinessRegistration) {
    return {
      errors: {
        businessRegistration: ["Upload your business registration."],
      },
    };
  }

  const updates: {
    isBusiness: boolean;
    fxLicensePath?: string;
    businessRegistrationPath?: string;
    idCardPath?: string;
    livePhotoPath?: string;
    verificationStatus?: "PENDING";
  } = { isBusiness };

  let changed = false;

  if (isNonEmptyFile(fxLicense)) {
    updates.fxLicensePath = await saveUploadedFile(me.id, "fx-license", fxLicense);
    changed = true;
  }
  if (isNonEmptyFile(businessRegistration)) {
    updates.businessRegistrationPath = await saveUploadedFile(
      me.id,
      "business-registration",
      businessRegistration
    );
    changed = true;
  }
  if (isNonEmptyFile(idCard)) {
    updates.idCardPath = await saveUploadedFile(me.id, "id-card", idCard);
    changed = true;
  }
  if (typeof livePhoto === "string" && livePhoto.startsWith("data:image/")) {
    updates.livePhotoPath = await saveDataUrl(me.id, "live-photo", livePhoto);
    changed = true;
  }

  // Re-review is required whenever the underlying documents change.
  if (changed) {
    updates.verificationStatus = "PENDING";
  }

  await db.user.update({ where: { id: me.id }, data: updates });

  revalidatePath("/settings");
  revalidatePath("/seller");
  revalidatePath("/");

  return {
    message: changed
      ? "Documents updated. Your account is pending re-verification."
      : "Saved.",
  };
}
