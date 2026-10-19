import { createHash } from "node:crypto";
import { v2 as cloudinary } from "cloudinary";
import { cloudinaryConfig, hasCloudinary, env } from "../config/env";
import { ApiError } from "../utils/api-error";

let configured = false;

function ensureConfigured() {
  if (!hasCloudinary) {
    throw new ApiError(
      503,
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.",
      { code: "STORAGE_NOT_CONFIGURED" },
    );
  }
  if (!configured) {
    cloudinary.config({
      cloud_name: cloudinaryConfig.cloudName,
      api_key: cloudinaryConfig.apiKey,
      api_secret: cloudinaryConfig.apiSecret,
      secure: true,
    });
    configured = true;
  }
}

export interface UploadedPdf {
  provider: "CLOUDINARY";
  storageKey: string;
  resourceType: string;
  format: string;
  bytes: number;
  checksum: string;
}

export function checksumOf(buffer: Buffer): string {
  return createHash("sha256").update(buffer).digest("hex");
}

export async function uploadPdfBuffer(
  buffer: Buffer,
  originalName: string,
): Promise<UploadedPdf> {
  ensureConfigured();

  const publicIdBase = originalName
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .slice(0, 80);

  const result = await new Promise<{
    public_id: string;
    resource_type: string;
    format: string;
    bytes: number;
  }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        type: "authenticated",
        folder: env.CLOUDINARY_FOLDER,
        public_id: `${publicIdBase}-${Date.now()}`,
        format: "pdf",
      },
      (error, uploadResult) => {
        if (error || !uploadResult) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve(
          uploadResult as unknown as {
            public_id: string;
            resource_type: string;
            format: string;
            bytes: number;
          },
        );
      },
    );
    stream.end(buffer);
  });

  return {
    provider: "CLOUDINARY",
    storageKey: result.public_id,
    resourceType: result.resource_type,
    format: result.format,
    bytes: result.bytes,
    checksum: checksumOf(buffer),
  };
}

export function buildSignedDownloadUrl(
  storageKey: string,
  resourceType = "image",
  format = "pdf",
): string {
  ensureConfigured();
  const expiresAt = Math.floor(
    Date.now() / 1000 + env.DOWNLOAD_SIGNED_URL_TTL_MINUTES * 60,
  );
  return cloudinary.utils.private_download_url(storageKey, format, {
    resource_type: resourceType,
    type: "authenticated",
    expires_at: expiresAt,
  });
}
