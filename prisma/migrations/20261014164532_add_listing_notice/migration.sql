-- CreateTable
CREATE TABLE "listing_notice" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_notice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "listing_notice_buyerId_idx" ON "listing_notice"("buyerId");

-- CreateIndex
CREATE UNIQUE INDEX "listing_notice_listingId_buyerId_key" ON "listing_notice"("listingId", "buyerId");

-- AddForeignKey
ALTER TABLE "listing_notice" ADD CONSTRAINT "listing_notice_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_notice" ADD CONSTRAINT "listing_notice_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
