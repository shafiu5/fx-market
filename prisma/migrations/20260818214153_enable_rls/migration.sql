-- Enable Row Level Security on every public-schema table. Flagged by
-- Supabase's security linter: with RLS off, anyone holding the project's
-- anon key can read/write these tables directly via the PostgREST API,
-- bypassing the app's own auth entirely.
--
-- Safe no-op for the app itself: Prisma connects via the Postgres
-- superuser role (DATABASE_URL), which bypasses RLS regardless. This only
-- blocks the anon/authenticated roles, which the app never uses for data
-- access — Supabase is only used here for Postgres hosting and Storage.
-- No policies are added, so those roles get zero access (default-deny).
ALTER TABLE "public"."User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."SellerRate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."RateSnapshot" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."PaymentRequest" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."PaymentSettings" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."SubscriptionTier" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."BoostTier" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."Advertisement" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."_prisma_migrations" ENABLE ROW LEVEL SECURITY;
