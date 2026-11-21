import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import pg from "pg";

const admin = createClient(process.env.API_URL!, process.env.SECRET_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const password = "clave-de-prueba-123";

async function createUser(isAdmin: boolean): Promise<string> {
  const email = `e2e-partners-${crypto.randomUUID()}@test.local`;
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

test("el admin crea un socio, lo edita y ve el cambio", async ({ page }) => {
  await signInAt(page, await createUser(true), "/admin/partners");
  const name = `Socio ${crypto.randomUUID()}`;

  await page.getByLabel("Nombre o razón social").fill(name);
  await page.getByLabel("Contacto").fill("Laura");
  await page.getByLabel("Cuenta receptora").fill("Bancolombia 123");
  await page.getByRole("button", { name: "Crear socio" }).click();

  const row = page.getByRole("row", { name: new RegExp(name) });
  await expect(row).toContainText("Laura");

  await row.getByRole("button", { name: "Editar" }).click();
  await page.getByLabel("Teléfono / WhatsApp").fill("3001234567");
  await page.getByLabel("Activo").uncheck();
  await page.getByRole("button", { name: "Guardar socio" }).click();

  await expect(row).toContainText("3001234567");
  await expect(row).toContainText("Inactivo");
});

test("una cuenta sin el rol ve sin acceso", async ({ page }) => {
  await signInAt(page, await createUser(false), "/admin/partners");

  await expect(page.getByText("Sin acceso")).toBeVisible();
  await expect(page.getByRole("table")).toHaveCount(0);
});
