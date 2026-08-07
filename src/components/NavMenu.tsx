"use client";

import { useState } from "react";
import Link from "next/link";
import { logout } from "@/app/actions/auth";

type NavUser = { name: string; role: "BUYER" | "SELLER" } | null;

const linkClass = "text-zinc-600 hover:underline dark:text-zinc-400";

function NavLinks({
  user,
  onNavigate,
}: {
  user: NavUser;
  onNavigate?: () => void;
}) {
  return (
    <>
      {!user && (
        <>
          <Link href="/login" className={linkClass} onClick={onNavigate}>
            Log in
          </Link>
          <Link
            href="/register"
            onClick={onNavigate}
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-center font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
          >
            Sign up
          </Link>
        </>
      )}

      {user?.role === "SELLER" && (
        <>
          <Link href="/seller" className={linkClass} onClick={onNavigate}>
            Dashboard
          </Link>
          <Link href="/seller/orders" className={linkClass} onClick={onNavigate}>
            Orders
          </Link>
          <Link href="/seller/market" className={linkClass} onClick={onNavigate}>
            Market
          </Link>
          <Link href="/seller/settings" className={linkClass} onClick={onNavigate}>
            Verification
          </Link>
        </>
      )}

      {user?.role === "BUYER" && (
        <Link href="/orders" className={linkClass} onClick={onNavigate}>
          My orders
        </Link>
      )}

      {user && (
        <Link href="/settings" className={linkClass} onClick={onNavigate}>
          Settings
        </Link>
      )}
    </>
  );
}

export default function NavMenu({ user }: { user: NavUser }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="hidden items-center gap-4 text-sm sm:flex">
        <NavLinks user={user} />
        {user && (
          <form action={logout} className="flex items-center gap-3">
            <span className="text-zinc-500">{user.name}</span>
            <button type="submit" className={linkClass}>
              Log out
            </button>
          </form>
        )}
      </div>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle menu"
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-md border border-zinc-300 text-zinc-600 sm:hidden dark:border-zinc-700 dark:text-zinc-400"
      >
        {open ? (
          <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2">
            <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
          </svg>
        ) : (
          <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" stroke="currentColor" strokeWidth="2">
            <path d="M3 5h14M3 10h14M3 15h14" strokeLinecap="round" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full z-10 flex flex-col gap-3 border-b border-zinc-200 bg-white px-4 py-4 text-sm shadow-lg sm:hidden dark:border-zinc-800 dark:bg-zinc-950">
          <NavLinks user={user} onNavigate={() => setOpen(false)} />
          {user && (
            <form
              action={logout}
              className="flex items-center justify-between border-t border-zinc-200 pt-3 dark:border-zinc-800"
            >
              <span className="text-zinc-500">{user.name}</span>
              <button type="submit" className={linkClass}>
                Log out
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
}
