-- Replace RateSnapshot.rate (best/min rate) with avgBuyRate/avgSellRate
-- (market averages). Existing rows are backfilled from the old `rate`
-- column so the trend graph keeps continuous history instead of a gap.
ALTER TABLE "RateSnapshot" ADD COLUMN "avgBuyRate" DOUBLE PRECISION;
ALTER TABLE "RateSnapshot" ADD COLUMN "avgSellRate" DOUBLE PRECISION;

UPDATE "RateSnapshot" SET "avgBuyRate" = "rate", "avgSellRate" = "rate";

ALTER TABLE "RateSnapshot" ALTER COLUMN "avgBuyRate" SET NOT NULL;
ALTER TABLE "RateSnapshot" ALTER COLUMN "avgSellRate" SET NOT NULL;

ALTER TABLE "RateSnapshot" DROP COLUMN "rate";
