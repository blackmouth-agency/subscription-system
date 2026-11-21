import { z } from "zod";

export const createProduct = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().max(500).default(""),
  price: z.number().int().positive(),
});
