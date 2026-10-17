import type { NextFunction, Request, Response } from "express";
import { verifyAuthToken } from "../lib/jwt";
import { ApiError } from "../utils/api-error";

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return null;
  }
  return header.slice(7).trim();
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const token = extractToken(req);
  if (!token) {
    throw ApiError.unauthorized("Missing authorization token");
  }

  const payload = verifyAuthToken(token);
  req.admin = {
    id: payload.sub,
    email: payload.email,
    name: null,
    role: payload.role,
  };

  next();
}
