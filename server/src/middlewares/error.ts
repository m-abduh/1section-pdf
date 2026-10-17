import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { ApiError } from "../utils/api-error";
import { isProduction } from "../config/env";

export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details ?? undefined,
      },
    });
  }

  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: error.flatten(),
      },
    });
  }

  const message =
    error instanceof Error ? error.message : "Unexpected server error";

  if (!isProduction) {
    console.error(error);
  } else {
    console.error(`[error] ${message}`);
  }

  return res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message: isProduction ? "Internal server error" : message,
    },
  });
}
