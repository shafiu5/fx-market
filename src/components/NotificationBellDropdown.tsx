"use client";

import { useState } from "react";
import Link from "next/link";

const BellIcon = () => (
  <svg
    viewBox="0 0 20 20"
    fill="none"
    className="h-5 w-5"
    stroke="currentColor"
    strokeWidth="1.6"
  >
    <path
      d="M5 8a5 5 0 0 1 10 0c0 3.5 1.2 4.8 1.2 4.8H3.8S5 11.5 5 8Z"
      strokeLinejoin="round"
    />
    <path d="M8.2 15.5a1.8 1.8 0 0 0 3.6 0" strokeLinecap="round" />
  </svg>
);

export default function NotificationBellDropdown({
  items,
}: {
  items: { label: string; count: number; href: string }[];
}) {
  const [open, setOpen] = useState(false);
  const total = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={total > 0 ? `${total} unseen updates` : "Notifications"}
        aria-expanded={open}
        className="relative flex h-9 w-9 items-center justify-center rounded-md text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
      >
        <BellIcon />
        {total > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-medium leading-none text-white">
            {total > 9 ? "9+" : total}
          </span>
        )}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close notifications"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10 cursor-default"
          />
          <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-md border border-zinc-200 bg-white py-1 text-sm shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between px-3 py-2 text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900"
              >
                <span>{item.label}</span>
                {item.count > 0 && (
                  <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-medium leading-none text-white">
                    {item.count > 9 ? "9+" : item.count}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
