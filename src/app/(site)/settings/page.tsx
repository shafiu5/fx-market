import Link from "next/link";
import { verifySession } from "@/lib/dal";
import { db } from "@/lib/db";
import { getActiveSubscriptionTiers, getActiveBoostTiers, getPaymentSettings } from "@/lib/payments";
import { isSubscriptionActive, isBoosted } from "@/lib/boost";
import PhoneForm from "@/components/PhoneForm";
import PaymentRequestDialog from "@/components/PaymentRequestDialog";
import { requestSubscriptionRenewal, requestBoost } from "@/app/actions/payments";
import { disconnectTelegram } from "@/app/actions/telegram";
import BecomeSellerForm from "@/components/BecomeSellerForm";
import BecomeBuyerButton from "@/components/BecomeBuyerButton";
import VerificationBadge from "@/components/VerificationBadge";
import SellerSettingsForm from "@/components/SellerSettingsForm";

const TABS = [
  { value: "contact", label: "Contact", roles: ["BUYER", "SELLER"] },
  { value: "subscription", label: "Subscription & Boost", roles: ["SELLER"] },
  { value: "notifications", label: "Notifications", roles: ["SELLER"] },
  { value: "account", label: "Account", roles: ["BUYER", "SELLER"] },
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
  const visibleTabs = TABS.filter((t) => (t.roles as readonly string[]).includes(session.role));
  const tab: Tab = visibleTabs.some((t) => t.value === rawTab) ? (rawTab as Tab) : "contact";

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

  let subscriptionBoostTab = null;

  if (isSeller && tab === "subscription") {
    const [subTiers, boostTiers, bank, subPending, boostPending] = await Promise.all([
      getActiveSubscriptionTiers(),
      getActiveBoostTiers(),
      getPaymentSettings(),
      db.paymentRequest.findFirst({
        where: { sellerId: session.userId, kind: "SUBSCRIPTION", status: "PENDING" },
      }),
      db.paymentRequest.findFirst({
        where: { sellerId: session.userId, kind: "BOOST", status: "PENDING" },
      }),
    ]);

    subscriptionBoostTab = (
      <>
        <div className="mt-6 rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Subscription</p>
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
              tiers={subTiers}
              bank={bank}
              action={requestSubscriptionRenewal}
              hasPendingRequest={!!subPending}
            />
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium">Boost</p>
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
              tiers={boostTiers}
              bank={bank}
              action={requestBoost}
              hasPendingRequest={!!boostPending}
            />
          </div>
        </div>
      </>
    );
  }

  const botUsername = process.env.TELEGRAM_BOT_USERNAME;
  const connectHref = botUsername
    ? `https://t.me/${botUsername}?start=${session.userId}`
    : null;

  const activeSellerOrders =
    isSeller && tab === "account"
      ? await db.order.count({
          where: { sellerId: session.userId, status: { in: ["PENDING", "CONFIRMED"] } },
        })
      : 0;

  const verificationMe =
    isSeller && tab === "account"
      ? await db.user.findUniqueOrThrow({
          where: { id: session.userId },
          select: {
            verificationStatus: true,
            isBusiness: true,
            fxLicensePath: true,
            businessRegistrationPath: true,
            idCardPath: true,
            livePhotoPath: true,
          },
        })
      : null;

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <div className="mt-6 flex flex-wrap gap-2">
        {visibleTabs.map((t) => (
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

      {tab === "contact" && (
        <div className="mt-6 rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
          <p className="mb-4 text-sm text-zinc-500">Your contact details.</p>
          <PhoneForm phone={me.phone} />
        </div>
      )}

      {tab === "subscription" && subscriptionBoostTab}

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

      {tab === "account" && (
        <>
          {isSeller && verificationMe && (
            <div className="mt-6 rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <p className="text-sm font-medium">Verification</p>
                <VerificationBadge status={verificationMe.verificationStatus} />
              </div>
              <p className="mt-1 text-sm text-zinc-500">
                Update your license and identity documents. Changing any
                document sends your account back to pending review.
              </p>
              <div className="mt-4">
                <SellerSettingsForm
                  isBusiness={verificationMe.isBusiness}
                  fxLicensePath={verificationMe.fxLicensePath}
                  businessRegistrationPath={verificationMe.businessRegistrationPath}
                  idCardPath={verificationMe.idCardPath}
                  livePhotoPath={verificationMe.livePhotoPath}
                />
              </div>
            </div>
          )}

          <div className="mt-6 rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
            {isSeller ? (
              <>
                <p className="text-sm font-medium">Switch to a buyer account</p>
                <p className="mt-1 text-sm text-zinc-500">
                  This removes your posted rates from the market. Your account
                  history and past orders are kept.
                </p>
                {activeSellerOrders > 0 && (
                  <p className="mt-3 text-sm text-amber-600 dark:text-amber-400">
                    You have {activeSellerOrders} active order
                    {activeSellerOrders === 1 ? "" : "s"} as a seller — complete
                    or cancel {activeSellerOrders === 1 ? "it" : "them"} first.
                  </p>
                )}
                <div className="mt-4">
                  <BecomeBuyerButton />
                </div>
              </>
            ) : (
              <>
                <p className="text-sm font-medium">Switch to a seller account</p>
                <BecomeSellerForm />
              </>
            )}
          </div>
        </>
      )}
    </main>
  );
}
