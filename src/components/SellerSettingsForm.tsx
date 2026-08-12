"use client";

import { useActionState, useState } from "react";
import { updateVerificationDocuments } from "@/app/actions/seller-settings";
import CameraCapture from "@/components/CameraCapture";
import FileUploadBox from "@/components/FileUploadBox";

function CurrentFile({ path }: { path: string | null }) {
  if (!path) {
    return <p className="text-xs text-zinc-400 italic">Not uploaded yet</p>;
  }
  return (
    <a
      href={`/files/${path}`}
      target="_blank"
      rel="noreferrer"
      className="text-xs font-medium underline"
    >
      View current file
    </a>
  );
}

export default function SellerSettingsForm({
  isBusiness: initialIsBusiness,
  fxLicensePath,
  businessRegistrationPath,
  idCardPath,
  livePhotoPath,
}: {
  isBusiness: boolean;
  fxLicensePath: string | null;
  businessRegistrationPath: string | null;
  idCardPath: string | null;
  livePhotoPath: string | null;
}) {
  const [state, action, pending] = useActionState(
    updateVerificationDocuments,
    undefined
  );
  const [isBusiness, setIsBusiness] = useState(initialIsBusiness);

  return (
    <form action={action} className="flex flex-col gap-5">
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="block text-sm font-medium">
            Foreign exchange license
          </label>
          <CurrentFile path={fxLicensePath} />
        </div>
        <FileUploadBox name="fxLicense" accept="image/*,application/pdf" />
        <p className="mt-1 text-xs text-zinc-500">
          Leave empty to keep your current file.
        </p>
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
          <div className="mb-1 flex items-center justify-between">
            <label className="block text-sm font-medium">
              Business registration
            </label>
            <CurrentFile path={businessRegistrationPath} />
          </div>
          <FileUploadBox
            name="businessRegistration"
            accept="image/*,application/pdf"
          />
          {state?.errors?.businessRegistration && (
            <p className="mt-1 text-xs text-red-600">
              {state.errors.businessRegistration[0]}
            </p>
          )}
          <p className="mt-1 text-xs text-zinc-500">
            Leave empty to keep your current file.
          </p>
        </div>
      )}

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="block text-sm font-medium">
            ID card of the responsible person
          </label>
          <CurrentFile path={idCardPath} />
        </div>
        <FileUploadBox name="idCard" accept="image/*,application/pdf" />
        <p className="mt-1 text-xs text-zinc-500">
          Leave empty to keep your current file.
        </p>
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="block text-sm font-medium">
            Live camera photo
          </label>
          <CurrentFile path={livePhotoPath} />
        </div>
        <CameraCapture name="livePhoto" />
        <p className="mt-1 text-xs text-zinc-500">
          Leave the camera off to keep your current photo.
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
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
