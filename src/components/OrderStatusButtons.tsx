"use client";

import { updateOrderStatus } from "@/app/actions/orders";

const SELLER_ACTIONS: Record<string, { label: string; status: string }[]> = {
  PENDING: [
    { label: "Confirm", status: "CONFIRMED" },
    { label: "Cancel", status: "CANCELLED" },
  ],
  CONFIRMED: [
    { label: "Mark completed", status: "COMPLETED" },
    { label: "Cancel", status: "CANCELLED" },
  ],
};

const BUYER_ACTIONS: Record<string, { label: string; status: string }[]> = {
  PENDING: [{ label: "Cancel", status: "CANCELLED" }],
};

export default function OrderStatusButtons({
  orderId,
  status,
  as,
  canConfirm = true,
}: {
  orderId: string;
  status: string;
  as: "SELLER" | "BUYER";
  canConfirm?: boolean;
}) {
  const actions = (as === "SELLER" ? SELLER_ACTIONS : BUYER_ACTIONS)[status]?.filter(
    (a) => canConfirm || a.status !== "CONFIRMED"
  );
  if (!actions?.length) return null;

  return (
    <div className="flex gap-2">
      {actions.map((a) => (
        <form key={a.status} action={updateOrderStatus.bind(null, orderId, a.status)}>
          <button
            type="submit"
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium dark:border-zinc-700"
          >
            {a.label}
          </button>
        </form>
      ))}
    </div>
  );
}
