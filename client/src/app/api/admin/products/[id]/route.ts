import { NextRequest } from "next/server";
import { ok, fail, getAdmin, requireAdminSync } from "@/lib/server/next-helpers";
import * as productService from "@/lib/server/modules/products/product.service";
import { updateProductSchema, productIdParamSchema } from "@/lib/server/modules/products/product.schema";
import { syncProductToPaddle } from "@/lib/server/modules/paddle/paddle-catalog.service";
import { recordAudit } from "@/lib/server/lib/audit";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = requireAdminSync(await getAdmin(req), ["admin"]);
    const { id } = await params;
    productIdParamSchema.parse({ id });
    const body = await req.json();
    const parsed = updateProductSchema.parse(body);
    const product = await productService.updateProduct(id, parsed);
    if (product.paddleProductId) {
      try { await syncProductToPaddle(product.id); } catch (error) { console.warn(`[paddle] auto-sync failed for product ${product.id}:`, error instanceof Error ? error.message : error); }
    }
    const refreshed = await productService.getProductById(product.id);
    await recordAudit({ adminId: admin.id, action: "product.update", entity: "Product", entityId: product.id, metadata: { name: product.name, priceAmount: product.priceAmount }, ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() });
    return ok(refreshed);
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = requireAdminSync(await getAdmin(req), ["admin"]);
    const { id } = await params;
    productIdParamSchema.parse({ id });
    await productService.deleteProduct(id);
    await recordAudit({ adminId: admin.id, action: "product.delete", entity: "Product", entityId: id, ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() });
    return ok(null);
  } catch (e) {
    return fail(e);
  }
}
