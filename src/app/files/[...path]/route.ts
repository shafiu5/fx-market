import { isAdmin } from "@/lib/admin-session";
import { getOptionalSession } from "@/lib/dal";
import { supabaseAdmin, UPLOADS_BUCKET } from "@/lib/supabase";

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  pdf: "application/pdf",
};

// Verification documents live in the private uploads bucket under
// <userId>/<field>.<ext>. Only an admin, or the seller who owns that
// folder, may read them back.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params;
  if (segments.length === 0 || segments.some((s) => s === "." || s === "..")) {
    return new Response("Not found", { status: 404 });
  }

  const relPath = segments.join("/");
  const ownerId = segments[0];

  const [admin, session] = await Promise.all([isAdmin(), getOptionalSession()]);
  const isOwner = !!session && session.userId === ownerId;

  if (!admin && !isOwner) {
    return new Response("Not found", { status: 404 });
  }

  const { data, error } = await supabaseAdmin.storage.from(UPLOADS_BUCKET).download(relPath);
  if (error || !data) {
    return new Response("Not found", { status: 404 });
  }

  const ext = relPath.split(".").pop()?.toLowerCase() ?? "";
  const buffer = Buffer.from(await data.arrayBuffer());
  return new Response(new Uint8Array(buffer), {
    headers: {
      "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream",
      "Cache-Control": "private, no-store",
    },
  });
}
