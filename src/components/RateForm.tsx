"use client";

import { useActionState } from "react";
import { updateRate } from "@/app/actions/rates";
import { LOCAL_CURRENCY } from "@/lib/config";

export default function RateForm({
  currency,
  currencyName,
  buyRate,
  sellRate,
}: {
  currency: string;
  currencyName: string;
  buyRate: number;
  sellRate: number;
}) {
  const [state, action, pending] = useActionState(updateRate, undefined);

  return (
    <form
      action={action}
      className="border-b border-zinc-200 py-4 last:border-b-0 dark:border-zinc-800"
    >
      <input type="hidden" name="currency" value={currency} />

      <p className="text-sm font-semibold">{currency}</p>
      <p className="text-xs text-zinc-500">{currencyName}</p>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">
            I buy at ({LOCAL_CURRENCY})
          </label>
          <input
            name="buyRate"
            type="number"
            step="0.0001"
            min="0"
            defaultValue={buyRate || ""}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">
            I sell at ({LOCAL_CURRENCY})
          </label>
          <input
            name="sellRate"
            type="number"
            step="0.0001"
            min="0"
            defaultValue={sellRate || ""}
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
        >
          {pending ? "Saving…" : "Save"}
        </button>

        {(state?.errors?.buyRate || state?.errors?.sellRate) && (
          <p className="text-xs text-red-600">
            {state.errors.buyRate?.[0] ?? state.errors.sellRate?.[0]}
          </p>
        )}
        {state?.message && (
          <p
            className={`text-xs ${state.success ? "text-emerald-600" : "text-red-600"}`}
          >
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
