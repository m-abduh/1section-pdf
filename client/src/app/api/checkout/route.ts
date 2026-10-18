import { NextRequest, NextResponse } from "next/server";
import { ok, fail, parseJson, rateLimit, clientIp } from "@/lib/server/next-helpers";
import { createCheckoutSchema } from "@/lib/server/modules/checkout/checkout.schema";
import * as checkoutService from "@/lib/server/modules/checkout/checkout.service";

export async function POST(req: NextRequest) {
  try {
    if (!rateLimit(`checkout:${clientIp(req)}`, 20, 60 * 1000)) {
      return NextResponse.json({ success: false, error: { code: "RATE_LIMITED", message: "Too many requests. Please try again later." } }, { status: 429 });
    }
    const body = await parseJson(req, createCheckoutSchema);
    const result = await checkoutService.createCheckout(body);
    return ok(result, 201);
  } catch (e) {
    return fail(e);
  }
}
