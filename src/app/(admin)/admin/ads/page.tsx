import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/admin-session";
import { db } from "@/lib/db";
import AdminNav from "@/components/AdminNav";
import AdForm from "@/components/AdForm";
import DeleteAdButton from "@/components/DeleteAdButton";
import { createAd, updateAd, setAdActive } from "@/app/actions/ads";

function ctr(clicks: number, impressions: number): string {
  if (impressions === 0) return "—";
  return `${((clicks / impressions) * 100).toFixed(1)}%`;
}

export default async function AdminAdsPage() {
  if (!(await isAdmin())) {
    redirect("/admin/login");
  }

  const ads = await db.advertisement.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <>
      <AdminNav />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="text-2xl font-semibold">Ads</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Sponsored tiles shown in the rate board. Active ads rotate by
          weight, and impressions/clicks are tracked per ad.
        </p>

        <section className="mt-6 rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
          <h2 className="text-sm font-medium text-zinc-500">New ad</h2>
          <div className="mt-3">
            <AdForm action={createAd} mode="create" />
          </div>
        </section>

        <section className="mt-6 flex flex-col gap-4">
          {ads.length === 0 && (
            <p className="text-sm text-zinc-500">No ads yet.</p>
          )}

          {ads.map((ad) => (
            <div
              key={ad.id}
              className="rounded-lg border border-zinc-200 p-5 dark:border-zinc-800"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {ad.imagePath && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={`/ad-images/${ad.imagePath}`}
                      alt={ad.advertiserName}
                      style={{ objectPosition: `${ad.focalX}% ${ad.focalY}%` }}
                      className="h-12 w-20 rounded-md object-cover"
                    />
                  )}
                  <div>
                    <p className="font-medium">{ad.advertiserName}</p>
                    <a
                      href={ad.linkUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs text-zinc-500 underline"
                    >
                      {ad.linkUrl}
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      ad.active
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300"
                        : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}
                  >
                    {ad.active ? "Active" : "Disabled"}
                  </span>
                  <form action={setAdActive.bind(null, ad.id, !ad.active)}>
                    <button
                      type="submit"
                      className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-medium dark:border-zinc-700"
                    >
                      {ad.active ? "Disable" : "Enable"}
                    </button>
                  </form>
                  <DeleteAdButton id={ad.id} />
                </div>
              </div>

              <div className="mt-3 flex gap-4 text-xs text-zinc-500">
                <span>{ad.impressions.toLocaleString()} impressions</span>
                <span>{ad.clicks.toLocaleString()} clicks</span>
                <span>CTR {ctr(ad.clicks, ad.impressions)}</span>
              </div>

              <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
                <AdForm
                  action={updateAd}
                  mode="edit"
                  id={ad.id}
                  defaultAdvertiserName={ad.advertiserName}
                  defaultLinkUrl={ad.linkUrl}
                  defaultWeight={ad.weight}
                  defaultImageUrl={`/ad-images/${ad.imagePath}`}
                  defaultFocalX={ad.focalX}
                  defaultFocalY={ad.focalY}
                />
              </div>
            </div>
          ))}
        </section>
      </main>
    </>
  );
}
