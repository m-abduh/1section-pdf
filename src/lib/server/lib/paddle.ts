import { Environment, Paddle } from "@paddle/paddle-node-sdk";
import { env } from "../config/env";

export const paddle = new Paddle(env.PADDLE_API_KEY, {
  environment:
    env.PADDLE_ENV === "production"
      ? Environment.production
      : Environment.sandbox,
});

export const paddleWebhookSecret = env.PADDLE_WEBHOOK_SECRET;
