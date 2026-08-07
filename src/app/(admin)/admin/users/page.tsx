import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-session";
import { db } from "@/lib/db";
import AdminNav from "@/components/AdminNav";
import { setUserSuspended } from "@/app/actions/admin";
import VerificationBadge from "@/components/VerificationBadge";
import type { Prisma } from "@/generated/prisma/client";

const ROLES = ["ALL", "BUYER", "SELLER"] as const;
const STATUSES = ["ALL", "ACTIVE", "SUSPENDED"] as const;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; status?: string; q?: string }>;
}) {
  if (!(await isAdmin())) {
    redirect("/admin/login");
  }

  const { role: rawRole, status: rawStatus, q: rawQ } = await searchParams;
  const role = ROLES.includes(rawRole as (typeof ROLES)[number])
    ? (rawRole as (typeof ROLES)[number])
    : "ALL";
  const status = STATUSES.includes(rawStatus as (typeof STATUSES)[number])
    ? (rawStatus as (typeof STATUSES)[number])
    : "ALL";
  const q = (rawQ ?? "").trim();

  const where: Prisma.UserWhereInput = {
    ...(role !== "ALL" ? { role } : {}),
    ...(status === "SUSPENDED" ? { suspended: true } : {}),
    ...(status === "ACTIVE" ? { suspended: false } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q } },
            { email: { contains: q } },
            { phone: { contains: q } },
          ],
        }
      : {}),
  };

  const users = await db.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-5xl px-4 py-10">
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="mt-1 text-sm text-zinc-500">
          All buyer and seller accounts.
        </p>

        <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">
              Role
            </label>
            <select
              name="role"
              defaultValue={role}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r === "ALL" ? "All roles" : r}
                </option>
              ))}
            </select>
          </div>

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
              Name, email, or phone
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

        <p className="mt-4 text-xs text-zinc-500">{users.length} result(s)</p>

        <div className="mt-3 flex flex-col gap-3">
          {users.map((user) => (
            <div
              key={user.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{user.name}</p>
                  <span className="rounded-full border border-zinc-300 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
                    {user.role}
                  </span>
                  {user.role === "SELLER" && (
                    <VerificationBadge status={user.verificationStatus} />
                  )}
                  {user.suspended && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-800 dark:bg-red-900/40 dark:text-red-300">
                      Suspended
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {user.email}
                  {user.phone ? ` · ${user.phone}` : ""} · joined{" "}
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
              </div>

              <form action={setUserSuspended.bind(null, user.id, !user.suspended)}>
                <button
                  type="submit"
                  className={
                    user.suspended
                      ? "rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
                      : "rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 dark:border-red-800 dark:text-red-400"
                  }
                >
                  {user.suspended ? "Reactivate" : "Suspend"}
                </button>
              </form>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
