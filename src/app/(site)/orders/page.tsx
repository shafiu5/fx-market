import { db } from "@/lib/db";
import { verifySession } from "@/lib/dal";
import { markBuyerOrdersSeen } from "@/app/actions/notifications";
import AutoRefresh from "@/components/AutoRefresh";
import OrderStatusButtons from "@/components/OrderStatusButtons";
import MarkOrdersSeen from "@/components/MarkOrdersSeen";
import { LOCAL_CURRENCY } from "@/lib/config";

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  CONFIRMED: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  COMPLETED:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  CANCELLED: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
};

export default async function OrdersPage() {
  const session = await verifySession();

  const orders = await db.order.findMany({
    where: { buyerId: session.userId },
    include: { seller: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <MarkOrdersSeen action={markBuyerOrdersSeen} />
      <AutoRefresh />
      <h1 className="text-2xl font-semibold">My orders</h1>

      {orders.length === 0 ? (
        <p className="mt-6 text-sm text-zinc-500">
          You haven&apos;t placed any orders yet.
        </p>
      ) : (
        <div className="mt-6 flex flex-col gap-3">
          {orders.map((order) => (
            <div
              key={order.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 px-4 py-3 dark:border-zinc-800"
            >
              <div>
                <p className="text-sm font-medium">
                  {order.type === "BUY" ? "Buying" : "Selling"}{" "}
                  {order.amount.toLocaleString()} {order.currency} @{" "}
                  {order.rate.toFixed(2)} {LOCAL_CURRENCY}
                </p>
                <p className="text-xs text-zinc-500">
                  Seller: {order.seller.name} · {order.seller.email} ·{" "}
                  {new Date(order.createdAt).toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-zinc-500">
                  Contact number given: {order.contactPhone}
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
                  as="BUYER"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
