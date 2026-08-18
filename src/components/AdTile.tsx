"use client";

import { useEffect } from "react";

type Ad = { id: string; advertiserName: string; imagePath: string };

export default function AdTile({ ad }: { ad: Ad }) {
  useEffect(() => {
    const key = `ad-impression-${ad.id}`;
    // The homepage polls every 5s (AutoRefresh), so without this dedupe an
    // open tab would inflate impressions far past anything meaningful —
    // count once per browser session per ad instead of once per render.
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    fetch(`/api/ads/${ad.id}/impression`, { method: "POST", keepalive: true }).catch(() => {});
  }, [ad.id]);

  return (
    <a
      href={`/api/ads/${ad.id}/click`}
      target="_blank"
      rel="noreferrer sponsored"
      className="flex items-center gap-3 rounded-lg border border-amber-700/40 bg-amber-500/5 p-3 hover:bg-amber-500/10"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/ad-images/${ad.imagePath}`}
        alt={ad.advertiserName}
        className="h-12 w-20 shrink-0 rounded-md object-cover"
      />
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium tracking-wide text-amber-600 uppercase dark:text-amber-400">
          Sponsored
        </p>
        <p className="truncate font-medium">{ad.advertiserName}</p>
      </div>
      <span className="shrink-0 rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium dark:border-zinc-700">
        Visit →
      </span>
    </a>
  );
}
