import { NextRequest } from "next/server";
import { ok, fail, getAdmin, requireAdminSync } from "@/lib/server/next-helpers";
import * as orderService from "@/lib/server/modules/orders/order.service";
import { orderIdParamSchema } from "@/lib/server/modules/orders/order.schema";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAdminSync(await getAdmin(_req), ["admin"]);
    const { id } = await params;
    orderIdParamSchema.parse({ id });
    const order = await orderService.getAdminOrder(id);
    return ok(order);
  } catch (e) {
    return fail(e);
  }
}
