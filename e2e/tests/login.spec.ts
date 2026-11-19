import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(process.env.API_URL!, process.env.SECRET_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const acceptDocuments = (page: Page) =>
  page.getByRole("checkbox", { name: "Acepto los términos y la política de datos" });

// Abre el registro y llena el formulario; cada prueba decide cuándo enviarlo.
async function fillSignUp(page: Page, email: string, password: string, { accept = true } = {}) {
  await page.goto("/");
  await page.getByRole("button", { name: "Crear una cuenta" }).click();
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  if (accept) await acceptDocuments(page).check();
}

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

test("al cerrar sesión vuelvo al formulario de inicio", async ({ page }) => {
  const email = `e2e-cerrar-sesion-${crypto.randomUUID()}@test.local`;
  const password = "clave-de-prueba-123";
  await admin.auth.admin.createUser({ email, password, email_confirm: true });

  await page.goto("/");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page.getByText(`Entraste como ${email}`)).toBeVisible();

  await page.getByRole("button", { name: "Cerrar sesión" }).click();

  await expect(page.getByRole("button", { name: "Iniciar sesión" })).toBeVisible();
  await expect(page.getByText(`Entraste como ${email}`)).toBeHidden();
});

test("después de cerrar sesión, al volver a abrir el portal me pide iniciar sesión", async ({ context, page }) => {
  const email = `e2e-reabrir-sin-sesion-${crypto.randomUUID()}@test.local`;
  const password = "clave-de-prueba-123";
  await admin.auth.admin.createUser({ email, password, email_confirm: true });

  await page.goto("/");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page.getByText(`Entraste como ${email}`)).toBeVisible();
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page.getByRole("button", { name: "Iniciar sesión" })).toBeVisible();

  // Volver a abrir el portal: otra pestaña del mismo navegador, que conserva lo guardado en el dispositivo.
  await page.close();
  const reopened = await context.newPage();
  await reopened.goto("/");

  await expect(reopened.getByRole("button", { name: "Iniciar sesión" })).toBeVisible();
  await expect(reopened.getByText(`Entraste como ${email}`)).toBeHidden();
});

test("después de entrar, al volver a abrir el portal sigo dentro sin poner la contraseña", async ({ context, page }) => {
  const email = `e2e-reabrir-con-sesion-${crypto.randomUUID()}@test.local`;
  const password = "clave-de-prueba-123";
  await admin.auth.admin.createUser({ email, password, email_confirm: true });

  await page.goto("/");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page.getByText(`Entraste como ${email}`)).toBeVisible();

  await page.close();
  const reopened = await context.newPage();
  await reopened.goto("/");

  await expect(reopened.getByText(`Entraste como ${email}`)).toBeVisible();
  await expect(reopened.getByRole("button", { name: "Iniciar sesión" })).toBeHidden();
});

test('con la contraseña equivocada sigo en el formulario para corregirla y no veo el botón "Cerrar sesión"', async ({
  page,
}) => {
  const email = `e2e-corregir-clave-${crypto.randomUUID()}@test.local`;
  const password = "clave-de-prueba-123";
  await admin.auth.admin.createUser({ email, password, email_confirm: true });

  await page.goto("/");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill("otra-clave-456");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page.getByText("Correo o contraseña incorrectos.")).toBeVisible();

  await expect(page.getByRole("button", { name: "Cerrar sesión" })).toBeHidden();
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();

  await expect(page.getByText(`Entraste como ${email}`)).toBeVisible();
});

test("al volver a abrir el portal con la sesión guardada no aparece el formulario ni por un instante", async ({
  context,
  page,
}) => {
  const email = `e2e-sin-parpadeo-${crypto.randomUUID()}@test.local`;
  const password = "clave-de-prueba-123";
  await admin.auth.admin.createUser({ email, password, email_confirm: true });

  await page.goto("/");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page.getByText(`Entraste como ${email}`)).toBeVisible();

  await page.close();
  const reopened = await context.newPage();
  // Anota si algún formulario llega a estar en la página, aunque desaparezca enseguida.
  await reopened.addInitScript(() => {
    const seen = window as unknown as { formAppeared: boolean };
    seen.formAppeared = false;
    new MutationObserver(() => {
      if (document.querySelector("form")) seen.formAppeared = true;
    }).observe(document, { childList: true, subtree: true });
  });
  await reopened.goto("/");

  await expect(reopened.getByText(`Entraste como ${email}`)).toBeVisible();
  expect(await reopened.evaluate(() => (window as unknown as { formAppeared: boolean }).formAppeared)).toBe(false);
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

  await fillSignUp(page, email, "clave-de-prueba-123");
  await page.getByRole("button", { name: "Crear cuenta" }).click();

  await expect(page.getByText("Revisa tu correo para confirmar tu cuenta.")).toBeVisible();
});

