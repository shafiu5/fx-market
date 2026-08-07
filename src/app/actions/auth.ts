"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { createSession, deleteSession } from "@/lib/session";
import { saveUploadedFile, saveDataUrl } from "@/lib/uploads";
import {
  LoginSchema,
  LoginFormState,
  RegisterSchema,
  RegisterFormState,
} from "@/lib/definitions";

function isNonEmptyFile(value: FormDataEntryValue | null): value is File {
  return value instanceof File && value.size > 0;
}

export async function register(
  _state: RegisterFormState,
  formData: FormData
): Promise<RegisterFormState> {
  const validated = RegisterSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { name, email, password, role } = validated.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { message: "An account with that email already exists." };
  }

  // Sellers are the licensed money changers here, so they go through a
  // verification packet: FX dealer license, ID of the responsible person,
  // a live camera photo, and — for a registered business — its registration.
  const isBusiness = formData.get("isBusiness") === "on";
  const fxLicense = formData.get("fxLicense");
  const businessRegistration = formData.get("businessRegistration");
  const idCard = formData.get("idCard");
  const livePhoto = formData.get("livePhoto");

  if (role === "SELLER") {
    const errors: NonNullable<RegisterFormState>["errors"] = {};

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
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await db.user.create({
    data: { name, email, passwordHash, role },
  });

  if (role === "SELLER") {
    const [fxLicensePath, idCardPath, livePhotoPath, businessRegistrationPath] =
      await Promise.all([
        isNonEmptyFile(fxLicense)
          ? saveUploadedFile(user.id, "fx-license", fxLicense)
          : null,
        isNonEmptyFile(idCard) ? saveUploadedFile(user.id, "id-card", idCard) : null,
        typeof livePhoto === "string"
          ? saveDataUrl(user.id, "live-photo", livePhoto)
          : null,
        isBusiness && isNonEmptyFile(businessRegistration)
          ? saveUploadedFile(user.id, "business-registration", businessRegistration)
          : null,
      ]);

    await db.user.update({
      where: { id: user.id },
      data: {
        isBusiness,
        fxLicensePath,
        idCardPath,
        livePhotoPath,
        businessRegistrationPath,
        verificationStatus: "PENDING",
      },
    });
  }

  await createSession({ userId: user.id, role: user.role });
  redirect(role === "SELLER" ? "/seller" : "/");
}

export async function login(
  _state: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  const validated = LoginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  const { email, password } = validated.data;

  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    return { message: "Invalid email or password." };
  }

  const passwordsMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordsMatch) {
    return { message: "Invalid email or password." };
  }

  if (user.suspended) {
    return { message: "This account has been suspended." };
  }

  await createSession({ userId: user.id, role: user.role });
  redirect(user.role === "SELLER" ? "/seller" : "/");
}

export async function logout() {
  await deleteSession();
  redirect("/");
}
