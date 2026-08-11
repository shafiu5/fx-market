import Link from "next/link";
import { db } from "@/lib/db";
import { getOptionalSession } from "@/lib/dal";
import AutoRefresh from "@/components/AutoRefresh";
import VerificationBadge from "@/components/VerificationBadge";
import BoostBadge from "@/components/BoostBadge";
import { isBoosted } from "@/lib/boost";
import {
  LOCAL_CURRENCY,
  CURRENCIES,
  DEFAULT_CURRENCY,
  isCurrencyCode,
  currencyName,
} from "@/lib/config";

const SORTS = [
  {
    value: "buy",
    label: "Best rate to buy",
    description: (currency: string) =>
      `Sorted by best (lowest) rate to buy ${currency}.`,
  },
  {
    value: "sell",
    label: "Highest rate to sell",
    description: (currency: string) =>
      `Sorted by highest rate to sell ${currency}.`,
  },
] as const;

type Sort = (typeof SORTS)[number]["value"];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ currency?: string; sort?: string }>;
}) {
  const { currency: rawCurrency, sort: rawSort } = await searchParams;
  const currency =
    rawCurrency && isCurrencyCode(rawCurrency) ? rawCurrency : DEFAULT_CURRENCY;
  const sort: Sort = rawSort === "sell" ? "sell" : "buy";

  const [session, sellersRaw] = await Promise.all([
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
  ]);

  // Boosted sellers pin to the top; stable sort preserves the rate-based
  // order already applied by the query within each group.
  const sellers = [...sellersRaw].sort((a, b) => {
    const aBoosted = isBoosted(a.seller) ? 0 : 1;
    const bBoosted = isBoosted(b.seller) ? 0 : 1;
    return aBoosted - bBoosted;
  });

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <AutoRefresh />
      <h1 className="text-2xl font-semibold">
        {currency}/{LOCAL_CURRENCY} street rates
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Live rates posted by independent sellers.{" "}
        {SORTS.find((s) => s.value === sort)?.description(currency)}
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {CURRENCIES.map((c) => (
          <Link
            key={c.code}
            href={`/?currency=${c.code}&sort=${sort}`}
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

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-zinc-500">Sort:</span>
        {SORTS.map((s) => (
          <Link
            key={s.value}
            href={`/?currency=${currency}&sort=${s.value}`}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              s.value === sort
                ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                : "border border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
            }`}
          >
            {s.label}
          </Link>
        ))}
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
                  <Link
                    href={buyHref}
                    className="rounded-md bg-zinc-50 px-3 py-2 text-right transition-colors hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                  >
                    <p className="text-xs text-zinc-500">They buy at</p>
                    <p className="font-medium">
                      {row.buyRate.toFixed(4)} {LOCAL_CURRENCY}
                    </p>
                  </Link>
                  <Link
                    href={sellHref}
                    className="rounded-md bg-zinc-50 px-3 py-2 text-right transition-colors hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800"
                  >
                    <p className="text-xs text-zinc-500">They sell at</p>
                    <p className="font-medium">
                      {row.sellRate.toFixed(4)} {LOCAL_CURRENCY}
                    </p>
                  </Link>
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
