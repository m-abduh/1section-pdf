import { NextRequest } from "next/server";
import { ok, fail, getAdmin, requireAdminSync } from "@/lib/server/next-helpers";
import { productIdParamSchema } from "@/lib/server/modules/products/product.schema";
import { getPaddleState } from "@/lib/server/modules/paddle/paddle-catalog.service";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAdminSync(await getAdmin(_req), ["admin"]);
    const { id } = await params;
    productIdParamSchema.parse({ id });
    const result = await getPaddleState(id);
    return ok(result);
  } catch (e) {
    return fail(e);
  }
}
