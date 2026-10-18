import { NextRequest, NextResponse } from "next/server";
import { fail, getAdmin, requireAdminSync, parseQuery } from "@/lib/server/next-helpers";
import * as orderService from "@/lib/server/modules/orders/order.service";
import { adminOrderListQuerySchema } from "@/lib/server/modules/orders/order.schema";

export async function GET(req: NextRequest) {
  try {
    requireAdminSync(await getAdmin(req), ["admin"]);
    const q = parseQuery(req, adminOrderListQuerySchema);
    const result = await orderService.listAdminOrders({ page: q.page ?? 1, pageSize: q.pageSize ?? 20, status: q.status, search: q.search });
    return NextResponse.json({ success: true, data: result.items, pagination: result.pagination });
  } catch (e) {
    return fail(e);
  }
}

