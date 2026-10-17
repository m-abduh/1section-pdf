import { Router, type Request, type Response } from "express";
import multer from "multer";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { requireAuth } from "../../middlewares/auth";
import { ApiError } from "../../utils/api-error";
import { uploadDir } from "../downloads/download.service";

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safeExt = path.extname(file.originalname).toLowerCase() || ".pdf";
    cb(null, `${randomUUID()}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      cb(new ApiError(400, "Only PDF files are allowed", { code: "BAD_FILE" }));
      return;
    }
    cb(null, true);
  },
});

export const adminUploadRouter = Router();

adminUploadRouter.use(requireAuth);

adminUploadRouter.post("/", upload.single("file"), (req: Request, res: Response) => {
  if (!req.file) {
    throw ApiError.badRequest("No file uploaded");
  }

  res.status(201).json({
    success: true,
    data: {
      url: `/uploads/${req.file.filename}`,
      size: req.file.size,
      originalName: req.file.originalname,
    },
  });
});
