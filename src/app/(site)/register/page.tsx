"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { register } from "@/app/actions/auth";
import CameraCapture from "@/components/CameraCapture";
import FileUploadBox from "@/components/FileUploadBox";

export default function RegisterPage() {
  const [state, action, pending] = useActionState(register, undefined);
  const [role, setRole] = useState<"BUYER" | "SELLER">("BUYER");
  const [isBusiness, setIsBusiness] = useState(false);

  return (
    <main className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-4 py-10">
      <h1 className="mb-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Create an account
      </h1>
      <p className="mb-6 text-sm text-zinc-500">
        Buyers browse rates and place orders. Sellers post rates and manage
        incoming orders.
      </p>

      <form action={action} className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Name</label>
          <input
            name="name"
            type="text"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            placeholder="Jane Doe"
          />
          {state?.errors?.name && (
            <p className="mt-1 text-xs text-red-600">{state.errors.name[0]}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input
            name="email"
            type="email"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            placeholder="you@example.com"
          />
          {state?.errors?.email && (
            <p className="mt-1 text-xs text-red-600">{state.errors.email[0]}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Password</label>
          <input
            name="password"
            type="password"
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            placeholder="At least 8 characters"
          />
          {state?.errors?.password && (
            <p className="mt-1 text-xs text-red-600">
              {state.errors.password[0]}
            </p>
          )}
        </div>

        <fieldset>
          <legend className="mb-1 block text-sm font-medium">
            Account type
          </legend>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="role"
                value="BUYER"
                checked={role === "BUYER"}
                onChange={() => setRole("BUYER")}
              />
              Buyer
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="role"
                value="SELLER"
                checked={role === "SELLER"}
                onChange={() => setRole("SELLER")}
              />
              Seller
            </label>
          </div>
          {state?.errors?.role && (
            <p className="mt-1 text-xs text-red-600">{state.errors.role[0]}</p>
          )}
        </fieldset>

        {role === "SELLER" && (
          <div className="flex flex-col gap-4 rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
            <p className="text-sm font-medium">Seller verification</p>
            <p className="-mt-2 text-xs text-zinc-500">
              Money changers need to verify their license before they can be
              marked as a verified seller.
            </p>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Foreign exchange license
              </label>
              <FileUploadBox name="fxLicense" accept="image/*,application/pdf" />
              {state?.errors?.fxLicense && (
                <p className="mt-1 text-xs text-red-600">
                  {state.errors.fxLicense[0]}
                </p>
              )}
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="isBusiness"
                checked={isBusiness}
                onChange={(e) => setIsBusiness(e.target.checked)}
              />
              Registered as a business
            </label>

            {isBusiness && (
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Business registration
                </label>
                <FileUploadBox
                  name="businessRegistration"
                  accept="image/*,application/pdf"
                />
                {state?.errors?.businessRegistration && (
                  <p className="mt-1 text-xs text-red-600">
                    {state.errors.businessRegistration[0]}
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="mb-1 block text-sm font-medium">
                ID card of the responsible person
              </label>
              <FileUploadBox name="idCard" accept="image/*,application/pdf" />
              {state?.errors?.idCard && (
                <p className="mt-1 text-xs text-red-600">
                  {state.errors.idCard[0]}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Live camera photo
              </label>
              <CameraCapture name="livePhoto" error={state?.errors?.livePhoto?.[0]} />
            </div>
          </div>
        )}

        {state?.message && (
          <p className="text-sm text-red-600">{state.message}</p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="mt-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
        >
          {pending ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="mt-4 text-sm text-zinc-500">
        Already have an account?{" "}
        <Link href="/login" className="font-medium underline">
          Log in
        </Link>
      </p>
    </main>
  );
}
