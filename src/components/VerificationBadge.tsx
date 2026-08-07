const STYLES: Record<string, string> = {
  VERIFIED:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  REJECTED: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
};

const LABELS: Record<string, string> = {
  VERIFIED: "Verified",
  PENDING: "Unverified",
  REJECTED: "Rejected",
};

export default function VerificationBadge({ status }: { status: string }) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STYLES[status] ?? STYLES.PENDING}`}
    >
      {LABELS[status] ?? "Unverified"}
    </span>
  );
}
