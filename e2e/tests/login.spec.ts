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

test("con una contraseña equivocada veo que el correo o la contraseña no son correctos", async ({ page }) => {
  const email = `e2e-clave-equivocada-${crypto.randomUUID()}@test.local`;
  await admin.auth.admin.createUser({ email, password: "clave-de-prueba-123", email_confirm: true });

  await page.goto("/");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill("otra-clave-456");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();

  await expect(page.getByText("Correo o contraseña incorrectos.")).toBeVisible();
});

test("si la verificación falla veo un mensaje para intentar de nuevo", async ({ page }) => {
  const email = `e2e-verificacion-falla-${crypto.randomUUID()}@test.local`;
  const password = "clave-de-prueba-123";
  await admin.auth.admin.createUser({ email, password, email_confirm: true });
  await page.route("**/functions/v1/verify-access**", (route) =>
    route.fulfill({ status: 500, json: { code: "INTERNAL_ERROR", message: "Algo falló" } }),
  );

  await page.goto("/");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();

  await expect(page.getByText("No se pudo verificar tu acceso. Intenta de nuevo.")).toBeVisible();
});

test("después de ver que no tengo acceso puedo entrar con otra cuenta", async ({ page }) => {
  const password = "clave-de-prueba-123";
  const sinAcceso = `e2e-otra-cuenta-sin-${crypto.randomUUID()}@test.local`;
  const conAcceso = `e2e-otra-cuenta-con-${crypto.randomUUID()}@test.local`;
  await admin.auth.admin.createUser({ email: sinAcceso, password, email_confirm: true });
  const { data: created } = await admin.auth.admin.createUser({ email: conAcceso, password, email_confirm: true });
  const { data: project } = await admin.from("projects")
    .upsert({ slug: "conoce-mas" }, { onConflict: "slug" })
    .select().single();
  await admin.from("entitlements").insert({ user_id: created.user!.id, project_id: project!.id });

  await page.goto("/");
  await page.getByLabel("Correo").fill(sinAcceso);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page.getByText("No tienes acceso a conoce-mas")).toBeVisible();

  await page.getByRole("button", { name: "Probar con otra cuenta" }).click();
  await page.getByLabel("Correo").fill(conAcceso);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();

  await expect(page.getByText("Bienvenido a conoce-mas")).toBeVisible();
});

test("mientras verifico mi acceso no puedo volver a enviar el formulario", async ({ page }) => {
  const email = `e2e-doble-envio-${crypto.randomUUID()}@test.local`;
  const password = "clave-de-prueba-123";
  await admin.auth.admin.createUser({ email, password, email_confirm: true });
  let release!: () => void;
  const held = new Promise<void>((resolve) => (release = resolve));
  await page.route("**/functions/v1/verify-access**", async (route) => {
    await held;
    await route.continue();
  });

  await page.goto("/");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();

  await expect(page.getByRole("button", { name: "Iniciar sesión" })).toBeDisabled();
  release();
  await expect(page.getByText("No tienes acceso a conoce-mas")).toBeVisible();
});
