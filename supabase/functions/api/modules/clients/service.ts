import { createFactory } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { adminDb } from "../../shared/admin-db.ts";

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
