import { z } from "zod";
import { updateBody } from "../../shared/schemas.ts";

const partnerFields = {
  partner_id: z.string().uuid().nullable(),
  commission: z.number().int().min(0),
  commission_type: z.enum(["indefinite", "months", "once"]),
  commission_months: z.number().int().positive().nullable(),
  receiver: z.enum(["agency", "partner"]),
};

// `commission_months` solo vale con la duración `months`.
const monthsOnlyWithMonths = (b: {
  commission_type?: string;
  commission_months?: number | null;
}) => b.commission_months == null || b.commission_type === "months";
const monthsMessage = { path: ["commission_months"] };

export const createSubscription = z.object({
  client_id: z.string().uuid(),
  product_id: z.string().uuid(),
  price: z.number().int().positive(),
  cycle_date: z.string().date().optional(),
  ...z.object(partnerFields).partial().shape,
}).refine(monthsOnlyWithMonths, monthsMessage);

export const updateSubscription = updateBody(partnerFields)
  .refine(monthsOnlyWithMonths, monthsMessage)
  // Al dejar `months`, la cantidad se borra para no violar el check.
  .transform((b) =>
    b.commission_type && b.commission_type !== "months"
      ? { ...b, commission_months: null }
      : b
  );

export const listSubscriptions = z.object({
  client_id: z.string().uuid().optional(),
});
