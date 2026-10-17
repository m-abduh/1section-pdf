import rateLimit, { type Options } from "express-rate-limit";
import { env } from "../config/env";

const defaults: Partial<Options> = {
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.RATE_LIMIT_DISABLED,
  message: {
    success: false,
    error: {
      code: "RATE_LIMITED",
      message: "Too many requests. Please try again later.",
    },
  },
  validate: { trustProxy: false },
};

export const loginLimiter = rateLimit({
  ...defaults,
  windowMs: 15 * 60 * 1000,
  limit: 10,
});

export const checkoutLimiter = rateLimit({
  ...defaults,
  windowMs: 60 * 1000,
  limit: 20,
});

export const orderStatusLimiter = rateLimit({
  ...defaults,
  windowMs: 60 * 1000,
  limit: 30,
});

export const accessLinkLimiter = rateLimit({
  ...defaults,
  windowMs: 60 * 60 * 1000,
  limit: 5,
});

export const downloadLimiter = rateLimit({
  ...defaults,
  windowMs: 60 * 1000,
  limit: 60,
});

export const uploadLimiter = rateLimit({
  ...defaults,
  windowMs: 60 * 60 * 1000,
  limit: 120,
});
