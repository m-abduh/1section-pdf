export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(
    statusCode: number,
    message: string,
    options: { code?: string; details?: unknown } = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = options.code ?? "ERROR";
    this.details = options.details;
  }

  static badRequest(message: string, details?: unknown) {
    return new ApiError(400, message, { code: "BAD_REQUEST", details });
  }

  static unauthorized(message = "Unauthorized") {
    return new ApiError(401, message, { code: "UNAUTHORIZED" });
  }

  static forbidden(message = "Forbidden") {
    return new ApiError(403, message, { code: "FORBIDDEN" });
  }

  static notFound(message = "Resource not found") {
    return new ApiError(404, message, { code: "NOT_FOUND" });
  }

  static conflict(message: string, details?: unknown) {
    return new ApiError(409, message, { code: "CONFLICT", details });
  }
}
