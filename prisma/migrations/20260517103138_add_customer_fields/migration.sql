-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "address" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "gstin" TEXT;

-- AlterTable
ALTER TABLE "LaundryOrder" ADD COLUMN     "discMode" TEXT NOT NULL DEFAULT 'none';
