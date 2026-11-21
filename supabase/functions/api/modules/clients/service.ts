import { createFactory } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { createClient } from "@supabase/supabase-js";

type Client = {
  id: string;
  name: string;
  contact_name: string;
  email: string;
  phone: string;
  created_at: string;
  updated_at: string;
};
type Env = {
  Variables: { clients: Client[]; client: Client };
};

export const factory = createFactory<Env>();

// Cliente con el JWT del usuario: la RLS decide, no esta función.
async function adminDb(authorization: string, apikey: string) {
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
  const db = await adminDb(authorization, apikey);
  const { data, error } = await db.from("clients").select("*").order("name");
  if (error) throw new HTTPException(500, { message: "Error interno." });
  c.set("clients", data);
  await next();
});

export const authorizeAndCreate = factory.createMiddleware(async (c, next) => {
  const { authorization, apikey } = c.req.valid("header" as never);
  const body = c.req.valid("json" as never);
  const db = await adminDb(authorization, apikey);
  const { data, error } = await db.from("clients").insert(body).select()
    .single();
  if (error) throw new HTTPException(500, { message: "Error interno." });
  c.set("client", data);
  await next();
});

export const authorizeAndUpdate = factory.createMiddleware(async (c, next) => {
  const { authorization, apikey } = c.req.valid("header" as never);
  const { id } = c.req.valid("param" as never);
  const body = c.req.valid("json" as never);
  const db = await adminDb(authorization, apikey);
  const { data, error } = await db.from("clients").update(body).eq("id", id)
    .select();
  if (error) throw new HTTPException(500, { message: "Error interno." });
  if (data.length === 0) {
    throw new HTTPException(404, { message: "Cliente no encontrado" });
  }
  c.set("client", data[0]);
  await next();
});
