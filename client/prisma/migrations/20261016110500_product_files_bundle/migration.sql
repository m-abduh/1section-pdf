-- CreateTable
CREATE TABLE "product_files" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_files_pkey" PRIMARY KEY ("id")
);

-- AlterTable: add multi-file download metadata to tokens
ALTER TABLE "download_tokens"
    ADD COLUMN "fileId" TEXT,
    ADD COLUMN "label" TEXT NOT NULL DEFAULT '',
    ADD COLUMN "fileUrl" TEXT NOT NULL DEFAULT '';

ALTER TABLE "download_tokens" ALTER COLUMN "label" DROP DEFAULT;
ALTER TABLE "download_tokens" ALTER COLUMN "fileUrl" DROP DEFAULT;

-- DataMigration: move legacy single file into product_files before dropping
INSERT INTO "product_files" ("id", "productId", "name", "fileUrl", "sortOrder")
SELECT md5(random()::text || clock_timestamp()::text), "id", "name", "fileUrl", 0
FROM "products"
WHERE "fileUrl" IS NOT NULL;

-- AlterTable: drop legacy single file column
ALTER TABLE "products" DROP COLUMN "fileUrl";

-- CreateIndex
CREATE INDEX "product_files_productId_sortOrder_idx" ON "product_files"("productId", "sortOrder");

-- AddForeignKey
ALTER TABLE "product_files" ADD CONSTRAINT "product_files_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;
