-- AlterTable
ALTER TABLE "Order"
ADD COLUMN "returnedAt" TIMESTAMP(3),
ADD COLUMN "returnedById" TEXT;

-- CreateIndex
CREATE INDEX "Order_returnedById_idx"
ON "Order"("returnedById");

-- AddForeignKey
ALTER TABLE "Order"
ADD CONSTRAINT "Order_returnedById_fkey"
FOREIGN KEY ("returnedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
