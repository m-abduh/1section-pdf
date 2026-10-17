import { z } from "zod";

export const createCheckoutSchema = z.object({
  productId: z.string().min(1),
  email: z.string().email().optional(),
});

export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;
