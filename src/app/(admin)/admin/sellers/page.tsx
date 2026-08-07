import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-session";
import { db } from "@/lib/db";
import {
  setVerificationStatus,
  setSubscriptionStatus,
  setSellerBoost,
} from "@/app/actions/admin";
import { isSubscriptionActive, isBoosted } from "@/lib/boost";
import AdminNav from "@/components/AdminNav";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  VERIFIED:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

function DocLink({ label, path }: { label: string; path: string | null }) {
  if (!path) {
    return (
      <p className="text-xs text-zinc-400">
        {label}: <span className="italic">not provided</span>
      </p>
    );
  }
  return (
    <p className="text-xs">
      {label}:{" "}
      <a
        href={`/files/${path}`}
        target="_blank"
        rel="noreferrer"
        className="font-medium underline"
      >
        view
      </a>
    </p>
  );
}

function PresetButton({
  label,
  action,
}: {
  label: string;
  action: () => Promise<void>;
}) {
  return (
    <form action={action}>
      <button
        type="submit"
        className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-medium dark:border-zinc-700"
      >
        {label}
      </button>
    </form>
  );
}

export default async function AdminSellersPage() {
  if (!(await isAdmin())) {
    redirect("/admin/login");
  }

  const sellers = await db.user.findMany({
    where: { role: "SELLER" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-2xl font-semibold">Seller verification</h1>

        <div className="mt-6 flex flex-col gap-3">
          {sellers.map((seller) => {
            const subActive = isSubscriptionActive(seller);
            const boosted = isBoosted(seller);

            return (
              <div
                key={seller.id}
                className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{seller.name}</p>
                    <p className="text-xs text-zinc-500">{seller.email}</p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[seller.verificationStatus]}`}
                  >
                    {seller.verificationStatus}
                  </span>
                </div>

                <div className="mt-3 flex flex-col gap-1">
                  <p className="text-xs text-zinc-500">
                    {seller.isBusiness ? "Registered business" : "Individual"}
                  </p>
                  <DocLink label="FX license" path={seller.fxLicensePath} />
                  {seller.isBusiness && (
                    <DocLink
                      label="Business registration"
                      path={seller.businessRegistrationPath}
                    />
                  )}
                  <DocLink label="ID card" path={seller.idCardPath} />
                  <DocLink label="Live photo" path={seller.livePhotoPath} />
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <form action={setVerificationStatus.bind(null, seller.id, "VERIFIED")}>
                    <button
                      type="submit"
                      className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
                    >
                      Mark verified
                    </button>
                  </form>
                  <form action={setVerificationStatus.bind(null, seller.id, "REJECTED")}>
                    <button
                      type="submit"
                      className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium dark:border-zinc-700"
                    >
                      Reject
                    </button>
                  </form>
                  <form action={setVerificationStatus.bind(null, seller.id, "PENDING")}>
                    <button
                      type="submit"
                      className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium dark:border-zinc-700"
                    >
                      Reset to pending
                    </button>
                  </form>
                </div>

                <div className="mt-4 border-t border-zinc-200 pt-3 dark:border-zinc-800">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-medium text-zinc-500">Subscription:</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        subActive
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                          : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                      }`}
                    >
                      {subActive
                        ? `Active until ${new Date(seller.subscriptionExpiresAt!).toLocaleDateString()}`
                        : "Inactive"}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <PresetButton
                      label="+30 days"
                      action={setSubscriptionStatus.bind(null, seller.id, 30)}
                    />
                    <PresetButton
                      label="+90 days"
                      action={setSubscriptionStatus.bind(null, seller.id, 90)}
                    />
                    <PresetButton
                      label="+365 days"
                      action={setSubscriptionStatus.bind(null, seller.id, 365)}
                    />
                    {subActive && (
                      <PresetButton
                        label="Deactivate"
                        action={setSubscriptionStatus.bind(null, seller.id, null)}
                      />
                    )}
                  </div>
                </div>

                <div className="mt-4 border-t border-zinc-200 pt-3 dark:border-zinc-800">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-medium text-zinc-500">Boost:</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        boosted
                          ? "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300"
                          : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                      }`}
                    >
                      {boosted
                        ? `Boosted until ${new Date(seller.boostedUntil!).toLocaleString()}`
                        : "Not boosted"}
                    </span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <PresetButton
                      label="Boost 1 day"
                      action={setSellerBoost.bind(null, seller.id, 1)}
                    />
                    <PresetButton
                      label="Boost 7 days"
                      action={setSellerBoost.bind(null, seller.id, 7)}
                    />
                    <PresetButton
                      label="Boost 30 days"
                      action={setSellerBoost.bind(null, seller.id, 30)}
                    />
                    {boosted && (
                      <PresetButton
                        label="Remove boost"
                        action={setSellerBoost.bind(null, seller.id, null)}
                      />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
