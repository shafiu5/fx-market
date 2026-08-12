"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { login } from "@/app/actions/auth";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);

  const emailFormatError =
    emailTouched && email.length > 0 && !EMAIL_PATTERN.test(email)
      ? "Enter a valid email address."
      : null;

  return (
    <main className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4">
      <h1 className="mb-6 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Log in
      </h1>

      <form action={action} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setEmailTouched(true)}
            className={`w-full rounded-md border px-3 py-2 text-sm dark:bg-zinc-900 ${
              emailFormatError || state?.errors?.email
                ? "border-red-400 dark:border-red-700"
                : "border-zinc-300 dark:border-zinc-700"
            }`}
            placeholder="you@example.com"
          />
          {(emailFormatError || state?.errors?.email) && (
            <p className="mt-1 text-xs text-red-600">
              {emailFormatError ?? state?.errors?.email?.[0]}
            </p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Password</label>
          <input
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full rounded-md border px-3 py-2 text-sm dark:bg-zinc-900 ${
              state?.errors?.password
                ? "border-red-400 dark:border-red-700"
                : "border-zinc-300 dark:border-zinc-700"
            }`}
          />
          {state?.errors?.password && (
            <p className="mt-1 text-xs text-red-600">
              {state.errors.password[0]}
            </p>
          )}
        </div>

        {state?.message && (
          <p className="text-sm text-red-600">{state.message}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
        >
          {pending ? "Logging in…" : "Log in"}
        </button>
      </form>

      <p className="mt-4 text-sm text-zinc-500">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium underline">
          Sign up
        </Link>
      </p>
    </main>
  );
}
