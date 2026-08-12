import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { db } from "@/lib/db";
import { getActiveSubscriptionTiers, getActiveBoostTiers, getPaymentSettings } from "@/lib/payments";
import { isSubscriptionActive, isBoosted } from "@/lib/boost";
import PhoneForm from "@/components/PhoneForm";
import PaymentRequestDialog from "@/components/PaymentRequestDialog";
import { requestSubscriptionRenewal, requestBoost } from "@/app/actions/payments";
import { disconnectTelegram } from "@/app/actions/telegram";

const TABS = [
  { value: "contact", label: "Contact" },
  { value: "subscription", label: "Subscription" },
  { value: "boost", label: "Boost" },
  { value: "notifications", label: "Notifications" },
] as const;

type Tab = (typeof TABS)[number]["value"];

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await verifySession();
  const { tab: rawTab } = await searchParams;
  const isSeller = session.role === "SELLER";
  const tab: Tab =
    isSeller && TABS.some((t) => t.value === rawTab) ? (rawTab as Tab) : "contact";

  const me = await db.user.findUniqueOrThrow({
    where: { id: session.userId },
    select: {
      phone: true,
      subscriptionActive: true,
      subscriptionExpiresAt: true,
      boostedUntil: true,
      telegramChatId: true,
    },
  });

  const subActive = isSubscriptionActive(me);
  const boosted = isBoosted(me);

  let subscriptionTab = null;
  let boostTab = null;

  if (isSeller && tab === "subscription") {
    const [tiers, bank, pending] = await Promise.all([
      getActiveSubscriptionTiers(),
      getPaymentSettings(),
      db.paymentRequest.findFirst({
        where: { sellerId: session.userId, kind: "SUBSCRIPTION", status: "PENDING" },
      }),
    ]);

    subscriptionTab = (
      <div className="mt-6 rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Status</p>
            <p
              className={`mt-1 text-sm ${subActive ? "text-emerald-600" : "text-red-600"}`}
            >
              {subActive
                ? `Active until ${new Date(me.subscriptionExpiresAt!).toLocaleDateString()}`
                : "Inactive"}
            </p>
          </div>
          <PaymentRequestDialog
            buttonLabel="Renew subscription"
            title="Renew your subscription"
            tiers={tiers}
            bank={bank}
            action={requestSubscriptionRenewal}
            hasPendingRequest={!!pending}
          />
        </div>
      </div>
    );
  }

  if (isSeller && tab === "boost") {
    const [tiers, bank, pending] = await Promise.all([
      getActiveBoostTiers(),
      getPaymentSettings(),
      db.paymentRequest.findFirst({
        where: { sellerId: session.userId, kind: "BOOST", status: "PENDING" },
      }),
    ]);

    boostTab = (
      <div className="mt-6 rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Status</p>
            <p
              className={`mt-1 text-sm ${boosted ? "text-purple-600" : "text-zinc-500"}`}
            >
              {boosted
                ? `Boosted until ${new Date(me.boostedUntil!).toLocaleString()}`
                : "Not boosted"}
            </p>
          </div>
          <PaymentRequestDialog
            buttonLabel="Buy a boost"
            title="Buy a boost"
            tiers={tiers}
            bank={bank}
            action={requestBoost}
            hasPendingRequest={!!pending}
          />
        </div>
      </div>
    );
  }

  const botUsername = process.env.TELEGRAM_BOT_USERNAME;
  const connectHref = botUsername
    ? `https://t.me/${botUsername}?start=${session.userId}`
    : null;

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-semibold">Settings</h1>

      {isSeller && (
        <div className="mt-6 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <Link
              key={t.value}
              href={`/settings?tab=${t.value}`}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                t.value === tab
                  ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                  : "border border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>
      )}

      {tab === "contact" && (
        <div className="mt-6 rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
          <p className="mb-4 text-sm text-zinc-500">Your contact details.</p>
          <PhoneForm phone={me.phone} />
        </div>
      )}

      {tab === "subscription" && subscriptionTab}
      {tab === "boost" && boostTab}

      {tab === "notifications" && (
        <div className="mt-6 rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
          <p className="text-sm font-medium">Telegram alerts</p>
          <p className="mt-1 text-sm text-zinc-500">
            Get a Telegram message the moment a buyer places a new order.
          </p>

          {me.telegramChatId ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                ✅ Connected
              </span>
              <form action={disconnectTelegram}>
                <button
                  type="submit"
                  className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 dark:border-red-800 dark:text-red-400"
                >
                  Disconnect
                </button>
              </form>
            </div>
          ) : connectHref ? (
            <a
              href={connectHref}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
            >
              Connect Telegram
            </a>
          ) : (
            <p className="mt-4 text-xs text-zinc-400">
              Telegram notifications aren&apos;t configured yet.
            </p>
          )}
        </div>
      )}
    </main>
  );
}
