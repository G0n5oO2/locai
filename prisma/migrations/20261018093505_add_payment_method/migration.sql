-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('cash', 'transfer', 'cod', 'mobile');

-- AlterTable
ALTER TABLE "order" ADD COLUMN     "paymentMethod" "PaymentMethod";

-- AlterTable
ALTER TABLE "producer_profile" ADD COLUMN     "paymentMethods" "PaymentMethod"[] DEFAULT ARRAY[]::"PaymentMethod"[];
