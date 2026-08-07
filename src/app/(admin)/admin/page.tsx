import { redirect } from "next/navigation";
import Link from "next/link";
import { isAdmin } from "@/lib/admin-session";
import { db } from "@/lib/db";
import AdminNav from "@/components/AdminNav";

function StatCard({
  label,
  value,
  href,
}: {
  label: string;
  value: number | string;
  href?: string;
}) {
  const content = (
    <div className="rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

export default async function AdminDashboardPage() {
  if (!(await isAdmin())) {
    redirect("/admin/login");
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [
    totalBuyers,
    totalSellers,
    pendingVerification,
    verifiedSellers,
    suspendedUsers,
    totalOrders,
    ordersToday,
    pendingOrders,
    totalRates,
    currencyGroups,
  ] = await Promise.all([
    db.user.count({ where: { role: "BUYER" } }),
    db.user.count({ where: { role: "SELLER" } }),
    db.user.count({ where: { role: "SELLER", verificationStatus: "PENDING" } }),
    db.user.count({ where: { role: "SELLER", verificationStatus: "VERIFIED" } }),
    db.user.count({ where: { suspended: true } }),
    db.order.count(),
    db.order.count({ where: { createdAt: { gte: startOfToday } } }),
    db.order.count({ where: { status: "PENDING" } }),
    db.sellerRate.count(),
    db.sellerRate.groupBy({ by: ["currency"] }),
  ]);

  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-zinc-500">Platform overview.</p>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard label="Buyers" value={totalBuyers} href="/admin/users?role=BUYER" />
          <StatCard label="Sellers" value={totalSellers} href="/admin/users?role=SELLER" />
          <StatCard
            label="Suspended accounts"
            value={suspendedUsers}
            href="/admin/users?status=suspended"
          />
          <StatCard
            label="Pending verification"
            value={pendingVerification}
            href="/admin/sellers"
          />
          <StatCard label="Verified sellers" value={verifiedSellers} href="/admin/sellers" />
          <StatCard label="Posted rates" value={totalRates} href="/admin/rates" />
          <StatCard label="Currencies covered" value={currencyGroups.length} href="/admin/rates" />
          <StatCard label="Orders total" value={totalOrders} />
          <StatCard label="Orders today" value={ordersToday} />
          <StatCard label="Orders pending" value={pendingOrders} />
        </div>
      </main>
    </>
  );
}
