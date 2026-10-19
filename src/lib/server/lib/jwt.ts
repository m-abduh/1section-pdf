import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { ApiError } from "../utils/api-error";

export interface AuthTokenPayload {
  sub: string;
  email: string;
  role: string;
  tokenVersion: number;
}

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

export function verifyAuthToken(token: string): AuthTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as jwt.JwtPayload;
    return {
      sub: String(decoded.sub),
      email: String(decoded.email ?? ""),
      role: String(decoded.role ?? "admin"),
      tokenVersion:
        typeof decoded.tokenVersion === "number" ? decoded.tokenVersion : 0,
    };
  } catch {
    throw ApiError.unauthorized("Invalid or expired token");
  }
}
