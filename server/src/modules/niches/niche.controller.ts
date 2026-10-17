import type { Request, Response } from "express";
import { recordAudit } from "../../lib/audit";
import * as nicheService from "./niche.service";

export async function listPublic(_req: Request, res: Response) {
  const niches = await nicheService.listPublicNiches();
  res.json({ success: true, data: niches });
}

export async function getPublic(req: Request, res: Response) {
  const niche = await nicheService.getNicheBySlug(req.params.slug as string);
  res.json({ success: true, data: niche });
}

export async function listAdmin(_req: Request, res: Response) {
  const niches = await nicheService.listAdminNiches();
  res.json({ success: true, data: niches });
}

export async function create(req: Request, res: Response) {
  const niche = await nicheService.createNiche(req.body);
  await recordAudit({
    adminId: req.admin?.id,
    action: "niche.create",
    entity: "Niche",
    entityId: niche.id,
    metadata: { slug: niche.slug, name: niche.name },
    req,
  });
  res.status(201).json({ success: true, data: niche });
}

export async function update(req: Request, res: Response) {
  const niche = await nicheService.updateNiche(req.params.id as string, req.body);
  await recordAudit({
    adminId: req.admin?.id,
    action: "niche.update",
    entity: "Niche",
    entityId: niche.id,
    metadata: { slug: niche.slug, name: niche.name },
    req,
  });
  res.json({ success: true, data: niche });
}

export async function remove(req: Request, res: Response) {
  await nicheService.deleteNiche(req.params.id as string);
  await recordAudit({
    adminId: req.admin?.id,
    action: "niche.delete",
    entity: "Niche",
    entityId: req.params.id as string,
    req,
  });
  res.json({ success: true, data: null });
}
