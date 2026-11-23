import { z } from "zod";

export const listInstallments = z.object({
  client_id: z.string().uuid().optional(),
  product_id: z.string().uuid().optional(),
  from: z.string().date().optional(),
  to: z.string().date().optional(),
  status: z.enum(["to_activate", "pending", "overdue", "paid", "voided"])
    .optional(),
}).refine((q) => !q.from || !q.to || q.from <= q.to, { path: ["from"] });
