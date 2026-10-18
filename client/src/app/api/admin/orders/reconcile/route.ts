import { NextRequest } from "next/server";
import { ok, fail, getAdmin, requireAdminSync } from "@/lib/server/next-helpers";
import { reconcilePaidOrders } from "@/lib/server/modules/webhooks/webhook.service";

export async function POST(req: NextRequest) {
  try {
    requireAdminSync(await getAdmin(req), ["admin"]);
    const repaired = await reconcilePaidOrders();
    return ok({ repaired });
  } catch (e) {
    return fail(e);
  }
}
