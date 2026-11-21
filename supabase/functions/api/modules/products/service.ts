import { createFactory } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { createClient } from "@supabase/supabase-js";

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

// Cliente con el JWT del usuario: la RLS decide, no esta función.
async function adminClient(authorization: string, apikey: string) {
  const db = createClient(Deno.env.get("SUPABASE_URL")!, apikey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data } = await db.rpc("is_admin");
  if (data !== true) throw new HTTPException(403, { message: "Sin acceso" });
  return db;
}

export const authorizeAndList = factory.createMiddleware(async (c, next) => {
  const { authorization, apikey } = c.req.valid("header" as never);
  const db = await adminClient(authorization, apikey);
  const { data, error } = await db.from("products").select("*").order("name");
  if (error) throw new HTTPException(500, { message: "Error interno." });
  c.set("products", data);
  await next();
});

export const authorizeAndCreate = factory.createMiddleware(async (c, next) => {
  const { authorization, apikey } = c.req.valid("header" as never);
  const body = c.req.valid("json" as never);
  const db = await adminClient(authorization, apikey);
  const { data, error } = await db.from("products").insert(body).select()
    .single();
  if (error) throw new HTTPException(500, { message: "Error interno." });
  c.set("product", data);
  await next();
});
