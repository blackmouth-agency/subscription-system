import { z } from "zod";
import {
  contactCreate,
  contactFields,
  updateBody,
} from "../../shared/schemas.ts";

export const createClientBody = z.object(contactCreate);

export const updateClientBody = updateBody(contactFields);
