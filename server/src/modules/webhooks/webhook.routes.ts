import { Router, type Request, type Response } from "express";
import { paddle, paddleWebhookSecret } from "../../lib/paddle";
import { ApiError } from "../../utils/api-error";
import { handlePaddleEvent, recordWebhookEvent } from "./webhook.service";

export const webhookRouter = Router();

webhookRouter.post(
  "/paddle",
  async (req: Request, res: Response) => {
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

    const isNew = await recordWebhookEvent(normalized);
    if (!isNew) {
      res.json({ success: true, data: { received: true, duplicate: true } });
      return;
    }

    await handlePaddleEvent(normalized);
    res.json({ success: true, data: { received: true } });
  },
);
