import Link from "next/link";
import { db } from "@/lib/db";
import { getOptionalSession } from "@/lib/dal";
import AutoRefresh from "@/components/AutoRefresh";
import VerificationBadge from "@/components/VerificationBadge";
import BoostBadge from "@/components/BoostBadge";
import RateFlashBox from "@/components/RateFlashBox";
import RateSparkline, { RANGES, Range } from "@/components/RateSparkline";
import CurrencySelect from "@/components/CurrencySelect";
import { isBoosted } from "@/lib/boost";
import { DEFAULT_CURRENCY, isCurrencyCode, currencyName } from "@/lib/config";

const SORTS = [
  {
    value: "buy",
    label: "Best buy",
    description: (currency: string) =>
      `Sorted by best (lowest) rate to buy ${currency}.`,
  },
  {
    value: "sell",
    label: "Best sell",
    description: (currency: string) =>
      `Sorted by highest rate to sell ${currency}.`,
  },
] as const;

type Sort = (typeof SORTS)[number]["value"];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ currency?: string; sort?: string; range?: string }>;
}) {
  const { currency: rawCurrency, sort: rawSort, range: rawRange } = await searchParams;
  const currency =
    rawCurrency && isCurrencyCode(rawCurrency) ? rawCurrency : DEFAULT_CURRENCY;
  const sort: Sort = rawSort === "sell" ? "sell" : "buy";
  const range: Range = RANGES.some((r) => r.value === rawRange)
    ? (rawRange as Range)
    : "1d";
  const since = new Date(Date.now() - RANGES.find((r) => r.value === range)!.ms);

  const [session, sellersRaw, snapshots] = await Promise.all([
    getOptionalSession(),
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
      orderBy:
        sort === "sell" ? { buyRate: "desc" } : { sellRate: "asc" },
    }),
    db.rateSnapshot.findMany({
      where: { currency, createdAt: { gte: since } },
      orderBy: { createdAt: "asc" },
      take: 500,
      select: { rate: true },
    }),
  ]);

  // Boosted sellers pin to the top; stable sort preserves the rate-based
  // order already applied by the query within each group.
  const sellers = [...sellersRaw].sort((a, b) => {
    const aBoosted = isBoosted(a.seller) ? 0 : 1;
    const bBoosted = isBoosted(b.seller) ? 0 : 1;
    return aBoosted - bBoosted;
  });

  const sparklinePoints = snapshots.map((s) => s.rate);

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <AutoRefresh />
      <h1 className="text-2xl font-semibold">Foreign exchange rates</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Live rates posted by independent sellers.{" "}
        {SORTS.find((s) => s.value === sort)?.description(currency)}
      </p>

      <div className="mt-6 flex flex-nowrap items-center gap-2 overflow-x-auto">
        <CurrencySelect currency={currency} sort={sort} range={range} />
        <div className="flex shrink-0 gap-1.5">
          {SORTS.map((s) => (
            <Link
              key={s.value}
              href={`/?currency=${currency}&sort=${s.value}&range=${range}`}
              className={`rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${
                s.value === sort
                  ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                  : "border border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
              }`}
            >
              {s.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-4">
        <RateSparkline
          currency={currency}
          sort={sort}
          range={range}
          points={sparklinePoints}
        />
      </div>

      {sellers.length === 0 ? (
        <p className="mt-10 text-sm text-zinc-500">
          No sellers have posted {currency} rates yet.
        </p>
      ) : (
        <div className="mt-6 flex flex-col gap-2">
          {sellers.map((row) => {
            const buyHref = session
              ? `/order/${row.seller.id}?type=SELL&currency=${currency}`
              : "/login";
            const sellHref = session
              ? `/order/${row.seller.id}?type=BUY&currency=${currency}`
              : "/login";

            return (
              <div
                key={row.id}
                className={`flex items-center justify-between gap-3 rounded-lg border p-3 ${
                  isBoosted(row.seller)
                    ? "border-purple-300 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/20"
                    : "border-zinc-200 dark:border-zinc-800"
                }`}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium">{row.seller.name}</p>
                    <VerificationBadge status={row.seller.verificationStatus} />
                    {isBoosted(row.seller) && <BoostBadge />}
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    Updated {new Date(row.updatedAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex shrink-0 gap-2">
                  <RateFlashBox
                    href={buyHref}
                    label="They buy at"
                    rate={row.buyRate}
                    favorableDirection="up"
                  />
                  <RateFlashBox
                    href={sellHref}
                    label="They sell at"
                    rate={row.sellRate}
                    favorableDirection="down"
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="mt-4 text-xs text-zinc-400">{currencyName(currency)}</p>
    </main>
  );
}
