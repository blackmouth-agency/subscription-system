import { createFactory } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { adminDb } from "../../shared/admin-db.ts";

type Partner = {
  id: string;
  name: string;
  contact_name: string;
  email: string;
  phone: string;
  receiving_account: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
type Env = {
  Variables: { partners: Partner[]; partner: Partner };
};

export const factory = createFactory<Env>();

export const authorizeAndList = factory.createMiddleware(async (c, next) => {
  const { authorization, apikey } = c.req.valid("header" as never);
  const db = await adminDb(authorization, apikey);
  const { data, error } = await db.from("partners").select("*").order("name");
  if (error) throw new HTTPException(500, { message: "Error interno." });
  c.set("partners", data);
  await next();
});

export const authorizeAndCreate = factory.createMiddleware(async (c, next) => {
  const { authorization, apikey } = c.req.valid("header" as never);
  const body = c.req.valid("json" as never);
  const db = await adminDb(authorization, apikey);
  const { data, error } = await db.from("partners").insert(body).select()
    .single();
  if (error) throw new HTTPException(500, { message: "Error interno." });
  c.set("partner", data);
  await next();
});

export const authorizeAndUpdate = factory.createMiddleware(async (c, next) => {
  const { authorization, apikey } = c.req.valid("header" as never);
  const { id } = c.req.valid("param" as never);
  const body = c.req.valid("json" as never);
  const db = await adminDb(authorization, apikey);
  const { data, error } = await db.from("partners").update(body).eq("id", id)
    .select();
  if (error) throw new HTTPException(500, { message: "Error interno." });
  if (data.length === 0) {
    throw new HTTPException(404, { message: "Socio no encontrado" });
  }
  c.set("partner", data[0]);
  await next();
});
