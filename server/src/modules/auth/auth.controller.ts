import type { Request, Response } from "express";
import { ApiError } from "../../utils/api-error";
import * as authService from "./auth.service";

export async function login(req: Request, res: Response) {
  const result = await authService.login(req.body);
  res.json({ success: true, data: result });
}

export async function me(req: Request, res: Response) {
  if (!req.admin) {
    throw ApiError.unauthorized();
  }
  const user = await authService.getProfile(req.admin.id);
  res.json({ success: true, data: user });
}
