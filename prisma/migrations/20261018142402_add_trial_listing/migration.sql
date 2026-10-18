-- AlterTable
ALTER TABLE "listing" ADD COLUMN     "isTrial" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "trialAnswerDays" INTEGER;

-- AlterTable
ALTER TABLE "producer_profile" ALTER COLUMN "trialAmountG" SET DEFAULT 500;
