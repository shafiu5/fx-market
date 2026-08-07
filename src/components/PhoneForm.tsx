"use client";

import { useActionState } from "react";
import { updatePhone } from "@/app/actions/profile";

export default function PhoneForm({ phone }: { phone: string | null }) {
  const [state, action, pending] = useActionState(updatePhone, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      <div>
        <label className="mb-1 block text-sm font-medium">
          Contact number
        </label>
        <input
          name="phone"
          type="tel"
          defaultValue={phone ?? ""}
          placeholder="+960 771-2345"
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        {state?.errors?.phone && (
          <p className="mt-1 text-xs text-red-600">{state.errors.phone[0]}</p>
        )}
        <p className="mt-1 text-xs text-zinc-500">
          Used to auto-fill orders so sellers can reach you. You can still
          change it per order.
        </p>
      </div>

      {state?.message && (
        <p className="text-sm text-emerald-600">{state.message}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
      >
        {pending ? "Saving…" : "Save"}
      </button>
    </form>
  );
}
