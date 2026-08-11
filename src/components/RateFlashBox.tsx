"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LOCAL_CURRENCY } from "@/lib/config";

type Flash = "favorable" | "unfavorable" | null;

// Flashes green/red when `rate` changes between polls (from AutoRefresh),
// so live rate movement from sellers or the demo bots is visible without
// the buyer having to spot the number change themselves.
export default function RateFlashBox({
  href,
  label,
  rate,
  // "up" = a higher rate is better for the buyer (the "they buy at" box);
  // "down" = a lower rate is better for the buyer (the "they sell at" box).
  favorableDirection,
}: {
  href: string;
  label: string;
  rate: number;
  favorableDirection: "up" | "down";
}) {
  const prevRate = useRef(rate);
  const [flash, setFlash] = useState<Flash>(null);

  useEffect(() => {
    if (rate === prevRate.current) return;

    const rose = rate > prevRate.current;
    const favorable = favorableDirection === "up" ? rose : !rose;
    prevRate.current = rate;
    setFlash(favorable ? "favorable" : "unfavorable");

    const timer = setTimeout(() => setFlash(null), 1200);
    return () => clearTimeout(timer);
  }, [rate, favorableDirection]);

  return (
    <Link
      href={href}
      className={`rounded-md px-3 py-2 text-right transition-colors duration-700 ${
        flash === "favorable"
          ? "bg-emerald-200 ring-2 ring-emerald-500 dark:bg-emerald-500/30 dark:ring-emerald-400"
          : flash === "unfavorable"
            ? "bg-red-200 ring-2 ring-red-500 dark:bg-red-500/30 dark:ring-red-400"
            : "bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800"
      }`}
    >
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="font-medium">
        {rate.toFixed(4)} {LOCAL_CURRENCY}
      </p>
    </Link>
  );
}
