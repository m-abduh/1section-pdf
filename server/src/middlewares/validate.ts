import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";
import { ApiError } from "../utils/api-error";

interface ValidationSchemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

export function validate(schemas: ValidationSchemas) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (schemas.params) {
      const result = schemas.params.safeParse(req.params);
      if (!result.success) {
        throw ApiError.badRequest("Invalid path parameters", result.error.flatten());
      }
      req.params = result.data as Request["params"];
    }

    if (schemas.query) {
      const result = schemas.query.safeParse(req.query);
      if (!result.success) {
        throw ApiError.badRequest("Invalid query parameters", result.error.flatten());
      }
      Object.assign(req.query, result.data);
    }

    if (schemas.body) {
      const result = schemas.body.safeParse(req.body);
      if (!result.success) {
        throw ApiError.badRequest("Invalid request body", result.error.flatten());
      }
      req.body = result.data;
    }

    next();
  };
}
