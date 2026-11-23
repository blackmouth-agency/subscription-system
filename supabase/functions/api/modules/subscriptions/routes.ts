import { zValidator } from "@hono/zod-validator";
import { crudRoutes } from "../../shared/crud.ts";
import { authHeaders, idParam } from "../../shared/schemas.ts";
import {
  changeStatus,
  createSubscription,
  listSubscriptions,
  updateSubscription,
} from "./schemas.ts";
import { service } from "./service.ts";

export const subscriptions = crudRoutes(service, {
  create: createSubscription,
  update: updateSubscription,
  query: listSubscriptions,
}).post(
  "/:id/status",
  zValidator("header", authHeaders),
  zValidator("param", idParam),
  zValidator("json", changeStatus),
  service.authorizeAndChangeStatus,
  ...service.statusFactory.createHandlers((c) => c.json(c.var.row)),
).get(
  "/:id/history",
  zValidator("header", authHeaders),
  zValidator("param", idParam),
  service.authorizeAndListHistory,
  ...service.historyFactory.createHandlers((c) => c.json(c.var.history)),
).get(
  "/:id/installments",
  zValidator("header", authHeaders),
  zValidator("param", idParam),
  service.authorizeAndListInstallments,
  ...service.installmentsFactory.createHandlers((c) =>
    c.json(c.var.installments)
  ),
);
