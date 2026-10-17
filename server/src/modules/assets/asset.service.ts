import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";

export function listAssetFiles() {
  return prisma.assetFile.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { productFiles: true } } },
  });
}

export interface UpsertAssetInput {
  storageKey: string;
  provider?: "CLOUDINARY" | "LOCAL" | "EXTERNAL";
  resourceType?: string | null;
  format?: string | null;
  mimeType?: string | null;
  bytes?: number | null;
  checksum?: string | null;
}

export function upsertAssetFile(input: UpsertAssetInput) {
  const data: Prisma.AssetFileCreateInput = {
    storageKey: input.storageKey,
    provider: input.provider ?? "CLOUDINARY",
    resourceType: input.resourceType ?? null,
    format: input.format ?? null,
    mimeType: input.mimeType ?? "application/pdf",
    bytes: input.bytes ?? null,
    checksum: input.checksum ?? null,
  };

  return prisma.assetFile.upsert({
    where: { storageKey: input.storageKey },
    update: {
      resourceType: data.resourceType,
      format: data.format,
      bytes: data.bytes,
      checksum: data.checksum,
      version: { increment: 1 },
    },
    create: data,
  });
}
