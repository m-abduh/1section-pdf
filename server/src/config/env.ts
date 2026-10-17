import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z.coerce.number().int().positive().default(4000),

  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

  CLIENT_URL: z.string().url().default("http://localhost:3000"),
  APP_URL: z.string().url().optional(),
  ROOT_DOMAIN: z.string().default("1section.com"),
  CORS_ORIGINS: z.string().default("http://localhost:3000"),

  JWT_SECRET: z.string().min(16, "JWT_SECRET must be at least 16 characters"),
  JWT_EXPIRES_IN: z.string().default("7d"),

  PADDLE_ENV: z.enum(["sandbox", "production"]).default("sandbox"),
  PADDLE_API_KEY: z.string().min(1, "PADDLE_API_KEY is required"),
  PADDLE_WEBHOOK_SECRET: z.string().min(1, "PADDLE_WEBHOOK_SECRET is required"),
  PADDLE_TAX_CATEGORY: z.string().default("standard"),

  DOWNLOAD_TOKEN_TTL_HOURS: z.coerce.number().int().positive().default(72),
  DOWNLOAD_MAX_HITS: z.coerce.number().int().positive().default(5),
  DOWNLOAD_SIGNED_URL_TTL_MINUTES: z.coerce.number().int().positive().default(10),
  ACCESS_LINK_TTL_MINUTES: z.coerce.number().int().positive().default(60),

  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CLOUDINARY_FOLDER: z.string().default("1section/bundles"),

  EMAIL_PROVIDER: z.enum(["resend", "log"]).default("resend"),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("1section <no-reply@1section.com>"),

  RATE_LIMIT_DISABLED: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(`Invalid environment configuration:\n${issues}`);
}

export const env = parsed.data;

export const corsOrigins = env.CORS_ORIGINS.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

export const isProduction = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";

export const appUrl = env.APP_URL ?? env.CLIENT_URL;

export const cloudinaryConfig = {
  cloudName: env.CLOUDINARY_CLOUD_NAME,
  apiKey: env.CLOUDINARY_API_KEY,
  apiSecret: env.CLOUDINARY_API_SECRET,
  folder: env.CLOUDINARY_FOLDER,
};

export const hasCloudinary = Boolean(
  env.CLOUDINARY_CLOUD_NAME &&
    env.CLOUDINARY_API_KEY &&
    env.CLOUDINARY_API_SECRET,
);
