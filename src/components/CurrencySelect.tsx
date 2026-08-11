"use client";

import { useRouter } from "next/navigation";
import { CURRENCIES } from "@/lib/config";

export default function CurrencySelect({
  currency,
  sort,
}: {
  currency: string;
  sort: string;
}) {
  const router = useRouter();

  return (
    <select
      value={currency}
      onChange={(e) => router.push(`/?currency=${e.target.value}&sort=${sort}`)}
      className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium dark:border-zinc-700 dark:bg-zinc-900"
    >
      {CURRENCIES.map((c) => (
        <option key={c.code} value={c.code}>
          {c.code} — {c.name}
        </option>
      ))}
    </select>
  );
}
