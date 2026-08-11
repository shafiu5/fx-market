import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-session";
import { db } from "@/lib/db";
import AdminNav from "@/components/AdminNav";
import VerificationBadge from "@/components/VerificationBadge";
import { LOCAL_CURRENCY, CURRENCIES, isCurrencyCode } from "@/lib/config";

const STALE_MS = 24 * 60 * 60 * 1000;

export default async function AdminRatesPage({
  searchParams,
}: {
  searchParams: Promise<{ currency?: string; q?: string }>;
}) {
  if (!(await isAdmin())) {
    redirect("/admin/login");
  }

  const { currency: rawCurrency, q: rawQ } = await searchParams;
  const currency =
    rawCurrency && isCurrencyCode(rawCurrency) ? rawCurrency : "ALL";
  const q = (rawQ ?? "").trim();

  const rates = await db.sellerRate.findMany({
    where: {
      ...(currency !== "ALL" ? { currency } : {}),
      ...(q ? { seller: { name: { contains: q } } } : {}),
    },
    include: {
      seller: {
        select: {
          name: true,
          email: true,
          verificationStatus: true,
          suspended: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  const now = Date.now();

  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-2xl font-semibold">Rates</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Every rate posted across all sellers and currencies.
        </p>

        <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">
              Currency
            </label>
            <select
              name="currency"
              defaultValue={currency}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              <option value="ALL">All currencies</option>
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium text-zinc-500">
              Seller name
            </label>
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="Search…"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>

          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
          >
            Filter
          </button>
        </form>

        <p className="mt-4 text-xs text-zinc-500">{rates.length} rate(s)</p>

        <div className="mt-3 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-zinc-500 dark:bg-zinc-900">
              <tr>
                <th className="px-4 py-3 font-medium">Seller</th>
                <th className="px-4 py-3 font-medium">Currency</th>
                <th className="px-4 py-3 font-medium">Buy at</th>
                <th className="px-4 py-3 font-medium">Sell at</th>
                <th className="px-4 py-3 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody>
              {rates.map((rate) => {
                const isStale = now - new Date(rate.updatedAt).getTime() > STALE_MS;
                return (
                  <tr
                    key={rate.id}
                    className="border-t border-zinc-200 dark:border-zinc-800"
                  >
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="font-medium">{rate.seller.name}</p>
                        <VerificationBadge status={rate.seller.verificationStatus} />
                        {rate.seller.suspended && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-800 dark:bg-red-900/40 dark:text-red-300">
                            Suspended
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500">{rate.seller.email}</p>
                    </td>
                    <td className="px-4 py-3 font-medium">{rate.currency}</td>
                    <td className="px-4 py-3">
                      {rate.buyRate.toFixed(2)} {LOCAL_CURRENCY}
                    </td>
                    <td className="px-4 py-3">
                      {rate.sellRate.toFixed(2)} {LOCAL_CURRENCY}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-zinc-500">
                        {new Date(rate.updatedAt).toLocaleString()}
                      </span>
                      {isStale && (
                        <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                          Stale
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
