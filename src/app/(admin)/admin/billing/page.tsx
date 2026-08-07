import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-session";
import { db } from "@/lib/db";
import { getPaymentSettings } from "@/lib/payments";
import { LOCAL_CURRENCY } from "@/lib/config";
import AdminNav from "@/components/AdminNav";
import {
  createSubscriptionTier,
  setSubscriptionTierActive,
  createBoostTier,
  setBoostTierActive,
  updatePaymentSettings,
} from "@/app/actions/billing";

function TierRow({
  tier,
  toggleAction,
}: {
  tier: { id: string; name: string; days: number; price: number; active: boolean };
  toggleAction: (id: string, active: boolean) => Promise<void>;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-zinc-200 px-3 py-2 text-sm dark:border-zinc-800">
      <div>
        <p className="font-medium">{tier.name}</p>
        <p className="text-xs text-zinc-500">
          {tier.days} days · {tier.price.toLocaleString()} {LOCAL_CURRENCY}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
            tier.active
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
              : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
          }`}
        >
          {tier.active ? "Active" : "Disabled"}
        </span>
        <form action={toggleAction.bind(null, tier.id, !tier.active)}>
          <button
            type="submit"
            className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-medium dark:border-zinc-700"
          >
            {tier.active ? "Disable" : "Enable"}
          </button>
        </form>
      </div>
    </div>
  );
}

function NewTierForm({ action }: { action: (formData: FormData) => Promise<void> }) {
  return (
    <form action={action} className="mt-3 flex flex-wrap items-end gap-2">
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-500">Name</label>
        <input
          name="name"
          type="text"
          required
          placeholder="e.g. Monthly"
          className="w-36 rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-500">Days</label>
        <input
          name="days"
          type="number"
          min="1"
          required
          className="w-20 rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-500">
          Price ({LOCAL_CURRENCY})
        </label>
        <input
          name="price"
          type="number"
          min="0"
          step="0.01"
          required
          className="w-28 rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>
      <button
        type="submit"
        className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
      >
        Add
      </button>
    </form>
  );
}

export default async function AdminBillingPage() {
  if (!(await isAdmin())) {
    redirect("/admin/login");
  }

  const [subscriptionTiers, boostTiers, bank] = await Promise.all([
    db.subscriptionTier.findMany({ orderBy: { days: "asc" } }),
    db.boostTier.findMany({ orderBy: { days: "asc" } }),
    getPaymentSettings(),
  ]);

  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-semibold">Billing settings</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Subscription and boost plans, and the bank account sellers pay into.
        </p>

        <section className="mt-6 rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
          <h2 className="text-sm font-medium text-zinc-500">Subscription plans</h2>
          <div className="mt-3 flex flex-col gap-2">
            {subscriptionTiers.map((tier) => (
              <TierRow key={tier.id} tier={tier} toggleAction={setSubscriptionTierActive} />
            ))}
            {subscriptionTiers.length === 0 && (
              <p className="text-sm text-zinc-500">No plans yet.</p>
            )}
          </div>
          <NewTierForm action={createSubscriptionTier} />
        </section>

        <section className="mt-6 rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
          <h2 className="text-sm font-medium text-zinc-500">Boost plans</h2>
          <div className="mt-3 flex flex-col gap-2">
            {boostTiers.map((tier) => (
              <TierRow key={tier.id} tier={tier} toggleAction={setBoostTierActive} />
            ))}
            {boostTiers.length === 0 && (
              <p className="text-sm text-zinc-500">No plans yet.</p>
            )}
          </div>
          <NewTierForm action={createBoostTier} />
        </section>

        <section className="mt-6 rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
          <h2 className="text-sm font-medium text-zinc-500">Bank account details</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Shown to sellers when they request a subscription or boost.
          </p>
          <form action={updatePaymentSettings} className="mt-3 flex flex-col gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">
                Bank name
              </label>
              <input
                name="bankName"
                type="text"
                defaultValue={bank.bankName}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">
                Account name
              </label>
              <input
                name="accountName"
                type="text"
                defaultValue={bank.accountName}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">
                Account number
              </label>
              <input
                name="accountNumber"
                type="text"
                defaultValue={bank.accountNumber}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">
                Branch (optional)
              </label>
              <input
                name="branch"
                type="text"
                defaultValue={bank.branch}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">
                Extra instructions (optional)
              </label>
              <textarea
                name="instructions"
                defaultValue={bank.instructions}
                rows={2}
                className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
            <button
              type="submit"
              className="self-start rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
            >
              Save bank details
            </button>
          </form>
        </section>
      </main>
    </>
  );
}
