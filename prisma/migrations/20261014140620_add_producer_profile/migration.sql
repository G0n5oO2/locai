-- CreateTable
CREATE TABLE "producer_profile" (
    "userId" TEXT NOT NULL,
    "prefecture" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "items" TEXT NOT NULL,
    "commitment" TEXT NOT NULL,
    "shipLimitDelivery" INTEGER NOT NULL,
    "shipLimitSelf" INTEGER NOT NULL,
    "shipLimitPickup" INTEGER NOT NULL,
    "trialAmountG" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "producer_profile_pkey" PRIMARY KEY ("userId")
);

-- AddForeignKey
ALTER TABLE "producer_profile" ADD CONSTRAINT "producer_profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
