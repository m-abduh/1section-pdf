import { NextRequest } from "next/server";
import { ok, fail, parseParams } from "@/lib/server/next-helpers";
import { nicheSlugParamSchema } from "@/lib/server/modules/niches/niche.schema";
import * as nicheService from "@/lib/server/modules/niches/niche.service";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    parseParams({ slug }, nicheSlugParamSchema);
    const niche = await nicheService.getNicheBySlug(slug);
    return ok(niche);
  } catch (e) {
    return fail(e);
  }
}
