import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import pg from "pg";

const admin = createClient(process.env.API_URL!, process.env.SECRET_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const password = "clave-de-prueba-123";

// Crea una cuenta confirmada; con isAdmin, le da el rol por SQL directo.
async function createUser(name: string, isAdmin: boolean): Promise<string> {
  const email = `e2e-${name}-${crypto.randomUUID()}@test.local`;
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

async function signIn(page: Page, email: string) {
  await page.goto("/");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
}

test("un admin ve el área de administración", async ({ page }) => {
  await signIn(page, await createUser("admin", true));

  await expect(
    page.getByRole("heading", { name: "Administración" }),
  ).toBeVisible();
  await expect(page.getByText("Sin acceso")).toHaveCount(0);
});

test("una cuenta sin el rol ve sin acceso y conserva perfil y cerrar sesión", async ({
  page,
}) => {
  await signIn(page, await createUser("sin-rol", false));

  await expect(page.getByText("Sin acceso")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Administración" }),
  ).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Mi perfil" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Cerrar sesión" }),
  ).toBeVisible();
});
