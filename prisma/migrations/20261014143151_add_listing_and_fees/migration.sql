-- CreateEnum
CREATE TYPE "Quality" AS ENUM ('normal', 'irregular');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('open', 'closed');

-- AlterTable
ALTER TABLE "producer_profile" ADD COLUMN     "deliveryBand1MaxG" INTEGER,
ADD COLUMN     "deliveryBand1Yen" INTEGER,
ADD COLUMN     "deliveryBand2MaxG" INTEGER,
ADD COLUMN     "deliveryBand2Yen" INTEGER,
ADD COLUMN     "deliveryBand3MaxG" INTEGER,
ADD COLUMN     "deliveryBand3Yen" INTEGER,
ADD COLUMN     "pickupPlace" TEXT,
ADD COLUMN     "selfDeliveryYen" INTEGER;

-- CreateTable
CREATE TABLE "listing" (
    "id" TEXT NOT NULL,
    "producerId" TEXT NOT NULL,
    "vegetable" TEXT NOT NULL,
    "totalG" INTEGER NOT NULL,
    "unitG" INTEGER NOT NULL,
    "minOrderG" INTEGER NOT NULL,
    "unitPriceYen" INTEGER NOT NULL,
    "quality" "Quality" NOT NULL,
    "surplus" BOOLEAN NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "acceptUntil" TIMESTAMP(3) NOT NULL,
    "answerUntil" TIMESTAMP(3) NOT NULL,
    "deliverFrom" DATE NOT NULL,
    "deliverTo" DATE NOT NULL,
    "offersDelivery" BOOLEAN NOT NULL,
    "offersSelf" BOOLEAN NOT NULL,
    "offersPickup" BOOLEAN NOT NULL,
    "status" "ListingStatus" NOT NULL DEFAULT 'open',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "listing_producerId_idx" ON "listing"("producerId");

-- CreateIndex
CREATE INDEX "listing_status_acceptUntil_idx" ON "listing"("status", "acceptUntil");

-- AddForeignKey
ALTER TABLE "listing" ADD CONSTRAINT "listing_producerId_fkey" FOREIGN KEY ("producerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
