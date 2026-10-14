-- AlterTable
ALTER TABLE "order" ADD COLUMN     "buyerReadAt" TIMESTAMP(3),
ADD COLUMN     "producerReadAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "order_message" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "order_message_orderId_createdAt_idx" ON "order_message"("orderId", "createdAt");

-- AddForeignKey
ALTER TABLE "order_message" ADD CONSTRAINT "order_message_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "order"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_message" ADD CONSTRAINT "order_message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
