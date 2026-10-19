import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

export interface AuditInput {
  adminId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Prisma.InputJsonValue;
  ip?: string;
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
        ip: input.ip ?? null,
      },
    });
  } catch (error) {
    console.error(
      "[audit] failed to record entry:",
      error instanceof Error ? error.message : error,
    );
  }
}
