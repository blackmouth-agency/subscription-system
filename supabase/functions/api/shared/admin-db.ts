import { HTTPException } from "hono/http-exception";
import { createClient } from "@supabase/supabase-js";

// Cliente con el JWT del usuario: la RLS decide, no esta función.
export async function adminDb(authorization: string, apikey: string) {
  const db = createClient(Deno.env.get("SUPABASE_URL")!, apikey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data } = await db.rpc("is_admin");
  if (data !== true) throw new HTTPException(403, { message: "Sin acceso" });
  return db;
}
