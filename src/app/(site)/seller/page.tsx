import Link from "next/link";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/dal";
import AutoRefresh from "@/components/AutoRefresh";
import RateForm from "@/components/RateForm";
import VerificationBadge from "@/components/VerificationBadge";
import { isSubscriptionActive, isBoosted } from "@/lib/boost";
import { CURRENCIES } from "@/lib/config";

export default async function SellerDashboard() {
  const session = await verifySession();

  const [me, rates, pendingCount] = await Promise.all([
    db.user.findUniqueOrThrow({
      where: { id: session.userId },
      select: {
        verificationStatus: true,
        subscriptionActive: true,
        subscriptionExpiresAt: true,
        boostedUntil: true,
      },
    }),
    db.sellerRate.findMany({ where: { sellerId: session.userId } }),
    db.order.count({
      where: { sellerId: session.userId, status: "PENDING" },
    }),
  ]);

  const rateByCurrency = new Map(rates.map((r) => [r.currency, r]));
  const subActive = isSubscriptionActive(me);
  const boosted = isBoosted(me);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <AutoRefresh />
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">Seller dashboard</h1>
        <VerificationBadge status={me.verificationStatus} />
      </div>
      {me.verificationStatus !== "VERIFIED" && (
        <p className="mt-1 text-sm text-zinc-500">
          {me.verificationStatus === "REJECTED"
            ? "Your verification documents were rejected. Contact support to resubmit."
            : "Your account is pending verification. You can still post rates and take orders while you wait."}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-3 text-sm">
        <span
          className={`rounded-full px-3 py-1.5 font-medium ${
            subActive
              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
              : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
          }`}
        >
          Subscription:{" "}
          {subActive
            ? `Active until ${new Date(me.subscriptionExpiresAt!).toLocaleDateString()}`
            : "Inactive"}
        </span>
        <span
          className={`rounded-full px-3 py-1.5 font-medium ${
            boosted
              ? "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300"
              : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
          }`}
        >
          Boost:{" "}
          {boosted
            ? `Active until ${new Date(me.boostedUntil!).toLocaleString()}`
            : "Not boosted"}
        </span>
      </div>

      {!subActive && (
        <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          <p className="font-medium">Your subscription is inactive</p>
          <p className="mt-1 text-red-800/90 dark:text-red-300/80">
            You can&apos;t post or update rates, and you can&apos;t accept new
            orders, until your subscription is reactivated. You can still
            complete or cancel orders you already accepted.
          </p>
          <Link
            href="/settings?tab=subscription"
            className="mt-3 inline-block rounded-md bg-red-900 px-3 py-1.5 text-xs font-medium text-white dark:bg-red-100 dark:text-red-900"
          >
            Renew subscription
          </Link>
        </div>
      )}

      <section className="mt-6 rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
        <h2 className="mb-2 text-sm font-medium text-zinc-500">
          Your posted rates
        </h2>
        <div>
          {CURRENCIES.map((c) => (
            <RateForm
              key={c.code}
              currency={c.code}
              currencyName={c.name}
              buyRate={rateByCurrency.get(c.code)?.buyRate ?? 0}
              sellRate={rateByCurrency.get(c.code)?.sellRate ?? 0}
            />
          ))}
        </div>
      </section>

      <Link
        href="/seller/orders"
        className="mt-6 flex items-center justify-between rounded-lg border border-zinc-200 p-5 dark:border-zinc-800"
      >
        <div>
          <p className="font-medium">Orders</p>
          <p className="text-sm text-zinc-500">
            {pendingCount > 0
              ? `${pendingCount} pending order${pendingCount === 1 ? "" : "s"}`
              : "No pending orders"}
          </p>
        </div>
        <span className="text-sm text-zinc-500">View all →</span>
      </Link>
    </main>
  );
}
