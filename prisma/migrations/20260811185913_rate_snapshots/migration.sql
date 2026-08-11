-- CreateTable
CREATE TABLE "RateSnapshot" (
    "id" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RateSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RateSnapshot_currency_createdAt_idx" ON "RateSnapshot"("currency", "createdAt");
