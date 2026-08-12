import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-session";
import { db } from "@/lib/db";
import { LOCAL_CURRENCY } from "@/lib/config";
import AdminNav from "@/components/AdminNav";
import { approvePaymentRequest, rejectPaymentRequest } from "@/app/actions/billing";
import type { Prisma } from "@/generated/prisma/client";

const KINDS = ["ALL", "SUBSCRIPTION", "BOOST"] as const;
const STATUSES = ["PENDING", "APPROVED", "REJECTED", "ALL"] as const;

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  APPROVED:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; status?: string }>;
}) {
  if (!(await isAdmin())) {
    redirect("/admin/login");
  }

  const { kind: rawKind, status: rawStatus } = await searchParams;
  const kind = KINDS.includes(rawKind as (typeof KINDS)[number])
    ? (rawKind as (typeof KINDS)[number])
    : "ALL";
  const status = STATUSES.includes(rawStatus as (typeof STATUSES)[number])
    ? (rawStatus as (typeof STATUSES)[number])
    : "PENDING";

  const where: Prisma.PaymentRequestWhereInput = {
    ...(kind !== "ALL" ? { kind } : {}),
    ...(status !== "ALL" ? { status } : {}),
  };

  const requests = await db.paymentRequest.findMany({
    where,
    include: { seller: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-4xl px-4 py-10">
        <h1 className="text-2xl font-semibold">Payments</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Verify uploaded payment slips and approve or reject subscription and
          boost requests.
        </p>

        <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Type</label>
            <select
              name="kind"
              defaultValue={kind}
              className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            >
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {k === "ALL" ? "All types" : k}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-500">Status</label>
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
          <button
            type="submit"
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
          >
            Filter
          </button>
        </form>

        <div className="mt-6 flex flex-col gap-3">
          {requests.length === 0 ? (
            <p className="text-sm text-zinc-500">No requests match this filter.</p>
          ) : (
            requests.map((req) => (
              <div
                key={req.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium">{req.seller.name}</p>
                    <span className="rounded-full border border-zinc-300 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-400">
                      {req.kind}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[req.status]}`}
                    >
                      {req.status}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500">{req.seller.email}</p>
                  <p className="mt-1 text-sm">
                    {req.tierName} · {req.days} days ·{" "}
                    {req.amount.toLocaleString()} {LOCAL_CURRENCY}
                  </p>
                  <p className="text-xs text-zinc-500">
                    Requested {new Date(req.createdAt).toLocaleString()}
                  </p>
                  {req.slipPath ? (
                    <a
                      href={`/files/${req.slipPath}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-block text-xs font-medium underline"
                    >
                      View payment slip
                    </a>
                  ) : (
                    <p className="mt-1 text-xs text-zinc-400 italic">
                      No slip — free plan, auto-approved
                    </p>
                  )}
                </div>

                {req.status === "PENDING" && (
                  <div className="flex gap-2">
                    <form action={approvePaymentRequest.bind(null, req.id)}>
                      <button
                        type="submit"
                        className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
                      >
                        Approve
                      </button>
                    </form>
                    <form action={rejectPaymentRequest.bind(null, req.id)}>
                      <button
                        type="submit"
                        className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 dark:border-red-800 dark:text-red-400"
                      >
                        Reject
                      </button>
                    </form>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </main>
    </>
  );
}
