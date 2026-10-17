import path from "node:path";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/api-error";
import { env } from "../../config/env";
import { generateSecureToken } from "../../utils/ids";
import { buildSignedDownloadUrl } from "../../lib/cloudinary";

export const uploadDir = path.resolve(process.cwd(), "uploads");

export interface ResolvedDownload {
  fileName: string;
  redirectUrl?: string;
  localPath?: string;
}

function tokenExpiry(): Date {
  return new Date(Date.now() + env.DOWNLOAD_TOKEN_TTL_HOURS * 60 * 60 * 1000);
}

/**
 * Idempotently grants entitlements + download tokens for a paid order.
 * Safe to call multiple times (reconciliation, duplicate webhooks).
 */
export async function fulfillOrder(orderId: string): Promise<number> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          product: { include: { files: { orderBy: { sortOrder: "asc" } } } },
        },
      },
    },
  });

  if (!order) return 0;

  let created = 0;

  for (const item of order.items) {
    const files = item.product?.files ?? [];

    for (const file of files) {
      const entitlement = await prisma.entitlement.upsert({
        where: {
          orderItemId_fileId: { orderItemId: item.id, fileId: file.id },
        },
        update: { status: "ACTIVE" },
        create: {
          orderId,
          orderItemId: item.id,
          productId: item.productId,
          fileId: file.id,
          status: "ACTIVE",
        },
      });

      const existing = await prisma.downloadToken.findFirst({
        where: { entitlementId: entitlement.id },
      });
      if (existing) continue;

      await prisma.downloadToken.create({
        data: {
          token: generateSecureToken(24),
          orderItemId: item.id,
          entitlementId: entitlement.id,
          fileId: file.id,
          label: file.name,
          expiresAt: tokenExpiry(),
          maxDownloads: env.DOWNLOAD_MAX_HITS,
        },
      });
      created += 1;
    }
  }

  return created;
}

export async function revokeOrderEntitlements(orderId: string): Promise<void> {
  await prisma.entitlement.updateMany({
    where: { orderId },
    data: { status: "REVOKED" },
  });
}

export async function resolveDownload(token: string): Promise<ResolvedDownload> {
  const record = await prisma.downloadToken.findUnique({
    where: { token },
    include: { file: true, entitlement: true },
  });

  if (!record) {
    throw ApiError.notFound("Download link is invalid");
  }

  if (record.entitlement && record.entitlement.status === "REVOKED") {
    throw ApiError.forbidden("Access to this file has been revoked");
  }

  if (record.expiresAt.getTime() < Date.now()) {
    throw new ApiError(410, "Download link has expired", { code: "EXPIRED" });
  }

  // Atomic quota enforcement: only increments when still under the limit.
  const updated = await prisma.downloadToken.updateMany({
    where: {
      id: record.id,
      downloadCount: { lt: record.maxDownloads },
      expiresAt: { gt: new Date() },
    },
    data: { downloadCount: { increment: 1 } },
  });

  if (updated.count === 0) {
    throw ApiError.forbidden("Download limit reached for this link");
  }

  const fileName = sanitizeFileName(ensurePdfExtension(record.label));
  const file = record.file;

  if (file?.provider === "CLOUDINARY" && file.storageKey) {
    return {
      fileName,
      redirectUrl: buildSignedDownloadUrl(
        file.storageKey,
        file.resourceType ?? "image",
        file.format ?? "pdf",
      ),
    };
  }

  const sourceUrl = file?.fileUrl ?? record.fileUrl;
  if (!sourceUrl) {
    throw ApiError.notFound("File is not available for this product");
  }

  if (/^https?:\/\//i.test(sourceUrl)) {
    return { fileName, redirectUrl: sourceUrl };
  }

  return { fileName, localPath: resolveLocalFile(sourceUrl) };
}

function ensurePdfExtension(label: string): string {
  return label.toLowerCase().endsWith(".pdf") ? label : `${label}.pdf`;
}

export function resolveLocalFile(fileUrl: string): string {
  const relative = fileUrl.replace(/^\/uploads\//, "");
  const absolute = path.resolve(uploadDir, relative);
  if (!absolute.startsWith(uploadDir)) {
    throw ApiError.forbidden("Invalid file path");
  }
  return absolute;
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-");
}
