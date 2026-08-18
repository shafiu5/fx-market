-- CreateTable
CREATE TABLE "Advertisement" (
    "id" TEXT NOT NULL,
    "advertiserName" TEXT NOT NULL,
    "imagePath" TEXT NOT NULL,
    "linkUrl" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Advertisement_pkey" PRIMARY KEY ("id")
);
