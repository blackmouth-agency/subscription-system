import { z } from "zod";

// El cliente envía su JWT y la apikey (clave publicable) en cada llamada.
export const authHeaders = z.object({
  authorization: z.string().startsWith("Bearer "),
  apikey: z.string().min(1),
});

export const createProduct = z.object({
  name: z.string().trim().min(1).max(100),
  description: z.string().max(500).default(""),
  price: z.number().int().positive(),
});
