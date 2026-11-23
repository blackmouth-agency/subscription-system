import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { authHeaders } from "../../shared/schemas.ts";
import { listInstallments } from "./schemas.ts";
import { service } from "./service.ts";

export const installments = new Hono().get(
  "/",
  zValidator("header", authHeaders),
  zValidator("query", listInstallments),
  service.authorizeAndList,
  ...service.factory.createHandlers((c) => c.json(c.var.collections)),
);
