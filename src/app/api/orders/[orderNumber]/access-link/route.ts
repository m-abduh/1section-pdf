import { NextRequest, NextResponse } from "next/server";
import { ok, fail, parseParams, rateLimit, clientIp } from "@/lib/server/next-helpers";
import { orderStatusLookupSchema, accessLinkRequestSchema } from "@/lib/server/modules/orders/order.schema";
import * as orderService from "@/lib/server/modules/orders/order.service";

export async function POST(req: NextRequest, { params }: { params: Promise<{ orderNumber: string }> }) {
  try {
    const { orderNumber } = await params;
    parseParams({ orderNumber }, orderStatusLookupSchema);
    if (!rateLimit(`accesslink:${clientIp(req)}`, 5, 60 * 60 * 1000)) {
      return NextResponse.json({ success: false, error: { code: "RATE_LIMITED", message: "Too many requests. Please try again later." } }, { status: 429 });
    }
    const body = await req.json().catch(() => ({}));
    const parsed = accessLinkRequestSchema.parse(body);
    await orderService.requestAccessLink(orderNumber, parsed.email);
    return ok({ sent: true, message: "If the details match, an access link is on its way." });
  } catch (e) {
    return fail(e);
  }
}
