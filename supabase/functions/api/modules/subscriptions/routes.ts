import { crudRoutes } from "../../shared/crud.ts";
import { createSubscription, listSubscriptions } from "./schemas.ts";
import { service } from "./service.ts";

export const subscriptions = crudRoutes(service, {
  create: createSubscription,
  query: listSubscriptions,
});
