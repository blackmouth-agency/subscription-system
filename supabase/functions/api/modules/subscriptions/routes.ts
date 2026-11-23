import { zValidator } from "@hono/zod-validator";
import { crudRoutes } from "../../shared/crud.ts";
import { authHeaders, idParam } from "../../shared/schemas.ts";
import {
  changeStatus,
  createPayment,
  createSubscription,
  listSubscriptions,
  paymentHeaders,
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
).post(
  "/:id/payments",
  zValidator("header", paymentHeaders),
  zValidator("param", idParam),
  zValidator("json", createPayment),
  service.authorizeAndPay,
  ...service.paymentFactory.createHandlers((c) => c.json(c.var.payment, 201)),
);
