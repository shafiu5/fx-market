"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/dal";
import { createSession } from "@/lib/session";
import { saveUploadedFile, saveDataUrl } from "@/lib/uploads";
import { BecomeSellerFormState, BecomeBuyerFormState } from "@/lib/definitions";

function isNonEmptyFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}

// Buyer -> seller requires the same KYC packet a new seller signup does,
// since the verification badge is meant to mean the same thing regardless
// of how someone became a seller.
export async function becomeSeller(
  _state: BecomeSellerFormState,
  formData: FormData
): Promise<BecomeSellerFormState> {
  const session = await verifySession();
  if (session.role !== "BUYER") {
    return { message: "Only buyer accounts can switch to a seller account." };
  }

  const isBusiness = formData.get("isBusiness") === "on";
  const fxLicense = formData.get("fxLicense");
  const businessRegistration = formData.get("businessRegistration");
  const idCard = formData.get("idCard");
  const livePhoto = formData.get("livePhoto");

  const errors: NonNullable<BecomeSellerFormState>["errors"] = {};
  if (!isNonEmptyFile(fxLicense)) {
    errors.fxLicense = ["Upload your foreign exchange license."];
  }
  if (isBusiness && !isNonEmptyFile(businessRegistration)) {
    errors.businessRegistration = ["Upload your business registration."];
  }
  if (!isNonEmptyFile(idCard)) {
    errors.idCard = ["Upload the ID card of the responsible person."];
  }
  if (typeof livePhoto !== "string" || !livePhoto.startsWith("data:image/")) {
    errors.livePhoto = ["Capture a live photo with your camera."];
  }
  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  const [fxLicensePath, idCardPath, livePhotoPath, businessRegistrationPath] =
    await Promise.all([
      isNonEmptyFile(fxLicense) ? saveUploadedFile(session.userId, "fx-license", fxLicense) : null,
      isNonEmptyFile(idCard) ? saveUploadedFile(session.userId, "id-card", idCard) : null,
      typeof livePhoto === "string" ? saveDataUrl(session.userId, "live-photo", livePhoto) : null,
      isBusiness && isNonEmptyFile(businessRegistration)
        ? saveUploadedFile(session.userId, "business-registration", businessRegistration)
        : null,
    ]);

  await db.user.update({
    where: { id: session.userId },
    data: {
      role: "SELLER",
      isBusiness,
      fxLicensePath,
      idCardPath,
      livePhotoPath,
      businessRegistrationPath,
      verificationStatus: "PENDING",
    },
  });

  // The role in the session cookie is stale until reissued.
  await createSession({ userId: session.userId, role: "SELLER" });

  revalidatePath("/", "layout");
  redirect("/seller");
}

// Seller -> buyer is blocked while they have orders in flight, so a buyer
// never ends up with an accepted order and no seller to fulfil it.
export async function becomeBuyer(
  _state: BecomeBuyerFormState
): Promise<BecomeBuyerFormState> {
  const session = await verifySession();
  if (session.role !== "SELLER") {
    return { message: "Only seller accounts can switch to a buyer account." };
  }

  const activeOrders = await db.order.count({
    where: { sellerId: session.userId, status: { in: ["PENDING", "CONFIRMED"] } },
  });
  if (activeOrders > 0) {
    return {
      message: `You have ${activeOrders} active order${activeOrders === 1 ? "" : "s"} as a seller. Complete or cancel them before switching to a buyer account.`,
    };
  }

  await db.$transaction([
    db.sellerRate.deleteMany({ where: { sellerId: session.userId } }),
    db.user.update({ where: { id: session.userId }, data: { role: "BUYER" } }),
  ]);

  await createSession({ userId: session.userId, role: "BUYER" });

  revalidatePath("/", "layout");
  redirect("/");
}
