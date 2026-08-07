"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/dal";
import { PhoneSchema, PhoneFormState } from "@/lib/definitions";

export async function updatePhone(
  _state: PhoneFormState,
  formData: FormData
): Promise<PhoneFormState> {
  const session = await verifySession();

  const validated = PhoneSchema.safeParse({
    phone: formData.get("phone"),
  });

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors };
  }

  await db.user.update({
    where: { id: session.userId },
    data: { phone: validated.data.phone },
  });

  revalidatePath("/settings");

  return { message: "Contact number saved." };
}
