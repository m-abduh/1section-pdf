import { NextRequest } from "next/server";
import { ok, fail, getAdmin } from "@/lib/server/next-helpers";
import * as authService from "@/lib/server/modules/auth/auth.service";

export async function GET(req: NextRequest) {
  try {
    const admin = await getAdmin(req);
    if (!admin) throw new (await import("@/lib/server/utils/api-error")).ApiError(401, "Unauthorized", { code: "UNAUTHORIZED" });
    const user = await authService.getProfile(admin.id);
    return ok(user);
  } catch (e) {
    return fail(e);
  }
}
