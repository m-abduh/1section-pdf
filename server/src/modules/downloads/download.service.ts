import path from "node:path";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/api-error";
import { env } from "../../config/env";
import { generateSecureToken } from "../../utils/ids";

export const uploadDir = path.resolve(process.cwd(), "uploads");

export interface ResolvedDownload {
  fileUrl: string;
  fileName: string;
  downloadUrl: string;
  external: boolean;
}

export async function issueDownloadTokensForItem(
  orderItemId: string,
  productId: string | null,
): Promise<number> {
  if (!productId) return 0;

  const files = await prisma.productFile.findMany({
    where: { productId },
    orderBy: { sortOrder: "asc" },
  });
  if (files.length === 0) return 0;

  const expiresAt = new Date(
    Date.now() + env.DOWNLOAD_TOKEN_TTL_HOURS * 60 * 60 * 1000,
  );

  await prisma.downloadToken.createMany({
    data: files.map((file) => ({
      token: generateSecureToken(24),
      orderItemId,
      fileId: file.id,
      label: file.name,
      fileUrl: file.fileUrl,
      expiresAt,
      maxDownloads: env.DOWNLOAD_MAX_HITS,
    })),
  });

  return files.length;
}

export async function resolveDownload(token: string): Promise<ResolvedDownload> {
  const record = await prisma.downloadToken.findUnique({
    where: { token },
  });

  if (!record) {
    throw ApiError.notFound("Download link is invalid");
  }

  if (record.expiresAt.getTime() < Date.now()) {
    throw new ApiError(410, "Download link has expired", { code: "EXPIRED" });
  }

  if (record.downloadCount >= record.maxDownloads) {
    throw ApiError.forbidden("Download limit reached for this link");
  }

  if (!record.fileUrl) {
    throw ApiError.notFound("File is not available for this product");
  }

  await prisma.downloadToken.update({
    where: { id: record.id },
    data: { downloadCount: { increment: 1 } },
  });

  const external = /^https?:\/\//i.test(record.fileUrl);
  const fileName = sanitizeFileName(ensurePdfExtension(record.label));

  return {
    fileUrl: record.fileUrl,
    fileName,
    downloadUrl: external ? record.fileUrl : `${env.CLIENT_URL}${record.fileUrl}`,
    external,
  };
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
