import { supabaseAdmin, UPLOADS_BUCKET } from "@/lib/supabase";

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

// Ad creatives are meant to be publicly visible (including to logged-out
// visitors), so this route serves them from the "ads/" prefix of the
// uploads bucket with no auth check — unlike /files, which is private.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  if (
    segments.length !== 2 ||
    segments[0] !== "ads" ||
    segments.some((s) => s === "." || s === "..")
  ) {
    return new Response("Not found", { status: 404 });
  }

  const relPath = segments.join("/");
  const { data, error } = await supabaseAdmin.storage.from(UPLOADS_BUCKET).download(relPath);
  if (error || !data) {
    return new Response("Not found", { status: 404 });
  }

  const ext = relPath.split(".").pop()?.toLowerCase() ?? "";
  const buffer = Buffer.from(await data.arrayBuffer());
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
