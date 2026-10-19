import { NextRequest } from "next/server";
import { ok, fail, parseQuery } from "@/lib/server/next-helpers";
import { listProductsQuerySchema } from "@/lib/server/modules/products/product.schema";
import * as productService from "@/lib/server/modules/products/product.service";

export async function GET(req: NextRequest) {
  try {
    const q = parseQuery(req, listProductsQuerySchema);
    const products = await productService.listPublicProducts(q.niche);
    return ok(products);
  } catch (e) {
    return fail(e);
  }
}
