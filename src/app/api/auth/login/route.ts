import { NextRequest, NextResponse } from "next/server";
import { ok, fail, parseJson, rateLimit, clientIp } from "@/lib/server/next-helpers";
import { loginSchema } from "@/lib/server/modules/auth/auth.schema";
import * as authService from "@/lib/server/modules/auth/auth.service";
import { recordAudit } from "@/lib/server/lib/audit";

export async function POST(req: NextRequest) {
  try {
    if (!rateLimit(`login:${clientIp(req)}`, 10, 15 * 60 * 1000)) {
      return NextResponse.json({ success: false, error: { code: "RATE_LIMITED", message: "Too many requests. Please try again later." } }, { status: 429 });
    }
    const body = await parseJson(req, loginSchema);
    const result = await authService.login(body);
    await recordAudit({ adminId: result.user.id, action: "auth.login", entity: "AdminUser", entityId: result.user.id, ip: clientIp(req) });
    return ok(result);
  } catch (e) {
    return fail(e);
  }
}
