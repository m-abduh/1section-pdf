-- CreateEnum
CREATE TYPE "LearningLevel" AS ENUM ('FOUNDATIONS', 'PRACTICAL', 'ADVANCED');

-- AlterTable
ALTER TABLE "niches" ADD COLUMN     "audience" TEXT,
ADD COLUMN     "problems" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "product_files" ADD COLUMN     "assetFileId" TEXT;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "audience" TEXT,
ADD COLUMN     "learnings" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "level" "LearningLevel" NOT NULL DEFAULT 'FOUNDATIONS',
ADD COLUMN     "license" TEXT,
ADD COLUMN     "limitations" TEXT,
ADD COLUMN     "notFor" TEXT,
ADD COLUMN     "outcome" TEXT,
ADD COLUMN     "sampleUrl" TEXT;

-- CreateTable
CREATE TABLE "asset_files" (
    "id" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "provider" "StorageProvider" NOT NULL DEFAULT 'CLOUDINARY',
    "resourceType" TEXT,
    "format" TEXT,
    "mimeType" TEXT,
    "bytes" INTEGER,
    "checksum" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_files_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "asset_files_storageKey_key" ON "asset_files"("storageKey");

-- CreateIndex
CREATE INDEX "product_files_assetFileId_idx" ON "product_files"("assetFileId");

-- AddForeignKey
ALTER TABLE "product_files" ADD CONSTRAINT "product_files_assetFileId_fkey" FOREIGN KEY ("assetFileId") REFERENCES "asset_files"("id") ON DELETE SET NULL ON UPDATE CASCADE;
