"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Server-rendered pages only get fresh data on navigation or after a server
// action revalidates them, so a tab left sitting open never sees background
// changes (e.g. another user's rate update, or a status change from the
// demo seller bots) until something forces a refetch. This polls that in.
export default function AutoRefresh({ intervalMs = 5000 }: { intervalMs?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => router.refresh(), intervalMs);
    return () => clearInterval(id);
  }, [router, intervalMs]);

  return null;
}
