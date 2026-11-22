import { z } from "zod";

export const createSubscription = z.object({
  client_id: z.string().uuid(),
  product_id: z.string().uuid(),
  price: z.number().int().positive(),
  cycle_date: z.string().date().optional(),
});

export const listSubscriptions = z.object({
  client_id: z.string().uuid().optional(),
});
