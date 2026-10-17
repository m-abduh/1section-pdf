import { Router, type Request, type Response } from "express";
import { paddle, paddleWebhookSecret } from "../../lib/paddle";
import { ApiError } from "../../utils/api-error";
import { beginEvent, markFailed, markProcessed, processEvent } from "./webhook.service";

export const webhookRouter = Router();

webhookRouter.post("/paddle", async (req: Request, res: Response) => {
  const signature = req.headers["paddle-signature"];
  if (typeof signature !== "string" || !signature) {
    throw ApiError.badRequest("Missing Paddle-Signature header");
  }

  const rawBody = req.body as Buffer;
  if (!Buffer.isBuffer(rawBody)) {
    throw ApiError.badRequest("Webhook body must be raw");
  }

  let event;
  try {
    event = await paddle.webhooks.unmarshal(
      rawBody.toString("utf8"),
      paddleWebhookSecret,
      signature,
    );
  } catch {
    throw ApiError.badRequest("Invalid Paddle webhook signature");
  }

  const normalized = {
    eventId: event.eventId,
    eventType: event.eventType,
    data: event.data as unknown as Record<string, unknown>,
  };

  const { id, shouldProcess } = await beginEvent(normalized);
  if (!shouldProcess) {
    res.json({ success: true, data: { received: true, duplicate: true } });
    return;
  }

  try {
    await processEvent(normalized);
    await markProcessed(id);
  } catch (error) {
    // Mark as failed and return 5xx so Paddle retries delivery.
    await markFailed(id, error);
    console.error(
      `[webhook] processing failed for ${normalized.eventId}:`,
      error instanceof Error ? error.message : error,
    );
    throw ApiError.internal("Webhook processing failed");
  }

  res.json({ success: true, data: { received: true } });
});
