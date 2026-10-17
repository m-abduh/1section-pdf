import { z } from "zod";

export const productFileSchema = z.object({
  name: z.string().min(1).max(200),
  fileUrl: z.string().min(1).max(1000),
});

export const createProductSchema = z.object({
  nicheId: z.string().min(1),
  slug: z
    .string()
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers and hyphens")
    .optional(),
  name: z.string().min(2).max(160),
  summary: z.string().max(300).optional().nullable(),
  description: z.string().max(20000).optional().nullable(),
  coverImage: z.string().max(500).optional().nullable(),
  priceAmount: z.number().int().min(0),
  compareAtAmount: z.number().int().min(0).optional().nullable(),
  currency: z.string().length(3).optional(),
  paddlePriceId: z.string().max(120).optional().nullable(),
  features: z.array(z.string().min(1).max(200)).max(30).optional(),
  files: z.array(productFileSchema).max(50).optional(),
  active: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const productSlugParamSchema = z.object({
  slug: z.string().min(1),
});

export const productIdParamSchema = z.object({
  id: z.string().min(1),
});

export const listProductsQuerySchema = z.object({
  niche: z.string().optional(),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
