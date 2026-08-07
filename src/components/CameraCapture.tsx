"use client";

import { useEffect, useRef, useState } from "react";

export default function CameraCapture({
  name,
  error,
}: {
  name: string;
  error?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<"idle" | "live" | "captured" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [dataUrl, setDataUrl] = useState("");

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function enableCamera() {
    setErrorMessage("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStatus("live");
    } catch {
      setStatus("error");
      setErrorMessage(
        "Couldn't access the camera. Check permissions and try again."
      );
    }
  }

  function capture() {
    const video = videoRef.current;
    if (!video) return;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    setDataUrl(canvas.toDataURL("image/jpeg", 0.9));
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStatus("captured");
  }

  function retake() {
    setDataUrl("");
    setStatus("idle");
  }

  return (
    <div>
      <input type="hidden" name={name} value={dataUrl} />

      <div className="overflow-hidden rounded-md border border-zinc-300 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900">
        {status === "captured" && dataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={dataUrl} alt="Captured live photo" className="w-full" />
        ) : (
          <video
            ref={videoRef}
            muted
            playsInline
            className={`w-full ${status === "live" ? "block" : "hidden"}`}
          />
        )}

        {status === "idle" && (
          <div className="flex h-40 items-center justify-center text-sm text-zinc-500">
            Camera not started
          </div>
        )}
        {status === "error" && (
          <div className="flex h-40 items-center justify-center px-4 text-center text-sm text-red-600">
            {errorMessage}
          </div>
        )}
      </div>

      <div className="mt-2 flex gap-2">
        {status !== "live" && status !== "captured" && (
          <button
            type="button"
            onClick={enableCamera}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium dark:border-zinc-700"
          >
            Enable camera
          </button>
        )}
        {status === "live" && (
          <button
            type="button"
            onClick={capture}
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
          >
            Capture photo
          </button>
        )}
        {status === "captured" && (
          <button
            type="button"
            onClick={retake}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium dark:border-zinc-700"
          >
            Retake
          </button>
        )}
      </div>

      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
