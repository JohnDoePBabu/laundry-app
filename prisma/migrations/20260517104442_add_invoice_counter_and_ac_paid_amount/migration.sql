-- AlterTable
ALTER TABLE "AcJob" ADD COLUMN     "paidAmountPaise" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "InvoiceCounter" (
    "prefix" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoiceCounter_pkey" PRIMARY KEY ("prefix")
);
