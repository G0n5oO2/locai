-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('pending', 'change_pending', 'confirmed', 'declined', 'cancelled', 'expired');

-- CreateEnum
CREATE TYPE "DeliveryMethod" AS ENUM ('delivery', 'self', 'pickup');

-- CreateTable
CREATE TABLE "order" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "quantityG" INTEGER NOT NULL,
    "method" "DeliveryMethod" NOT NULL,
    "deliveryDate" DATE NOT NULL,
    "useDate" DATE NOT NULL,
    "showUseDate" BOOLEAN NOT NULL,
    "unitG" INTEGER NOT NULL,
    "unitPriceYen" INTEGER NOT NULL,
    "itemYen" INTEGER NOT NULL,
    "shippingYen" INTEGER NOT NULL,
    "totalYen" INTEGER NOT NULL,
    "isTrial" BOOLEAN NOT NULL DEFAULT false,
    "status" "OrderStatus" NOT NULL DEFAULT 'pending',
    "answerUntil" TIMESTAMP(3) NOT NULL,
    "proposedDeliveryDate" DATE,
    "proposedQuantityG" INTEGER,
    "proposedItemYen" INTEGER,
    "proposedShippingYen" INTEGER,
    "proposedTotalYen" INTEGER,
    "confirmIfRefused" BOOLEAN,
    "requestKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "producer_exposure" (
    "producerId" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "producer_exposure_pkey" PRIMARY KEY ("producerId")
);

-- CreateIndex
CREATE UNIQUE INDEX "order_requestKey_key" ON "order"("requestKey");

-- CreateIndex
CREATE INDEX "order_listingId_status_idx" ON "order"("listingId", "status");

-- CreateIndex
CREATE INDEX "order_buyerId_idx" ON "order"("buyerId");

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order" ADD CONSTRAINT "order_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "producer_exposure" ADD CONSTRAINT "producer_exposure_producerId_fkey" FOREIGN KEY ("producerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
