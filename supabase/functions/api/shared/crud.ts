import { Hono } from "hono";
import { createFactory } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { zValidator } from "@hono/zod-validator";
import type { ZodType } from "zod";
import { adminDb } from "./admin-db.ts";
import { authHeaders, idParam } from "./schemas.ts";

const internalError = () =>
  new HTTPException(500, { message: "Error interno." });

// `authorize` + `execute` de una tabla de admin: lista, crea y edita. La RLS
// decide quién puede; `notFound` es el mensaje del 404 al editar.
export function crudService<Row>(
  { table, notFound }: { table: string; notFound: string },
) {
  const factory = createFactory<{ Variables: { rows: Row[]; row: Row } }>();

  const authorizeAndList = factory.createMiddleware(async (c, next) => {
    const { authorization, apikey } = c.req.valid("header" as never);
    const db = await adminDb(authorization, apikey);
    const { data, error } = await db.from(table).select("*").order("name");
    if (error) throw internalError();
    c.set("rows", data);
    await next();
  });

  const authorizeAndCreate = factory.createMiddleware(async (c, next) => {
    const { authorization, apikey } = c.req.valid("header" as never);
    const body = c.req.valid("json" as never);
    const db = await adminDb(authorization, apikey);
    const { data, error } = await db.from(table).insert(body).select()
      .single();
    if (error) throw internalError();
    c.set("row", data);
    await next();
  });

  const authorizeAndUpdate = factory.createMiddleware(async (c, next) => {
    const { authorization, apikey } = c.req.valid("header" as never);
    const { id } = c.req.valid("param" as never);
    const body = c.req.valid("json" as never);
    const db = await adminDb(authorization, apikey);
    const { data, error } = await db.from(table).update(body).eq("id", id)
      .select();
    if (error) throw internalError();
    if (data.length === 0) throw new HTTPException(404, { message: notFound });
    c.set("row", data[0]);
    await next();
  });

  return { factory, authorizeAndList, authorizeAndCreate, authorizeAndUpdate };
}

// Rutas `GET /`, `POST /` y, si hay `update`, `PATCH /:id`:
// validate -> authorize + execute -> respond.
export function crudRoutes<Row>(
  service: ReturnType<typeof crudService<Row>>,
  schemas: { create: ZodType; update?: ZodType },
): Hono {
  const headers = zValidator("header", authHeaders);
  const { factory } = service;
  const app: Hono = new Hono()
    .get(
      "/",
      headers,
      service.authorizeAndList,
      ...factory.createHandlers((c) => c.json(c.var.rows)),
    )
    .post(
      "/",
      headers,
      zValidator("json", schemas.create),
      service.authorizeAndCreate,
      ...factory.createHandlers((c) => c.json(c.var.row, 201)),
    );
  if (schemas.update) {
    app.patch(
      "/:id",
      headers,
      zValidator("param", idParam),
      zValidator("json", schemas.update),
      service.authorizeAndUpdate,
      ...factory.createHandlers((c) => c.json(c.var.row)),
    );
  }
  return app;
}
