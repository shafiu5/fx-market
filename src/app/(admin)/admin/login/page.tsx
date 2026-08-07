"use client";

import { useActionState } from "react";
import { adminLogin } from "@/app/actions/admin";

export default function AdminLoginPage() {
  const [state, action, pending] = useActionState(adminLogin, undefined);

  return (
    <main className="mx-auto flex min-h-[80vh] max-w-sm flex-col justify-center px-4">
      <h1 className="mb-6 text-2xl font-semibold">Admin</h1>

      <form action={action} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">
            Admin password
          </label>
          <input
            name="password"
            type="password"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>

        {state?.message && (
          <p className="text-sm text-red-600">{state.message}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </main>
  );
}
