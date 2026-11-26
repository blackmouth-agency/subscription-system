import { z } from "zod";

const filters = {
  client_id: z.string().uuid().optional(),
  product_id: z.string().uuid().optional(),
  status: z.enum(["paid", "pending", "overdue"]).optional(),
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  size: z.coerce.number().int().min(1).max(100).default(10),
};

export const listInstallments = z.object({
  ...filters,
  from: z.string().date().optional(),
  to: z.string().date().optional(),
}).refine((q) => !q.from || !q.to || q.from <= q.to, { path: ["from"] });

export const mapInstallments = z.object(filters);
