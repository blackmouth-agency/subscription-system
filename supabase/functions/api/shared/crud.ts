import { Hono } from "hono";
import { createFactory } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { zValidator } from "@hono/zod-validator";
import { z, type ZodType } from "zod";
import { adminDb } from "./admin-db.ts";
import { authHeaders, idParam } from "./schemas.ts";

const internalError = () =>
  new HTTPException(500, { message: "Error interno." });

// P0409: conflicto lanzado por un trigger; 23514: viola un check.
const writeError = (error: { code?: string; message: string }) =>
  error.code === "P0409"
    ? new HTTPException(409, { message: error.message })
    : error.code === "23514"
    ? new HTTPException(400, { message: "Datos inválidos." })
    : internalError();

// Constraint de FK -> mensaje 404.
const fkError = (
  error: { code?: string; message: string },
  fkNotFound: Record<string, string>,
) => {
  const key = error.code === "23503" &&
    Object.keys(fkNotFound).find((k) => error.message.includes(k));
  return key ? new HTTPException(404, { message: fkNotFound[key] }) : undefined;
};

// `authorize` + `execute` de una tabla de admin: lista, crea y edita. La RLS
// decide quién puede; `notFound` es el mensaje del 404 al editar. Opcionales:
// `select` (con joins), `order`, `filters` (query params que filtran con `eq`)
// y `fkNotFound` (constraint de FK -> mensaje 404 al crear).
export function crudService<Row>(
  {
    table,
    notFound,
    select = "*",
    order = ["name", true],
    filters = [],
    fkNotFound = {},
  }: {
    table: string;
    notFound: string;
    select?: string;
    order?: [string, boolean];
    filters?: string[];
    fkNotFound?: Record<string, string>;
  },
) {
  const factory = createFactory<{ Variables: { rows: Row[]; row: Row } }>();

  const authorizeAndList = factory.createMiddleware(async (c, next) => {
    const { authorization, apikey } = c.req.valid("header" as never);
    const db = await adminDb(authorization, apikey);
    const query = (c.req.valid("query" as never) ?? {}) as Record<
      string,
      string
    >;
    let list = db.from(table).select(select).order(order[0], {
      ascending: order[1],
    });
    for (const column of filters) {
      if (query[column]) list = list.eq(column, query[column]);
    }
    const { data, error } = await list;
    if (error) throw internalError();
    // `select` es dinámico: supabase-js no infiere el tipo de la fila.
    c.set("rows", data as unknown as Row[]);
    await next();
  });

  const authorizeAndCreate = factory.createMiddleware(async (c, next) => {
    const { authorization, apikey } = c.req.valid("header" as never);
    const body = c.req.valid("json" as never);
    const db = await adminDb(authorization, apikey);
    const { data, error } = await db.from(table).insert(body).select(select)
      .single();
    if (error) throw fkError(error, fkNotFound) ?? writeError(error);
    c.set("row", data as unknown as Row);
    await next();
  });

  const authorizeAndUpdate = factory.createMiddleware(async (c, next) => {
    const { authorization, apikey } = c.req.valid("header" as never);
    const { id } = c.req.valid("param" as never);
    const body = c.req.valid("json" as never);
    const db = await adminDb(authorization, apikey);
    const { data, error } = await db.from(table).update(body).eq("id", id)
      .select(select);
    if (error) throw fkError(error, fkNotFound) ?? writeError(error);
    if (data.length === 0) throw new HTTPException(404, { message: notFound });
    c.set("row", data[0] as unknown as Row);
    await next();
  });

  return { factory, authorizeAndList, authorizeAndCreate, authorizeAndUpdate };
}

// Rutas `GET /`, `POST /` y, si hay `update`, `PATCH /:id`:
// validate -> authorize + execute -> respond.
export function crudRoutes<Row>(
  service: ReturnType<typeof crudService<Row>>,
  schemas: { create: ZodType; update?: ZodType; query?: ZodType },
): Hono {
  const headers = zValidator("header", authHeaders);
  const { factory } = service;
  const app: Hono = new Hono()
    .get(
      "/",
      headers,
      zValidator("query", schemas.query ?? z.object({})),
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
