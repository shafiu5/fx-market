"use client";

import { useActionState, useState } from "react";
import { becomeSeller } from "@/app/actions/role";
import CameraCapture from "@/components/CameraCapture";
import FileUploadBox from "@/components/FileUploadBox";

export default function BecomeSellerForm() {
  const [state, action, pending] = useActionState(becomeSeller, undefined);
  const [isBusiness, setIsBusiness] = useState(false);

  return (
    <form action={action} className="flex flex-col gap-4">
      <p className="text-xs text-zinc-500">
        Money changers need to verify their license before they can be marked
        as a verified seller. You can still post rates and take orders while
        your review is pending.
      </p>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Foreign exchange license
        </label>
        <FileUploadBox name="fxLicense" accept="image/*,application/pdf" />
        {state?.errors?.fxLicense && (
          <p className="mt-1 text-xs text-red-600">{state.errors.fxLicense[0]}</p>
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
          <p className="mt-1 text-xs text-red-600">{state.errors.idCard[0]}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Live camera photo</label>
        <CameraCapture name="livePhoto" error={state?.errors?.livePhoto?.[0]} />
      </div>

      {state?.message && <p className="text-sm text-red-600">{state.message}</p>}

      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
      >
        {pending ? "Switching…" : "Switch to seller account"}
      </button>
    </form>
  );
}
