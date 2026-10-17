import { z } from "zod";
import { Router } from "express";
import { requireAuth, requireRole } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import * as assetController from "./asset.controller";

const createAssetSchema = z.object({
  storageKey: z.string().min(1).max(500),
  provider: z.enum(["CLOUDINARY", "LOCAL", "EXTERNAL"]).optional(),
  resourceType: z.string().max(50).optional().nullable(),
  format: z.string().max(20).optional().nullable(),
  mimeType: z.string().max(120).optional().nullable(),
  bytes: z.number().int().min(0).optional().nullable(),
  checksum: z.string().max(128).optional().nullable(),
});

export const adminAssetRouter = Router();

adminAssetRouter.use(requireAuth, requireRole("admin"));
adminAssetRouter.get("/", assetController.list);
adminAssetRouter.post(
  "/",
  validate({ body: createAssetSchema }),
  assetController.create,
);
