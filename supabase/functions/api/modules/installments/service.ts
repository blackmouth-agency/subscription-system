import { createFactory } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { adminDb } from "../../shared/admin-db.ts";

type Query = {
  client_id?: string;
  product_id?: string;
  status?: string;
  q?: string;
  from?: string;
  to?: string;
  page: number;
  size: number;
};

const factory = createFactory<{ Variables: { result: unknown } }>();

// authorize + execute: una RPC de lectura que filtra, pagina y suma en la
// base con el JWT del usuario (RLS). Los cálculos viven en SQL, no aquí.
const read = (name: string, args: (q: Query) => object = () => ({})) =>
  factory.createMiddleware(async (c, next) => {
    const { authorization, apikey } = c.req.valid("header" as never);
    const q = c.req.valid("query" as never) as Query;
    const db = await adminDb(authorization, apikey);
    const { data, error } = await db.rpc(name, args(q));
    if (error) throw new HTTPException(500, { message: "Error interno." });
    c.set("result", data);
    await next();
  });

const filters = (q: Query) => ({
  p_client_id: q.client_id,
  p_product_id: q.product_id,
  p_status: q.status,
  p_q: q.q,
});
const page = (q: Query) => ({
  p_limit: q.size,
  p_offset: (q.page - 1) * q.size,
});

export const service = {
  factory,
  authorizeAndList: read("list_collections", (q) => ({
    ...filters(q),
    p_from: q.from,
    p_to: q.to,
    ...page(q),
  })),
  authorizeAndMap: read("list_collections_map", (q) => ({
    ...filters(q),
    ...page(q),
  })),
  authorizeAndListPayable: read("list_payable"),
  authorizeAndListOptions: read("list_collection_options"),
};
