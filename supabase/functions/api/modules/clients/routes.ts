import { crudRoutes } from "../../shared/crud.ts";
import { createClientBody, updateClientBody } from "./schemas.ts";
import { service } from "./service.ts";

export const clients = crudRoutes(service, {
  create: createClientBody,
  update: updateClientBody,
});
