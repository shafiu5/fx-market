"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";

// Server-rendered pages only get fresh data on navigation or after a server
// action revalidates them, so a tab left sitting open never sees background
// changes (e.g. another user's rate update, or a status change from the
// demo seller bots) until something forces a refetch. This polls that in.
//
// The refresh is wrapped in startTransition so it doesn't trigger the
// nearest loading.tsx fallback — that's reserved for real navigation, not
// these silent background polls.
export default function AutoRefresh({ intervalMs = 5000 }: { intervalMs?: number }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  useEffect(() => {
    const id = setInterval(() => {
      startTransition(() => router.refresh());
    }, intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);

  return null;
}
