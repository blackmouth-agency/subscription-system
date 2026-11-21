import { z } from "zod";
import {
  contactCreate,
  contactFields,
  updateBody,
} from "../../shared/schemas.ts";

const partnerFields = {
  receiving_account: z.string().trim().max(200),
  is_active: z.boolean(),
};

export const createPartnerBody = z.object({
  ...contactCreate,
  receiving_account: partnerFields.receiving_account.default(""),
  is_active: partnerFields.is_active.default(true),
});

export const updatePartnerBody = updateBody({
  ...contactFields,
  ...partnerFields,
});
