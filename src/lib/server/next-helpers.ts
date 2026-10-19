import { NextResponse, type NextRequest } from "next/server";
import { ApiError } from "./utils/api-error";
import { verifyAuthToken } from "./lib/jwt";
import { prisma } from "./lib/prisma";
import { env } from "./config/env";
import type { z } from "zod";

export type AdminCtx = { id: string; email: string; name: string | null; role: string };

export async function getAdmin(req: NextRequest): Promise<AdminCtx | null> {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  const token = header.slice(7).trim();
  try {
    const payload = verifyAuthToken(token);
    const user = await prisma.adminUser.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, role: true, isActive: true, tokenVersion: true },
    });
    if (!user || !user.isActive || user.tokenVersion !== payload.tokenVersion) return null;
    return { id: user.id, email: user.email, name: user.name, role: user.role };
  } catch {
    return null;
  }
}

export function requireAdminSync(admin: AdminCtx | null, roles: string[] = []): AdminCtx {
  if (!admin) throw new ApiError(401, "Unauthorized", { code: "UNAUTHORIZED" });
  if (roles.length > 0 && !roles.includes(admin.role)) {
    throw new ApiError(403, "Forbidden", { code: "FORBIDDEN" });
  }
  return admin;
}

export function ok(data: unknown, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

export function fail(err: unknown) {
  if (err instanceof ApiError) {
    return NextResponse.json(
      { success: false, error: { code: err.code ?? "ERROR", message: err.message } },
      { status: err.statusCode },
    );
  }
  if (err instanceof Error && err.name === "ZodError") {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "Invalid input", details: (err as any).issues } },
      { status: 400 },
    );
  }
  console.error("[api] unhandled error:", err);
  return NextResponse.json(
    { success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
    { status: 500 },
  );
}

export async function parseJson<T>(req: NextRequest, schema: z.ZodType<T>): Promise<T> {
  const body = await req.json().catch(() => ({}));
  return schema.parse(body);
}

export function parseQuery<T>(req: NextRequest, schema: z.ZodType<T>): T {
  const obj: Record<string, string> = {};
  req.nextUrl.searchParams.forEach((v, k) => {
    obj[k] = v;
  });
  return schema.parse(obj);
}

export function parseParams<T>(params: Record<string, string>, schema: z.ZodType<T>): T {
  return schema.parse(params);
}

// Simple in-memory rate limiter (per-instance; fine for single deployment).
const buckets = new Map<string, { count: number; reset: number }>();
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  if (env.RATE_LIMIT_DISABLED) return true;
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  if (b.count >= limit) return false;
  b.count += 1;
  return true;
}

export function clientIp(req: NextRequest): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
