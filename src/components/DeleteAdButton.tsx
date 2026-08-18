"use client";

import { deleteAd } from "@/app/actions/ads";

export default function DeleteAdButton({ id }: { id: string }) {
  return (
    <form
      action={deleteAd.bind(null, id)}
      onSubmit={(e) => {
        if (!confirm("Delete this ad? This can't be undone.")) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        className="rounded-md border border-red-300 px-2.5 py-1 text-xs font-medium text-red-700 dark:border-red-800 dark:text-red-400"
      >
        Delete
      </button>
    </form>
  );
}
