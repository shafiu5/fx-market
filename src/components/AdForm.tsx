"use client";

import { useState } from "react";
import AdImagePicker from "@/components/AdImagePicker";
import SubmitButton from "@/components/SubmitButton";

export default function AdForm({
  action,
  mode,
  id,
  defaultAdvertiserName = "",
  defaultLinkUrl = "",
  defaultWeight = 1,
  defaultImageUrl,
  defaultFocalX,
  defaultFocalY,
  defaultExpiresAt,
}: {
  action: (formData: FormData) => Promise<void>;
  mode: "create" | "edit";
  id?: string;
  defaultAdvertiserName?: string;
  defaultLinkUrl?: string;
  defaultWeight?: number;
  defaultImageUrl?: string;
  defaultFocalX?: number;
  defaultFocalY?: number;
  defaultExpiresAt?: string;
}) {
  const [advertiserName, setAdvertiserName] = useState(defaultAdvertiserName);

  return (
    <form action={action} className="flex flex-col gap-3">
      {id && <input type="hidden" name="id" value={id} />}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">
            Advertiser name
          </label>
          <input
            name="advertiserName"
            type="text"
            value={advertiserName}
            onChange={(e) => setAdvertiserName(e.target.value)}
            required
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-zinc-500">
            Weight
          </label>
          <input
            name="weight"
            type="number"
            min="1"
            defaultValue={defaultWeight}
            required
            className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-500">
          Link URL
        </label>
        <input
          name="linkUrl"
          type="url"
          defaultValue={defaultLinkUrl}
          required
          placeholder="https://example.com"
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-zinc-500">
          Runs until (optional)
        </label>
        <input
          name="expiresAt"
          type="date"
          defaultValue={defaultExpiresAt}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <p className="mt-1 text-xs text-zinc-500">
          Leave empty to run indefinitely.
        </p>
      </div>

      <AdImagePicker
        advertiserName={advertiserName}
        required={mode === "create"}
        defaultImageUrl={defaultImageUrl}
        defaultFocalX={defaultFocalX}
        defaultFocalY={defaultFocalY}
      />

      <SubmitButton pendingText={mode === "create" ? "Adding…" : "Saving…"}>
        {mode === "create" ? "Add ad" : "Save"}
      </SubmitButton>
    </form>
  );
}
