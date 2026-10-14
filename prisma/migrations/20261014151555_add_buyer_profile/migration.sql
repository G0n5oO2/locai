-- CreateTable
CREATE TABLE "buyer_profile" (
    "userId" TEXT NOT NULL,
    "prefecture" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "buyer_profile_pkey" PRIMARY KEY ("userId")
);

-- AddForeignKey
ALTER TABLE "buyer_profile" ADD CONSTRAINT "buyer_profile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
