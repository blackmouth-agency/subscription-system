import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { authHeaders, createProduct } from "./schemas.ts";
import { authorizeAndCreate, authorizeAndList, factory } from "./service.ts";

const headers = zValidator("header", authHeaders);

export const products = new Hono()
  .get(
    "/",
    headers,
    authorizeAndList,
    ...factory.createHandlers((c) => c.json(c.var.products)),
  )
  .post(
    "/",
    headers,
    zValidator("json", createProduct),
    authorizeAndCreate,
    ...factory.createHandlers((c) => c.json(c.var.product, 201)),
  );
