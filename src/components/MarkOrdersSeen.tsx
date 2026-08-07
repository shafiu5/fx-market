"use client";

import { useEffect } from "react";

export default function MarkOrdersSeen({
  action,
}: {
  action: () => Promise<void>;
}) {
  useEffect(() => {
    action();
    // Only ever needs to fire once, when the page is actually visited.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
