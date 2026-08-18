"use client";

import { useId, useState } from "react";

export default function AdImagePicker({
  advertiserName,
  required,
  defaultImageUrl,
  defaultFocalX = 50,
  defaultFocalY = 50,
}: {
  advertiserName: string;
  required?: boolean;
  defaultImageUrl?: string;
  defaultFocalX?: number;
  defaultFocalY?: number;
}) {
  const inputId = useId();
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(defaultImageUrl);
  const [focal, setFocal] = useState({ x: defaultFocalX, y: defaultFocalY });

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewUrl(URL.createObjectURL(file));
    setFocal({ x: 50, y: 50 });
  }

  function handlePick(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setFocal({
      x: Math.min(100, Math.max(0, x)),
      y: Math.min(100, Math.max(0, y)),
    });
  }

  return (
    <div>
      <label htmlFor={inputId} className="mb-1 block text-xs font-medium text-zinc-500">
        Creative image
      </label>
      <input
        id={inputId}
        name="image"
        type="file"
        accept="image/*"
        required={required && !previewUrl}
        onChange={handleFileChange}
        className="block w-full text-sm"
      />

      {previewUrl && (
        <>
          <input type="hidden" name="focalX" value={focal.x} />
          <input type="hidden" name="focalY" value={focal.y} />
          <p className="mt-3 text-xs text-zinc-500">
            Click the photo to choose what stays in frame — this is exactly
            how the tile will look on the rate board.
          </p>
          <div
            onClick={handlePick}
            className="relative mt-1 h-32 w-full cursor-crosshair overflow-hidden rounded-lg border border-zinc-300 dark:border-zinc-700"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              style={{ objectPosition: `${focal.x}% ${focal.y}%` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-transparent" />
            <span className="absolute top-2 left-2 rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] font-medium tracking-wide text-amber-950 uppercase">
              Sponsored
            </span>
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 p-3">
              <p className="truncate font-medium text-white">
                {advertiserName || "Advertiser name"}
              </p>
              <span className="shrink-0 rounded-md bg-white/90 px-3 py-1.5 text-xs font-medium text-zinc-900">
                Visit →
              </span>
            </div>
            <div
              className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
              style={{ left: `${focal.x}%`, top: `${focal.y}%` }}
            />
          </div>
        </>
      )}
    </div>
  );
}
