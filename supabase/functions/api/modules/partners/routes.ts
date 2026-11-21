import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { authHeaders, idParam } from "../../shared/schemas.ts";
import { createPartnerBody, updatePartnerBody } from "./schemas.ts";
import {
  authorizeAndCreate,
  authorizeAndList,
  authorizeAndUpdate,
  factory,
} from "./service.ts";

const headers = zValidator("header", authHeaders);

export const partners = new Hono()
  .get(
    "/",
    headers,
    authorizeAndList,
    ...factory.createHandlers((c) => c.json(c.var.partners)),
  )
  .post(
    "/",
    headers,
    zValidator("json", createPartnerBody),
    authorizeAndCreate,
    ...factory.createHandlers((c) => c.json(c.var.partner, 201)),
  )
  .patch(
    "/:id",
    headers,
    zValidator("param", idParam),
    zValidator("json", updatePartnerBody),
    authorizeAndUpdate,
    ...factory.createHandlers((c) => c.json(c.var.partner)),
  );
