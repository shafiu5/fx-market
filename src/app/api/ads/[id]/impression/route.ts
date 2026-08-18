import { db } from "@/lib/db";

// Fired once per browser session (deduped client-side in AdTile) rather
// than on every render, since the homepage polls every 5s and would
// otherwise inflate the count far past anything meaningful to advertisers.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await db.advertisement
    .update({ where: { id }, data: { impressions: { increment: 1 } } })
    .catch(() => {});

  return new Response(null, { status: 204 });
}
