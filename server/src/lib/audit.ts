import type { Prisma } from "@prisma/client";
import type { Request } from "express";
import { prisma } from "./prisma";

export interface AuditInput {
  adminId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
  req?: Request;
}

export function clientIp(req?: Request): string | undefined {
  if (!req) return undefined;
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]?.trim();
  }
  return req.ip;
}

export async function recordAudit(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        adminId: input.adminId ?? null,
        action: input.action,
        entity: input.entity,
        entityId: input.entityId ?? null,
        metadata: input.metadata,
        ip: clientIp(input.req) ?? null,
      },
    });
  } catch (error) {
    console.error(
      "[audit] failed to record entry:",
      error instanceof Error ? error.message : error,
    );
  }
}
