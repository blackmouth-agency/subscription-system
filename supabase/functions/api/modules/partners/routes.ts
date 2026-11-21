import { crudRoutes } from "../../shared/crud.ts";
import { createPartnerBody, updatePartnerBody } from "./schemas.ts";
import { service } from "./service.ts";

export const partners = crudRoutes(service, {
  create: createPartnerBody,
  update: updatePartnerBody,
});
