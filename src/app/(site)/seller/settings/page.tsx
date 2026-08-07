import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/dal";
import VerificationBadge from "@/components/VerificationBadge";
import SellerSettingsForm from "@/components/SellerSettingsForm";

export default async function SellerSettingsPage() {
  const session = await verifySession();
  if (session.role !== "SELLER") {
    redirect("/orders");
  }

  const me = await db.user.findUniqueOrThrow({ where: { id: session.userId } });

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">Verification settings</h1>
        <VerificationBadge status={me.verificationStatus} />
      </div>
      <p className="mt-1 text-sm text-zinc-500">
        Update your license and identity documents. Changing any document
        sends your account back to pending review.
      </p>

      <div className="mt-6 rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
        <SellerSettingsForm
          isBusiness={me.isBusiness}
          fxLicensePath={me.fxLicensePath}
          businessRegistrationPath={me.businessRegistrationPath}
          idCardPath={me.idCardPath}
          livePhotoPath={me.livePhotoPath}
        />
      </div>
    </main>
  );
}
