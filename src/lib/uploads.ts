import "server-only";
import { supabaseAdmin, UPLOADS_BUCKET } from "@/lib/supabase";

function extFromMime(mime: string): string {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "application/pdf") return "pdf";
  return "jpg";
}

function extFromFilename(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase();
  return ext || "bin";
}

// Returns a path relative to the uploads bucket, stored in the DB. The
// bucket is private, so files are never served without the admin-or-owner
// check in the file route.
export async function saveUploadedFile(
  userId: string,
  field: string,
  file: File
): Promise<string> {
  const ext = file.type ? extFromMime(file.type) : extFromFilename(file.name);
  const relPath = `${userId}/${field}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabaseAdmin.storage.from(UPLOADS_BUCKET).upload(relPath, buffer, {
    contentType: file.type || undefined,
    upsert: true,
  });
  if (error) throw error;

  return relPath;
}

// Ad creatives are served publicly (no admin-or-owner check), so they live
// under a dedicated "ads/" prefix in the same bucket, served by the
// unauthenticated /ad-images route instead of the private /files route.
export async function saveAdImage(adId: string, file: File): Promise<string> {
  const ext = file.type ? extFromMime(file.type) : extFromFilename(file.name);
  const relPath = `ads/${adId}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error } = await supabaseAdmin.storage.from(UPLOADS_BUCKET).upload(relPath, buffer, {
    contentType: file.type || undefined,
    upsert: true,
  });
  if (error) throw error;

  return relPath;
}

export async function saveDataUrl(
  userId: string,
  field: string,
  dataUrl: string
): Promise<string> {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) throw new Error("Invalid image data.");
  const [, mime, base64] = match;

  const ext = extFromMime(mime);
  const relPath = `${userId}/${field}.${ext}`;

  const { error } = await supabaseAdmin.storage
    .from(UPLOADS_BUCKET)
    .upload(relPath, Buffer.from(base64, "base64"), {
      contentType: mime,
      upsert: true,
    });
  if (error) throw error;

  return relPath;
}
