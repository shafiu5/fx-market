import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/dal";
import { markMarketSeen } from "@/app/actions/notifications";
import AutoRefresh from "@/components/AutoRefresh";
import VerificationBadge from "@/components/VerificationBadge";
import BoostBadge from "@/components/BoostBadge";
import RateStatBoxes from "@/components/RateStatBoxes";
import MarkOrdersSeen from "@/components/MarkOrdersSeen";
import { isBoosted } from "@/lib/boost";
import {
  LOCAL_CURRENCY,
  CURRENCIES,
  DEFAULT_CURRENCY,
  isCurrencyCode,
  currencyName,
} from "@/lib/config";

export default async function SellerMarketPage({
  searchParams,
}: {
  searchParams: Promise<{ currency?: string }>;
}) {
  const session = await verifySession();
  if (session.role !== "SELLER") {
    redirect("/orders");
  }

  const { currency: rawCurrency } = await searchParams;
  const currency =
    rawCurrency && isCurrencyCode(rawCurrency) ? rawCurrency : DEFAULT_CURRENCY;

  const [sellersRaw, me] = await Promise.all([
    db.sellerRate.findMany({
      where: {
        currency,
        buyRate: { gt: 0 },
        sellRate: { gt: 0 },
        seller: { suspended: false },
      },
      include: {
        seller: {
          select: { id: true, name: true, verificationStatus: true, boostedUntil: true },
        },
      },
      orderBy: { sellRate: "asc" },
    }),
    db.user.findUniqueOrThrow({
      where: { id: session.userId },
      select: { marketViewedAt: true },
    }),
  ]);

  const sellers = [...sellersRaw].sort((a, b) => {
    const aBoosted = isBoosted(a.seller) ? 0 : 1;
    const bBoosted = isBoosted(b.seller) ? 0 : 1;
    return aBoosted - bBoosted;
  });

  const myRank = sellers.findIndex((row) => row.seller.id === session.userId);
  const viewedAt = new Date(me.marketViewedAt ?? 0).getTime();

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <MarkOrdersSeen action={markMarketSeen} />
      <AutoRefresh />
      <h1 className="text-2xl font-semibold">Competitor rates</h1>
      <p className="mt-1 text-sm text-zinc-500">
        What other sellers are posting for {currency}/{LOCAL_CURRENCY}, best
        rate to buy {currency} first.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {CURRENCIES.map((c) => (
          <Link
            key={c.code}
            href={`/seller/market?currency=${c.code}`}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              c.code === currency
                ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                : "border border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
            }`}
          >
            {c.code}
          </Link>
        ))}
      </div>

      {sellers.length === 0 ? (
        <p className="mt-10 text-sm text-zinc-500">
          No sellers have posted {currency} rates yet.
        </p>
      ) : (
        <>
          <p className="mt-4 text-sm text-zinc-500">
            {myRank === -1
              ? `You haven't posted a ${currency} rate yet.`
              : `You're ranked #${myRank + 1} of ${sellers.length} on ${currency}.`}
          </p>

          <div className="mt-4 flex flex-col gap-3">
            {sellers.map((row, i) => {
              const isMe = row.seller.id === session.userId;
              const isNew = !isMe && new Date(row.updatedAt).getTime() > viewedAt;
              return (
                <div
                  key={row.id}
                  className={`rounded-lg border p-4 ${
                    isMe
                      ? "border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30"
                      : "border-zinc-200 dark:border-zinc-800"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm text-zinc-500">#{i + 1}</span>
                    <p className="font-medium">{row.seller.name}</p>
                    <VerificationBadge status={row.seller.verificationStatus} />
                    {isBoosted(row.seller) && <BoostBadge />}
                    {isMe && (
                      <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[11px] font-medium text-white">
                        You
                      </span>
                    )}
                    {isNew && (
                      <span className="rounded-full bg-red-600 px-2 py-0.5 text-[11px] font-medium text-white">
                        New
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    Updated {new Date(row.updatedAt).toLocaleString()}
                  </p>

                  <div className="mt-3">
                    <RateStatBoxes buyRate={row.buyRate} sellRate={row.sellRate} />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <p className="mt-4 text-xs text-zinc-400">{currencyName(currency)}</p>
    </main>
  );
}
