import type { AdminUser } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      admin?: Pick<AdminUser, "id" | "email" | "name" | "role">;
    }
  }
}

export {};
