import { NextRequest } from "next/server";
import { ok, fail, getAdmin, requireAdminSync } from "@/lib/server/next-helpers";
import * as productService from "@/lib/server/modules/products/product.service";
import { createProductSchema } from "@/lib/server/modules/products/product.schema";
import { syncProductToPaddle } from "@/lib/server/modules/paddle/paddle-catalog.service";
import { recordAudit } from "@/lib/server/lib/audit";

export async function GET(req: NextRequest) {
  try {
    requireAdminSync(await getAdmin(req), ["admin"]);
    const products = await productService.listAdminProducts();
    return ok(products);
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = requireAdminSync(await getAdmin(req), ["admin"]);
    const body = await req.json();
    const parsed = createProductSchema.parse(body);
    const product = await productService.createProduct(parsed);
    try {
      await syncProductToPaddle(product.id);
    } catch (error) {
      console.warn(`[paddle] auto-sync on create failed for product ${product.id}:`, error instanceof Error ? error.message : error);
    }
    const refreshed = await productService.getProductById(product.id);
    await recordAudit({ adminId: admin.id, action: "product.create", entity: "Product", entityId: product.id, metadata: { name: product.name, priceAmount: product.priceAmount }, ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() });
    return ok(refreshed, 201);
  } catch (e) {
    return fail(e);
  }
}
