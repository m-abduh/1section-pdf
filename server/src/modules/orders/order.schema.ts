import { z } from "zod";

export const orderStatusLookupSchema = z.object({
  orderNumber: z.string().min(1),
});

export const orderStatusQuerySchema = z.object({
  email: z.string().email().optional(),
  access: z.string().min(1).optional(),
});

export const accessLinkRequestSchema = z.object({
  email: z.string().email(),
});

export const adminOrderListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z
    .enum([
      "PENDING",
      "PAID",
      "FAILED",
      "CANCELED",
      "PARTIALLY_REFUNDED",
      "REFUNDED",
    ])
    .optional(),
  search: z.string().optional(),
});

export const orderIdParamSchema = z.object({
  id: z.string().min(1),
});
