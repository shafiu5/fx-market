"use client";

import { useActionState, useEffect, useState } from "react";
import { LOCAL_CURRENCY } from "@/lib/config";
import type { PaymentRequestFormState } from "@/app/actions/payments";

type Tier = { id: string; name: string; days: number; price: number };
type Bank = {
  bankName: string;
  accountName: string;
  accountNumber: string;
  branch: string;
  instructions: string;
};

export default function PaymentRequestDialog({
  buttonLabel,
  title,
  tiers,
  bank,
  action,
  hasPendingRequest,
}: {
  buttonLabel: string;
  title: string;
  tiers: Tier[];
  bank: Bank;
  action: (
    state: PaymentRequestFormState,
    formData: FormData
  ) => Promise<PaymentRequestFormState>;
  hasPendingRequest: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(action, undefined);
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
  const selectedTier = tiers.find((t) => t.id === selectedTierId);
  const isFree = selectedTier?.price === 0;

  useEffect(() => {
    if (hasPendingRequest) setOpen(false);
  }, [hasPendingRequest]);

  useEffect(() => {
    if (state?.activated) setOpen(false);
  }, [state?.activated]);

  if (hasPendingRequest) {
    return (
      <span className="rounded-full bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
        Request pending review
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
      >
        {buttonLabel}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-5 dark:bg-zinc-900">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{title}</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
              >
                ✕
              </button>
            </div>

            {tiers.length === 0 ? (
              <p className="mt-4 text-sm text-zinc-500">
                No plans are available right now. Contact the admin.
              </p>
            ) : (
              <form action={formAction} className="mt-4 flex flex-col gap-4">
                <fieldset>
                  <legend className="mb-1 text-sm font-medium">Choose a plan</legend>
                  <div className="flex flex-col gap-2">
                    {tiers.map((t) => (
                      <label
                        key={t.id}
                        className="flex items-center justify-between gap-2 rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700"
                      >
                        <span className="flex items-center gap-2">
                          <input
                            type="radio"
                            name="tierId"
                            value={t.id}
                            required
                            checked={selectedTierId === t.id}
                            onChange={() => setSelectedTierId(t.id)}
                          />
                          {t.name} · {t.days} days
                        </span>
                        <span className="font-medium">
                          {t.price === 0
                            ? "Free"
                            : `${t.price.toLocaleString()} ${LOCAL_CURRENCY}`}
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>

                {isFree ? (
                  <p className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">
                    This plan is free — no payment or slip needed. It activates
                    as soon as you submit.
                  </p>
                ) : (
                  <>
                    <div className="rounded-md border border-zinc-200 p-3 text-sm dark:border-zinc-800">
                      <p className="mb-1 font-medium">Bank transfer details</p>
                      <p>Bank: {bank.bankName || "—"}</p>
                      <p>Account name: {bank.accountName || "—"}</p>
                      <p>Account number: {bank.accountNumber || "—"}</p>
                      {bank.branch && <p>Branch: {bank.branch}</p>}
                      {bank.instructions && (
                        <p className="mt-1 text-zinc-500">{bank.instructions}</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-medium">
                        Upload payment slip
                      </label>
                      <input
                        type="file"
                        name="slip"
                        accept="image/*,application/pdf"
                        required
                        className="w-full text-sm"
                      />
                    </div>
                  </>
                )}

                {state?.error && (
                  <p className="text-xs text-red-600">{state.error}</p>
                )}

                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
                >
                  {pending ? "Submitting…" : isFree ? "Activate free plan" : "Submit request"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
