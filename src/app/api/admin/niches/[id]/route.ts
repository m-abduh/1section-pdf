import { NextRequest } from "next/server";
import { ok, fail, getAdmin, requireAdminSync } from "@/lib/server/next-helpers";
import * as nicheService from "@/lib/server/modules/niches/niche.service";
import { updateNicheSchema, nicheIdParamSchema } from "@/lib/server/modules/niches/niche.schema";
import { recordAudit } from "@/lib/server/lib/audit";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = requireAdminSync(await getAdmin(req), ["admin"]);
    const { id } = await params;
    nicheIdParamSchema.parse({ id });
    const body = await req.json();
    const parsed = updateNicheSchema.parse(body);
    const niche = await nicheService.updateNiche(id, parsed);
    await recordAudit({ adminId: admin.id, action: "niche.update", entity: "Niche", entityId: niche.id, metadata: { slug: niche.slug, name: niche.name }, ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() });
    return ok(niche);
  } catch (e) {
    return fail(e);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = requireAdminSync(await getAdmin(req), ["admin"]);
    const { id } = await params;
    nicheIdParamSchema.parse({ id });
    await nicheService.deleteNiche(id);
    await recordAudit({ adminId: admin.id, action: "niche.delete", entity: "Niche", entityId: id, ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() });
    return ok(null);
  } catch (e) {
    return fail(e);
  }
}
