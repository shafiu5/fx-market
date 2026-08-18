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
      className="relative block h-32 overflow-hidden rounded-lg border border-amber-700/40 bg-zinc-800"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/ad-images/${ad.imagePath}`}
        alt={ad.advertiserName}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent" />
      <span className="absolute top-2 left-2 rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] font-medium tracking-wide text-amber-950 uppercase">
        Sponsored
      </span>
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 p-3">
        <p className="truncate font-medium text-white">{ad.advertiserName}</p>
        <span className="shrink-0 rounded-md bg-white/90 px-3 py-1.5 text-xs font-medium text-zinc-900">
          Visit →
        </span>
      </div>
    </a>
  );
}
