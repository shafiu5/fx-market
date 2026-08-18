import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Routing the click through here (instead of linking straight to the
// advertiser) means the count only goes up on a real click, works without
// JS, and can't be spoofed by the impression ping.
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const ad = await db.advertisement.findUnique({ where: { id } });
  if (!ad || !ad.active) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  await db.advertisement.update({
    where: { id },
    data: { clicks: { increment: 1 } },
  });

  return NextResponse.redirect(ad.linkUrl);
}