test("no puedo registrarme con una contraseña de menos de 8 caracteres", async ({ page }) => {
  const email = `e2e-clave-corta-${crypto.randomUUID()}@test.local`;

  await fillSignUp(page, email, "corta12");
  await page.getByRole("button", { name: "Crear cuenta" }).click();

  await expect(page.getByText("La contraseña debe tener al menos 8 caracteres.")).toBeVisible();
});

test("sin aceptar los términos y la política de datos no puedo crear la cuenta", async ({ page }) => {
  const email = `e2e-sin-aceptar-${crypto.randomUUID()}@test.local`;
  const password = "clave-de-prueba-123";

  await fillSignUp(page, email, password, { accept: false });
  await page.getByRole("button", { name: "Crear cuenta" }).click();

  // El portal no envía el registro: lleva a la casilla que falta marcar.
  await expect(acceptDocuments(page)).toBeFocused();
  await expect(acceptDocuments(page)).not.toBeChecked();

  // Si la cuenta existiera, al entrar con esos datos pediría confirmar el correo.
  await page.getByRole("button", { name: "Ya tengo cuenta" }).click();
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();

  await expect(page.getByText("Correo o contraseña incorrectos.")).toBeVisible();
});

test("los enlaces a los términos y a la política de datos llevan al sitio de BlackMouth", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Crear una cuenta" }).click();

  await expect(page.getByRole("link", { name: "términos" })).toHaveAttribute("href", "https://blackmouth.agency/terminos");
  await expect(page.getByRole("link", { name: "política de datos" })).toHaveAttribute(
    "href",
    "https://blackmouth.agency/politica-de-datos",
  );
});

test("al abrir los documentos no pierdo lo que escribí en el registro", async ({ page }) => {
  // Las pruebas no dependen del sitio de BlackMouth: sus páginas se responden aquí.
  await page.context().route("https://blackmouth.agency/**", (route) => route.fulfill({ body: "Documento" }));
  const email = `e2e-documentos-${crypto.randomUUID()}@test.local`;

  await fillSignUp(page, email, "clave-de-prueba-123");

  for (const [name, url] of [
    ["términos", "https://blackmouth.agency/terminos"],
    ["política de datos", "https://blackmouth.agency/politica-de-datos"],
  ]) {
    const opened = page.waitForEvent("popup", { timeout: 5_000 });
    await page.getByRole("link", { name }).click();
    await expect(await opened).toHaveURL(url);
  }

  await expect(page.getByLabel("Correo")).toHaveValue(email);
});

test("al crear la cuenta aceptando, quedan registradas la fecha y la versión de cada documento", async ({ page }) => {
  const email = `e2e-aceptacion-${crypto.randomUUID()}@test.local`;

  await fillSignUp(page, email, "clave-de-prueba-123");
  const signup = page.waitForResponse("**/auth/v1/signup**");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  const { id: userId } = await (await signup).json();
  await expect(page.getByText("Revisa tu correo para confirmar tu cuenta.")).toBeVisible();

  const { data, error } = await admin
    .from("document_acceptances")
    .select("document, version, accepted_at")
    .eq("user_id", userId)
    .order("document");

  const { data: current } = await admin.from("legal_documents").select("document, version").order("document");

  expect(error).toBeNull();
  expect(current!.map(({ document }) => document)).toEqual(["politica-de-datos", "terminos"]);
  expect(data!.map(({ document, version }) => ({ document, version }))).toEqual(current);
  // Margen de un minuto: el reloj de la base (Docker) puede ir algo desfasado del de la prueba.
  for (const { accepted_at } of data!) {
    expect(Math.abs(Date.parse(accepted_at) - Date.now())).toBeLessThan(60_000);
  }
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

  await fillSignUp(page, email, "clave-de-prueba-123");
  await page.getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page.getByText("Revisa tu correo para confirmar tu cuenta.")).toBeVisible();

  await page.goto(await confirmationLink(email));

  await expect(page.getByText(`Entraste como ${email}`)).toBeVisible();
});
