"use client";

import { useActionState } from "react";
import { createOrder } from "@/app/actions/orders";
import { LOCAL_CURRENCY } from "@/lib/config";

export default function OrderForm({
  sellerId,
  currency,
  type,
  rate,
  defaultPhone,
}: {
  sellerId: string;
  currency: string;
  type: "BUY" | "SELL";
  rate: number;
  defaultPhone: string;
}) {
  const [state, action, pending] = useActionState(createOrder, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="sellerId" value={sellerId} />
      <input type="hidden" name="currency" value={currency} />
      <input type="hidden" name="type" value={type} />

      <div>
        <label className="mb-1 block text-sm font-medium">
          Amount ({currency})
        </label>
        <input
          name="amount"
          type="number"
          step="0.01"
          min="0"
          required
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        {state?.errors?.amount && (
          <p className="mt-1 text-xs text-red-600">{state.errors.amount[0]}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Contact number
        </label>
        <input
          name="contactPhone"
          type="tel"
          defaultValue={defaultPhone}
          placeholder="+960 771-2345"
          required
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        {state?.errors?.contactPhone && (
          <p className="mt-1 text-xs text-red-600">
            {state.errors.contactPhone[0]}
          </p>
        )}
        <p className="mt-1 text-xs text-zinc-500">
          The seller uses this to reach you about the order.
        </p>
      </div>

      <p className="text-sm text-zinc-500">
        Rate: {rate.toFixed(4)} {LOCAL_CURRENCY} per {currency}
      </p>

      {state?.message && (
        <p className="text-sm text-red-600">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
      >
        {pending
          ? "Placing order…"
          : `${type === "BUY" ? "Buy" : "Sell"} ${currency}`}
      </button>
    </form>
  );
}
