-- CreateEnum
CREATE TYPE "WantedKind" AS ENUM ('specified', 'substitute', 'any');

-- CreateTable
CREATE TABLE "wanted_request" (
    "id" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "kind" "WantedKind" NOT NULL,
    "vegetable" TEXT NOT NULL DEFAULT '',
    "substitutes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "quantityG" INTEGER NOT NULL,
    "useDate" DATE NOT NULL,
    "method" "DeliveryMethod" NOT NULL,
    "prefecture" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "closed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wanted_request_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "wanted_request_closed_useDate_idx" ON "wanted_request"("closed", "useDate");

-- AddForeignKey
ALTER TABLE "wanted_request" ADD CONSTRAINT "wanted_request_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
