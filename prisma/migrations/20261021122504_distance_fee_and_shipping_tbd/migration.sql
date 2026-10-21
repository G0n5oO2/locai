-- AlterTable
ALTER TABLE "order" ADD COLUMN     "shippingToBeDecided" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "producer_profile" ADD COLUMN     "distanceFeeMaxKm" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "distanceFeeYen" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "selfDeliveryMaxKm" INTEGER;
