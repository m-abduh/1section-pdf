import { NextRequest } from "next/server";
import { ok, fail, getAdmin, requireAdminSync } from "@/lib/server/next-helpers";
import * as nicheService from "@/lib/server/modules/niches/niche.service";
import { createNicheSchema } from "@/lib/server/modules/niches/niche.schema";
import { recordAudit } from "@/lib/server/lib/audit";

export async function GET(req: NextRequest) {
  try {
    requireAdminSync(await getAdmin(req), ["admin"]);
    const niches = await nicheService.listAdminNiches();
    return ok(niches);
  } catch (e) {
    return fail(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const admin = requireAdminSync(await getAdmin(req), ["admin"]);
    const body = await req.json();
    const parsed = createNicheSchema.parse(body);
    const niche = await nicheService.createNiche(parsed);
    await recordAudit({ adminId: admin.id, action: "niche.create", entity: "Niche", entityId: niche.id, metadata: { slug: niche.slug, name: niche.name }, ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() });
    return ok(niche, 201);
  } catch (e) {
    return fail(e);
  }
}
