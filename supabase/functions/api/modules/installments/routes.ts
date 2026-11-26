import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { authHeaders } from "../../shared/schemas.ts";
import { listInstallments, mapInstallments } from "./schemas.ts";
import { service } from "./service.ts";

const headers = zValidator("header", authHeaders);
const respond = service.factory.createHandlers((c) => c.json(c.var.result));

export const installments = new Hono()
  .get(
    "/",
    headers,
    zValidator("query", listInstallments),
    service.authorizeAndList,
    ...respond,
  )
  .get(
    "/map",
    headers,
    zValidator("query", mapInstallments),
    service.authorizeAndMap,
    ...respond,
  )
  .get("/payable", headers, service.authorizeAndListPayable, ...respond)
  .get("/options", headers, service.authorizeAndListOptions, ...respond);
