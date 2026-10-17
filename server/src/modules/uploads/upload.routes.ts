import { Router, type Request, type Response } from "express";
import multer from "multer";
import { requireAuth, requireRole } from "../../middlewares/auth";
import { uploadLimiter } from "../../middlewares/rate-limit";
import { ApiError } from "../../utils/api-error";
import { recordAudit } from "../../lib/audit";
import { uploadPdfBuffer } from "../../lib/cloudinary";

const PDF_MAGIC = Buffer.from("%PDF-");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      cb(new ApiError(400, "Only PDF files are allowed", { code: "BAD_FILE" }));
      return;
    }
    cb(null, true);
  },
});

export const adminUploadRouter = Router();

adminUploadRouter.use(requireAuth, requireRole("admin"));
adminUploadRouter.use(uploadLimiter);

adminUploadRouter.post(
  "/",
  upload.single("file"),
  async (req: Request, res: Response) => {
    const file = req.file;
    if (!file) {
      throw ApiError.badRequest("No file uploaded");
    }

    // Defence-in-depth: MIME type can be spoofed, so verify the magic bytes.
    if (!file.buffer.subarray(0, PDF_MAGIC.length).equals(PDF_MAGIC)) {
      throw new ApiError(400, "File is not a valid PDF", {
        code: "INVALID_PDF",
      });
    }

    const uploaded = await uploadPdfBuffer(file.buffer, file.originalname);

    await recordAudit({
      adminId: req.admin?.id,
      action: "upload.create",
      entity: "ProductFile",
      entityId: uploaded.storageKey,
      metadata: { bytes: uploaded.bytes, checksum: uploaded.checksum },
      req,
    });

    res.status(201).json({
      success: true,
      data: {
        name: file.originalname.replace(/\.[^.]+$/, ""),
        ...uploaded,
      },
    });
  },
);
