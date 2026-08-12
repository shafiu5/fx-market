"use client";

import { useActionState } from "react";
import { becomeBuyer } from "@/app/actions/role";

export default function BecomeBuyerButton() {
  const [state, action, pending] = useActionState(becomeBuyer, undefined);

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (
          !confirm(
            "Switching to a buyer account removes your posted rates from the market. Continue?"
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 disabled:opacity-50 dark:border-red-800 dark:text-red-400"
      >
        {pending ? "Switching…" : "Switch to buyer account"}
      </button>
      {state?.message && (
        <p className="mt-2 text-xs text-red-600">{state.message}</p>
      )}
    </form>
  );
}
