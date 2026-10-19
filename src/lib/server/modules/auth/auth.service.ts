import bcrypt from "bcryptjs";
import type { AdminUser } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { signAuthToken } from "../../lib/jwt";
import { ApiError } from "../../utils/api-error";
import type { LoginInput } from "./auth.schema";

export interface AuthResult {
  token: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
  };
}

function toPublicUser(user: AdminUser): AuthResult["user"] {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await prisma.adminUser.findUnique({
    where: { email: input.email.toLowerCase() },
  });

  if (!user || !user.isActive) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
  if (!passwordMatches) {
    throw ApiError.unauthorized("Invalid email or password");
  }

  const token = signAuthToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    tokenVersion: user.tokenVersion,
  });

  return { token, user: toPublicUser(user) };
}

export async function getProfile(userId: string): Promise<AuthResult["user"]> {
  const user = await prisma.adminUser.findUnique({ where: { id: userId } });
  if (!user || !user.isActive) {
    throw ApiError.notFound("Admin user not found");
  }
  return toPublicUser(user);
}

export async function revokeSessions(userId: string): Promise<void> {
  await prisma.adminUser.update({
    where: { id: userId },
    data: { tokenVersion: { increment: 1 } },
  });
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}
