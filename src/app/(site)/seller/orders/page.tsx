import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/dal";
import { markSellerOrdersSeen } from "@/app/actions/notifications";
import OrderStatusButtons from "@/components/OrderStatusButtons";
import MarkOrdersSeen from "@/components/MarkOrdersSeen";
import { LOCAL_CURRENCY } from "@/lib/config";
import { isSubscriptionActive } from "@/lib/boost";
import type { Prisma } from "@/generated/prisma/client";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  CONFIRMED: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  COMPLETED:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  CANCELLED: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
};

const STATUSES = ["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"] as const;

export default async function SellerOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const session = await verifySession();
  if (session.role !== "SELLER") {
    redirect("/orders");
  }

  const { status: rawStatus, q: rawQ } = await searchParams;
  const status = STATUSES.includes(rawStatus as (typeof STATUSES)[number])
    ? (rawStatus as (typeof STATUSES)[number])
    : "ALL";
  const q = (rawQ ?? "").trim();

  const where: Prisma.OrderWhereInput = {
    sellerId: session.userId,
    ...(status !== "ALL" ? { status } : {}),
    ...(q
      ? {
          OR: [
            { contactPhone: { contains: q } },
            { buyer: { name: { contains: q } } },
            { buyer: { email: { contains: q } } },
          ],
        }
      : {}),
  };

  const [orders, me] = await Promise.all([
    db.order.findMany({
      where,
      include: { buyer: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.user.findUniqueOrThrow({
      where: { id: session.userId },
      select: { subscriptionActive: true, subscriptionExpiresAt: true },
    }),
  ]);
  const canConfirm = isSubscriptionActive(me);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <MarkOrdersSeen action={markSellerOrdersSeen} />
      <h1 className="text-2xl font-semibold">Orders</h1>
      <p className="mt-1 text-sm text-zinc-500">
        All buy and sell requests placed with you.
      </p>

      {!canConfirm && (
        <div className="mt-4 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-900 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
          Your subscription is inactive, so you can&apos;t confirm new
          orders. You can still complete or cancel orders you already
          accepted.
        </div>
      )}

      <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">
            Status
          </label>
          <select
            name="status"
            defaultValue={status}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s === "ALL" ? "All statuses" : s}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <label className="mb-1 block text-xs font-medium text-zinc-500">
            Buyer name or phone number
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

      <div className="mt-6">
        {orders.length === 0 ? (
          <p className="text-sm text-zinc-500">
            No orders match this filter.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800"
              >
                <div>
                  <p className="text-sm font-medium">
                    {order.type === "BUY" ? "Buying" : "Selling"}{" "}
                    {order.amount.toLocaleString()} {order.currency} @{" "}
                    {order.rate.toFixed(4)} {LOCAL_CURRENCY}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {order.buyer.name} · {order.buyer.email} ·{" "}
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                  <p className="mt-1 text-sm">
                    Contact:{" "}
                    <a
                      href={`tel:${order.contactPhone}`}
                      className="font-medium underline"
                    >
                      {order.contactPhone}
                    </a>
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[order.status]}`}
                  >
                    {order.status}
                  </span>
                  <OrderStatusButtons
                    orderId={order.id}
                    status={order.status}
                    as="SELLER"
                    canConfirm={canConfirm}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
