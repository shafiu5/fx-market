"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// Debounced so it doesn't push a new URL on every keystroke — types like a
// normal input, then updates the (server-filtered) list shortly after.
export default function SellerSearch({
  currency,
  sort,
  range,
  q,
}: {
  currency: string;
  sort: string;
  range: string;
  q: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(q);

  useEffect(() => {
    const params = new URLSearchParams({ currency, sort, range });
    if (value.trim()) params.set("q", value.trim());

    const timer = setTimeout(() => {
      router.push(`/?${params.toString()}`);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <input
      type="search"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      placeholder="Search seller…"
      className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900 sm:w-56"
    />
  );
}
