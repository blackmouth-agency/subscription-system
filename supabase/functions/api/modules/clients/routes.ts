import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { authHeaders, idParam } from "../../shared/schemas.ts";
import { createClientBody, updateClientBody } from "./schemas.ts";
import {
  authorizeAndCreate,
  authorizeAndList,
  authorizeAndUpdate,
  factory,
} from "./service.ts";

const headers = zValidator("header", authHeaders);

export const clients = new Hono()
  .get(
    "/",
    headers,
    authorizeAndList,
    ...factory.createHandlers((c) => c.json(c.var.clients)),
  )
  .post(
    "/",
    headers,
    zValidator("json", createClientBody),
    authorizeAndCreate,
    ...factory.createHandlers((c) => c.json(c.var.client, 201)),
  )
  .patch(
    "/:id",
    headers,
    zValidator("param", idParam),
    zValidator("json", updateClientBody),
    authorizeAndUpdate,
    ...factory.createHandlers((c) => c.json(c.var.client)),
  );
