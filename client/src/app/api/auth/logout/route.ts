import { NextRequest } from "next/server";
import { ok, fail, getAdmin } from "@/lib/server/next-helpers";
import * as authService from "@/lib/server/modules/auth/auth.service";
import { recordAudit } from "@/lib/server/lib/audit";

export async function POST(req: NextRequest) {
  try {
    const admin = await getAdmin(req);
    if (!admin) throw new (await import("@/lib/server/utils/api-error")).ApiError(401, "Unauthorized", { code: "UNAUTHORIZED" });
    await authService.revokeSessions(admin.id);
    await recordAudit({ adminId: admin.id, action: "auth.logout", entity: "AdminUser", entityId: admin.id, ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() });
    return ok(null);
  } catch (e) {
    return fail(e);
  }
}
