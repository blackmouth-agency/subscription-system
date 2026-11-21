import { createFactory } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { adminDb } from "../../shared/admin-db.ts";

type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  is_active: boolean;
  created_at: string;
};
type Env = {
  Variables: { products: Product[]; product: Product };
};

export const factory = createFactory<Env>();

export const authorizeAndList = factory.createMiddleware(async (c, next) => {
  const { authorization, apikey } = c.req.valid("header" as never);
  const db = await adminDb(authorization, apikey);
  const { data, error } = await db.from("products").select("*").order("name");
  if (error) throw new HTTPException(500, { message: "Error interno." });
  c.set("products", data);
  await next();
});

export const authorizeAndCreate = factory.createMiddleware(async (c, next) => {
  const { authorization, apikey } = c.req.valid("header" as never);
  const body = c.req.valid("json" as never);
  const db = await adminDb(authorization, apikey);
  const { data, error } = await db.from("products").insert(body).select()
    .single();
  if (error) throw new HTTPException(500, { message: "Error interno." });
  c.set("product", data);
  await next();
});
