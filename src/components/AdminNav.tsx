import Link from "next/link";
import { db } from "@/lib/db";
import { adminLogout } from "@/app/actions/admin";

export default async function AdminNav() {
  const pendingPayments = await db.paymentRequest.count({ where: { status: "PENDING" } });

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <nav className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <Link href="/admin" className="font-semibold text-zinc-900 dark:text-zinc-50">
            Admin
          </Link>
          <Link href="/admin" className="text-zinc-600 hover:underline dark:text-zinc-400">
            Dashboard
          </Link>
          <Link
            href="/admin/sellers"
            className="text-zinc-600 hover:underline dark:text-zinc-400"
          >
            Sellers
          </Link>
          <Link
            href="/admin/users"
            className="text-zinc-600 hover:underline dark:text-zinc-400"
          >
            Users
          </Link>
          <Link
            href="/admin/rates"
            className="text-zinc-600 hover:underline dark:text-zinc-400"
          >
            Rates
          </Link>
          <Link
            href="/admin/billing"
            className="text-zinc-600 hover:underline dark:text-zinc-400"
          >
            Billing
          </Link>
          <Link
            href="/admin/payments"
            className="flex items-center gap-1.5 text-zinc-600 hover:underline dark:text-zinc-400"
          >
            Payments
            {pendingPayments > 0 && (
              <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-medium leading-none text-white">
                {pendingPayments > 9 ? "9+" : pendingPayments}
              </span>
            )}
          </Link>
        </div>

        <form action={adminLogout}>
          <button type="submit" className="text-sm text-zinc-500 hover:underline">
            Log out
          </button>
        </form>
      </nav>
    </header>
  );
}
