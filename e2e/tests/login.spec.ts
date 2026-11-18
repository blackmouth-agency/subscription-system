import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(process.env.API_URL!, process.env.SECRET_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

test("un usuario con acceso inicia sesión y ve el contenido de conoce-mas", async ({ page }) => {
  const email = `e2e-con-acceso-${crypto.randomUUID()}@test.local`;
  const password = "clave-de-prueba-123";
  const { data: created } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  const { data: project } = await admin.from("projects")
    .upsert({ slug: "conoce-mas" }, { onConflict: "slug" })
    .select().single();
  await admin.from("entitlements").insert({ user_id: created.user!.id, project_id: project!.id });

  await page.goto("/");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();

  await expect(page.getByText("Bienvenido a conoce-mas")).toBeVisible();
});

test("un usuario sin acceso inicia sesión y ve que no tiene acceso", async ({ page }) => {
  const email = `e2e-sin-acceso-${crypto.randomUUID()}@test.local`;
  const password = "clave-de-prueba-123";
  await admin.auth.admin.createUser({ email, password, email_confirm: true });

  await page.goto("/");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();

  await expect(page.getByText("No tienes acceso a conoce-mas")).toBeVisible();
});
