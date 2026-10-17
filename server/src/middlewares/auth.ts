import type { NextFunction, Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { verifyAuthToken } from "../lib/jwt";
import { ApiError } from "../utils/api-error";

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return null;
  }
  return header.slice(7).trim();
}

export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  const token = extractToken(req);
  if (!token) {
    throw ApiError.unauthorized("Missing authorization token");
  }

  const payload = verifyAuthToken(token);

  const user = await prisma.adminUser.findUnique({
    where: { id: payload.sub },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      tokenVersion: true,
    },
  });

  if (!user || !user.isActive) {
    throw ApiError.unauthorized("Account is no longer active");
  }

  if (user.tokenVersion !== payload.tokenVersion) {
    throw ApiError.unauthorized("Session has been revoked");
  }

  req.admin = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };

  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.admin) {
      throw ApiError.unauthorized();
    }
    if (roles.length > 0 && !roles.includes(req.admin.role)) {
      throw ApiError.forbidden("You do not have permission for this action");
    }
    next();
  };
}
