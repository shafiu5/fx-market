-- AlterTable
ALTER TABLE "PaymentRequest" ALTER COLUMN "slipPath" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "subscriptionReminderSentAt" TIMESTAMP(3);
