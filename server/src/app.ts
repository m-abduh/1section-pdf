import cors, { type CorsOptions } from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { corsOrigins, env, isProduction } from "./config/env";
import { errorHandler, notFoundHandler } from "./middlewares/error";
import { uploadDir } from "./modules/downloads/download.service";
import { webhookRouter } from "./modules/webhooks/webhook.routes";
import { apiRouter } from "./routes";

function isAllowedOrigin(origin?: string): boolean {
  if (!origin) return true;
  if (corsOrigins.includes(origin)) return true;

  try {
    const { hostname } = new URL(origin);
    if (hostname === "localhost" || hostname.endsWith(".localhost")) return true;
    if (hostname === env.ROOT_DOMAIN) return true;
    if (hostname.endsWith(`.${env.ROOT_DOMAIN}`)) return true;
  } catch {
    return false;
  }

  return false;
}

const corsOptions: CorsOptions = {
  origin(origin, callback) {
    if (isAllowedOrigin(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`Origin not allowed by CORS: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
};

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cors(corsOptions));
  app.use(morgan(isProduction ? "combined" : "dev"));

  app.use(
    "/api/webhooks",
    express.raw({ type: "application/json", limit: "1mb" }),
    webhookRouter,
  );

  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.use("/uploads", express.static(uploadDir, { fallthrough: true }));

  app.use("/api", apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
