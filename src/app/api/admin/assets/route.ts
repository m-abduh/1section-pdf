import { NextRequest } from "next/server";
import { ok, fail, getAdmin, requireAdminSync } from "@/lib/server/next-helpers";
import * as assetService from "@/lib/server/modules/assets/asset.service";
import { z } from "zod";

const createAssetSchema = z.object({
  storageKey: z.string().min(1).max(500),
  provider: z.enum(["CLOUDINARY", "LOCAL", "EXTERNAL"]).optional(),
  resourceType: z.string().max(50).optional().nullable(),
  format: z.string().max(20).optional().nullable(),
  mimeType: z.string().max(120).optional().nullable(),
  bytes: z.number().int().min(0).optional().nullable(),
  checksum: z.string().max(128).optional().nullable(),
});

export async function GET(req: NextRequest) {
  try {
    requireAdminSync(await getAdmin(req), ["admin"]);
    const assets = await assetService.listAssetFiles();
    return ok(assets);
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    requireAdminSync(await getAdmin(req), ["admin"]);
    const body = await req.json();
    const parsed = createAssetSchema.parse(body);
    const asset = await assetService.upsertAssetFile(parsed);
    return ok(asset, 201);
  } catch (e) {
    return fail(e);
  }
}
