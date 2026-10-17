import type { Request, Response } from "express";
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
  res.status(201).json({ success: true, data: niche });
}

export async function update(req: Request, res: Response) {
  const niche = await nicheService.updateNiche(req.params.id as string, req.body);
  res.json({ success: true, data: niche });
}

export async function remove(req: Request, res: Response) {
  await nicheService.deleteNiche(req.params.id as string);
  res.json({ success: true, data: null });
}
