
import { ok, fail } from "@/lib/server/next-helpers";
import * as nicheService from "@/lib/server/modules/niches/niche.service";

export async function GET() {
  try {
    const niches = await nicheService.listPublicNiches();
    return ok(niches);
  } catch (e) {
    return fail(e);
  }
}
