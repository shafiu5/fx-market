import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/dal";
import OrderForm from "@/components/OrderForm";
import { isSubscriptionActive } from "@/lib/boost";
import { DEFAULT_CURRENCY, isCurrencyCode } from "@/lib/config";

export default async function NewOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ sellerId: string }>;
  searchParams: Promise<{ type?: string; currency?: string }>;
}) {
  const session = await verifySession();
  if (session.role !== "BUYER") {
    redirect("/seller");
  }

  const { sellerId } = await params;
  const { type: rawType, currency: rawCurrency } = await searchParams;
  const type = rawType === "SELL" ? "SELL" : "BUY";
  const currency =
    rawCurrency && isCurrencyCode(rawCurrency) ? rawCurrency : DEFAULT_CURRENCY;

  const [sellerRate, me] = await Promise.all([
    db.sellerRate.findUnique({
      where: { sellerId_currency: { sellerId, currency } },
      include: {
        seller: {
          select: {
            name: true,
            phone: true,
            verificationStatus: true,
            suspended: true,
            subscriptionActive: true,
            subscriptionExpiresAt: true,
          },
        },
      },
    }),
    db.user.findUniqueOrThrow({
      where: { id: session.userId },
      select: { phone: true },
    }),
  ]);

  if (
    !sellerRate ||
    sellerRate.buyRate <= 0 ||
    sellerRate.sellRate <= 0 ||
    sellerRate.seller.suspended
  ) {
    notFound();
  }

  const rate = type === "BUY" ? sellerRate.sellRate : sellerRate.buyRate;
  const isVerified = sellerRate.seller.verificationStatus === "VERIFIED";
  const sellerCanAccept = isSubscriptionActive(sellerRate.seller);

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-2xl font-semibold">
        {type === "BUY" ? "Buy" : "Sell"} {currency}
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        With {sellerRate.seller.name}
        {sellerRate.seller.phone && (
          <>
            {" "}
            ·{" "}
            <a href={`tel:${sellerRate.seller.phone}`} className="underline">
              {sellerRate.seller.phone}
            </a>
          </>
        )}
      </p>

      {!isVerified && (
        <div className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
          <p className="font-medium">This seller isn&apos;t verified yet</p>
          <p className="mt-1 text-amber-800/90 dark:text-amber-300/80">
            {sellerRate.seller.name}{" "}
            hasn&apos;t completed FX license and ID verification. Deal with
            unverified sellers at your own risk.
          </p>
        </div>
      )}

      {!sellerCanAccept ? (
        <div className="mt-6 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          <p className="font-medium">This seller isn&apos;t accepting orders</p>
          <p className="mt-1 text-red-800/90 dark:text-red-300/80">
            {sellerRate.seller.name}{" "}
            can&apos;t take new orders right now.
          </p>
        </div>
      ) : (
        <div className="mt-6 rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
          <OrderForm
            sellerId={sellerId}
            currency={currency}
            type={type}
            rate={rate}
            defaultPhone={me.phone ?? ""}
          />
        </div>
      )}
    </main>
  );
}
