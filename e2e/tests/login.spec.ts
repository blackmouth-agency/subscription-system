import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(process.env.API_URL!, process.env.SECRET_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

test("al iniciar sesión veo con qué correo entré", async ({ page }) => {
  const email = `e2e-inicio-${crypto.randomUUID()}@test.local`;
  const password = "clave-de-prueba-123";
  await admin.auth.admin.createUser({ email, password, email_confirm: true });

  await page.goto("/");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();

  await expect(page.getByText(`Entraste como ${email}`)).toBeVisible();
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

test("después de entrar puedo probar con otra cuenta", async ({ page }) => {
  const password = "clave-de-prueba-123";
  const primera = `e2e-otra-cuenta-1-${crypto.randomUUID()}@test.local`;
  const segunda = `e2e-otra-cuenta-2-${crypto.randomUUID()}@test.local`;
  await admin.auth.admin.createUser({ email: primera, password, email_confirm: true });
  await admin.auth.admin.createUser({ email: segunda, password, email_confirm: true });

  await page.goto("/");
  await page.getByLabel("Correo").fill(primera);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page.getByText(`Entraste como ${primera}`)).toBeVisible();

  await page.getByRole("button", { name: "Probar con otra cuenta" }).click();
  await page.getByLabel("Correo").fill(segunda);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();

  await expect(page.getByText(`Entraste como ${segunda}`)).toBeVisible();
});

test("mientras inicio sesión no puedo volver a enviar el formulario", async ({ page }) => {
  const email = `e2e-doble-envio-${crypto.randomUUID()}@test.local`;
  const password = "clave-de-prueba-123";
  await admin.auth.admin.createUser({ email, password, email_confirm: true });
  let release!: () => void;
  const held = new Promise<void>((resolve) => (release = resolve));
  await page.route("**/auth/v1/token**", async (route) => {
    await held;
    await route.continue();
  });

  await page.goto("/");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();

  await expect(page.getByRole("button", { name: "Iniciar sesión" })).toBeDisabled();
  release();
  await expect(page.getByText(`Entraste como ${email}`)).toBeVisible();
});

test("al registrarme con mi correo y una contraseña veo que debo revisar mi correo", async ({ page }) => {
  const email = `e2e-registro-${crypto.randomUUID()}@test.local`;

  await page.goto("/");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill("clave-de-prueba-123");
  await page.getByRole("button", { name: "Crear cuenta" }).click();

  await expect(page.getByText("Revisa tu correo para confirmar tu cuenta.")).toBeVisible();
});

test("no puedo registrarme con una contraseña de menos de 8 caracteres", async ({ page }) => {
  const email = `e2e-clave-corta-${crypto.randomUUID()}@test.local`;

  await page.goto("/");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill("corta12");
  await page.getByRole("button", { name: "Crear cuenta" }).click();

  await expect(page.getByText("La contraseña debe tener al menos 8 caracteres.")).toBeVisible();
});

test("si no he confirmado mi correo e intento entrar, veo que primero debo confirmarlo", async ({ page }) => {
  const email = `e2e-sin-confirmar-${crypto.randomUUID()}@test.local`;
  const password = "clave-de-prueba-123";
  await admin.auth.admin.createUser({ email, password, email_confirm: false });

  await page.goto("/");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();

  await expect(page.getByText("Primero debes confirmar tu correo.")).toBeVisible();
});

async function confirmationLink(email: string): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt++) {
    const query = encodeURIComponent(`to:"${email}"`);
    const { messages } = await (await fetch(`${process.env.MAILPIT_URL}/api/v1/search?query=${query}`)).json();
    if (messages?.length) {
      const message = await (await fetch(`${process.env.MAILPIT_URL}/api/v1/message/${messages[0].ID}`)).json();
      const link = message.Text.match(/https?:\/\/\S+\/auth\/v1\/verify[^\s)]+/)?.[0];
      if (link) return link;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`No llegó el correo de confirmación a ${email}`);
}

test("al abrir el enlace de confirmación entro al portal con mi cuenta", async ({ page }) => {
  const email = `e2e-confirmar-${crypto.randomUUID()}@test.local`;

  await page.goto("/");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill("clave-de-prueba-123");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page.getByText("Revisa tu correo para confirmar tu cuenta.")).toBeVisible();

  await page.goto(await confirmationLink(email));

  await expect(page.getByText(`Entraste como ${email}`)).toBeVisible();
});
