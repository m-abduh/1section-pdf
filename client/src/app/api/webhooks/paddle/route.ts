import { NextRequest, NextResponse } from "next/server";
import { paddle, paddleWebhookSecret } from "@/lib/server/lib/paddle";
import { ApiError } from "@/lib/server/utils/api-error";
import { beginEvent, markFailed, markProcessed, processEvent } from "@/lib/server/modules/webhooks/webhook.service";

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get("paddle-signature");
    if (!signature) {
      throw new ApiError(400, "Missing Paddle-Signature header", { code: "BAD_REQUEST" });
    }
    const rawBody = await req.text();
    let event;
    try {
      event = await paddle.webhooks.unmarshal(rawBody, paddleWebhookSecret, signature);
    } catch {
      throw new ApiError(400, "Invalid Paddle webhook signature", { code: "BAD_REQUEST" });
    }

    const normalized = {
      eventId: event.eventId,
      eventType: event.eventType,
      data: event.data as unknown as Record<string, unknown>,
    };

    const { id, shouldProcess } = await beginEvent(normalized);
    if (!shouldProcess) {
      return NextResponse.json({ success: true, data: { received: true, duplicate: true } });
    }

    try {
      await processEvent(normalized);
      await markProcessed(id);
    } catch (error) {
      await markFailed(id, error);
      console.error(
        `[webhook] processing failed for ${normalized.eventId}:`,
        error instanceof Error ? error.message : error,
      );
      throw new ApiError(500, "Webhook processing failed", { code: "INTERNAL_ERROR" });
    }

    return NextResponse.json({ success: true, data: { received: true } });
  } catch (e) {
    if (e instanceof ApiError) {
      return NextResponse.json({ success: false, error: { code: e.code ?? "ERROR", message: e.message } }, { status: e.statusCode });
    }
    console.error("[webhook] unhandled:", e);
    return NextResponse.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Internal server error" } }, { status: 500 });
  }
}
