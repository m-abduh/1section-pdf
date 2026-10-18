import { randomBytes, randomInt } from "node:crypto";

export function generateOrderNumber(): string {
  const now = new Date();
  const datePart = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");
  const randomPart = String(randomInt(0, 1_000_000)).padStart(6, "0");
  return `ORD-${datePart}-${randomPart}`;
}

export function generateSecureToken(bytes = 24): string {
  return randomBytes(bytes).toString("hex");
}
