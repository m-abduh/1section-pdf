import { NextRequest } from "next/server";
import { ok, fail, getAdmin, requireAdminSync } from "@/lib/server/next-helpers";
import { recordAudit } from "@/lib/server/lib/audit";
import { uploadImageBuffer } from "@/lib/server/lib/cloudinary";
import { ApiError } from "@/lib/server/utils/api-error";

const MAX_BYTES = 4 * 1024 * 1024;

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function looksLikeImage(buf: Buffer): boolean {
  if (buf.length < 12) return false;
  // PNG
  if (buf.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]))) return true;
  // JPEG
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true;
  // WebP: "RIFF" .... "WEBP"
  if (
    buf.subarray(0, 4).toString("ascii") === "RIFF" &&
    buf.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return true;
  }
  return false;
}

export async function POST(req: NextRequest) {
  try {
    const admin = requireAdminSync(await getAdmin(req), ["admin"]);
    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      throw ApiError.badRequest("No image uploaded");
    }
    if (!IMAGE_TYPES.has(file.type)) {
      throw new ApiError(400, "Only JPG, PNG or WebP images are allowed", {
        code: "BAD_FILE",
      });
    }
    if (file.size > MAX_BYTES) {
      throw new ApiError(400, "Image is too large (max 4 MB)", {
        code: "FILE_TOO_LARGE",
      });
    }
    const buf = Buffer.from(await file.arrayBuffer());
    if (!looksLikeImage(buf)) {
      throw new ApiError(400, "File is not a valid image", { code: "INVALID_IMAGE" });
    }

    const uploaded = await uploadImageBuffer(buf, file.name);
    await recordAudit({
      adminId: admin.id,
      action: "upload.thumbnail",
      entity: "Product",
      entityId: uploaded.storageKey,
      metadata: { bytes: uploaded.bytes, checksum: uploaded.checksum },
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    });

    return ok(uploaded, 201);
  } catch (e) {
    return fail(e);
  }
}
