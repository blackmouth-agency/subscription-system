import { z } from "zod";

// El cliente envía su JWT y la apikey (clave publicable) en cada llamada.
export const authHeaders = z.object({
  authorization: z.string().startsWith("Bearer "),
  apikey: z.string().min(1),
});

export const idParam = z.object({ id: z.string().uuid() });
