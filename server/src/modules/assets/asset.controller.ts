import type { Request, Response } from "express";
import { recordAudit } from "../../lib/audit";
import * as assetService from "./asset.service";

export async function list(req: Request, res: Response) {
  const assets = await assetService.listAssetFiles();
  res.json({ success: true, data: assets });
}

export async function create(req: Request, res: Response) {
  const asset = await assetService.upsertAssetFile(req.body);
  await recordAudit({
    adminId: req.admin?.id,
    action: "assetFile.upsert",
    entity: "AssetFile",
    entityId: asset.id,
    metadata: { storageKey: asset.storageKey },
    req,
  });
  res.status(201).json({ success: true, data: asset });
}
