import type { Request, Response } from "express";
import { ApiError } from "../../utils/api-error";
import { recordAudit } from "../../lib/audit";
import * as authService from "./auth.service";

export async function login(req: Request, res: Response) {
  const result = await authService.login(req.body);
  await recordAudit({
    adminId: result.user.id,
    action: "auth.login",
    entity: "AdminUser",
    entityId: result.user.id,
    req,
  });
  res.json({ success: true, data: result });
}

export async function me(req: Request, res: Response) {
  if (!req.admin) {
    throw ApiError.unauthorized();
  }
  const user = await authService.getProfile(req.admin.id);
  res.json({ success: true, data: user });
}

export async function logout(req: Request, res: Response) {
  if (!req.admin) {
    throw ApiError.unauthorized();
  }
  await authService.revokeSessions(req.admin.id);
  await recordAudit({
    adminId: req.admin.id,
    action: "auth.logout",
    entity: "AdminUser",
    entityId: req.admin.id,
    req,
  });
  res.json({ success: true, data: null });
}
