import { NextRequest } from "next/server";
import { ok, fail, getAdmin, requireAdminSync } from "@/lib/server/next-helpers";
import { recordAudit } from "@/lib/server/lib/audit";
import { uploadPdfBuffer } from "@/lib/server/lib/cloudinary";
import { upsertAssetFile } from "@/lib/server/modules/assets/asset.service";
import { ApiError } from "@/lib/server/utils/api-error";

const PDF_MAGIC = Buffer.from("%PDF-");

export async function POST(req: NextRequest) {
  try {
    const admin = requireAdminSync(await getAdmin(req), ["admin"]);
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      throw ApiError.badRequest("No file uploaded");
    }
    if (file.type !== "application/pdf") {
      throw new ApiError(400, "Only PDF files are allowed", { code: "BAD_FILE" });
    }
    const buf = Buffer.from(await file.arrayBuffer());
    if (!buf.subarray(0, PDF_MAGIC.length).equals(PDF_MAGIC)) {
      throw new ApiError(400, "File is not a valid PDF", { code: "INVALID_PDF" });
    }
    if (buf.length > 50 * 1024 * 1024) {
      throw new ApiError(400, "File too large", { code: "FILE_TOO_LARGE" });
    }
    const uploaded = await uploadPdfBuffer(buf, file.name);
    const asset = await upsertAssetFile({
      storageKey: uploaded.storageKey,
      provider: uploaded.provider,
      resourceType: uploaded.resourceType,
      format: uploaded.format,
      mimeType: "application/pdf",
      bytes: uploaded.bytes,
      checksum: uploaded.checksum,
    });
    await recordAudit({
      adminId: admin.id,
      action: "upload.create",
      entity: "ProductFile",
      entityId: uploaded.storageKey,
      metadata: { bytes: uploaded.bytes, checksum: uploaded.checksum },
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    });
    return ok(
      {
        name: file.name.replace(/\.[^.]+$/, ""),
        assetFileId: asset.id,
        ...uploaded,
      },
      201,
    );
  } catch (e) {
    return fail(e);
  }
}
