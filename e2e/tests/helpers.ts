import type { Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import pg from "pg";

const admin = createClient(process.env.API_URL!, process.env.SECRET_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const password = "clave-de-prueba-123";

// Crea una cuenta confirmada; con isAdmin, le da el rol por SQL directo.
export async function createUser(isAdmin: boolean): Promise<string> {
  const email = `e2e-${crypto.randomUUID()}@test.local`;
  const { data } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (isAdmin) {
    const db = new pg.Client({ connectionString: process.env.DB_URL });
    await db.connect();
    await db.query("insert into public.admins (user_id) values ($1)", [
      data.user!.id,
    ]);
    await db.end();
  }
  return email;
}

export async function signInAt(page: Page, email: string, path = "/") {
  await page.goto(path);
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
}
