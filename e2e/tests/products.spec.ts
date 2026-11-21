import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import pg from "pg";

const admin = createClient(process.env.API_URL!, process.env.SECRET_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const password = "clave-de-prueba-123";

async function createUser(isAdmin: boolean): Promise<string> {
  const email = `e2e-products-${crypto.randomUUID()}@test.local`;
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

async function signInAt(page: Page, email: string, path: string) {
  await page.goto(path);
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
}

test("el admin crea un producto y lo ve en la lista", async ({ page }) => {
  await signInAt(page, await createUser(true), "/admin/products");
  const name = `Hosting ${crypto.randomUUID()}`;

  await page.getByLabel("Nombre", { exact: true }).fill(name);
  await page.getByLabel("Descripción").fill("Plan mensual");
  await page.getByLabel("Precio (COP)").fill("50000");
  await page.getByRole("button", { name: "Crear producto" }).click();

  const row = page.getByRole("row", { name: new RegExp(name) });
  await expect(row).toBeVisible();
  await expect(row).toContainText("50.000");
});

test("una cuenta sin el rol ve sin acceso", async ({ page }) => {
  await signInAt(page, await createUser(false), "/admin/products");

  await expect(page.getByText("Sin acceso")).toBeVisible();
  await expect(page.getByRole("table")).toHaveCount(0);
});
