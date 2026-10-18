import { NextRequest } from "next/server";
import { ok, fail, getAdmin, requireAdminSync } from "@/lib/server/next-helpers";
import { getDashboardStats } from "@/lib/server/modules/stats/stats.service";

export async function GET(req: NextRequest) {
  try {
    requireAdminSync(await getAdmin(req), ["admin"]);
    const stats = await getDashboardStats();
    return ok(stats);
  } catch (e) {
    return fail(e);
  }
}
