import { NextRequest } from "next/server";
import { ok, fail, parseParams } from "@/lib/server/next-helpers";
import { productSlugParamSchema } from "@/lib/server/modules/products/product.schema";
import * as productService from "@/lib/server/modules/products/product.service";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    parseParams({ slug }, productSlugParamSchema);
    const product = await productService.getPublicProductBySlug(slug);
    return ok(product);
  } catch (e) {
    return fail(e);
  }
}
