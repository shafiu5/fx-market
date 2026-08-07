import Link from "next/link";
import { getCurrentUser } from "@/lib/dal";
import { getUnseenOrderCount, getUnseenRateChangeCount } from "@/lib/notifications";
import NavMenu from "@/components/NavMenu";
import NotificationBell from "@/components/NotificationBell";
import NotificationBellDropdown from "@/components/NotificationBellDropdown";

export default async function Nav() {
  const user = await getCurrentUser();
  const navUser = user ? { name: user.name, role: user.role } : null;

  return (
    <header className="relative border-b border-zinc-200 dark:border-zinc-800">
      <nav className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Exchange MV
        </Link>

        <div className="flex items-center gap-2">
          {user?.role === "SELLER" && (
            <SellerBell userId={user.id} />
          )}
          {user?.role === "BUYER" && (
            <NotificationBell
              href="/orders"
              count={await getUnseenOrderCount(user.id, "BUYER")}
            />
          )}
          <NavMenu user={navUser} />
        </div>
      </nav>
    </header>
  );
}

async function SellerBell({ userId }: { userId: string }) {
  const [orders, rateChanges] = await Promise.all([
    getUnseenOrderCount(userId, "SELLER"),
    getUnseenRateChangeCount(userId),
  ]);

  return (
    <NotificationBellDropdown
      items={[
        { label: "Orders", count: orders, href: "/seller/orders" },
        { label: "Competitor rate changes", count: rateChanges, href: "/seller/market" },
      ]}
    />
  );
}
