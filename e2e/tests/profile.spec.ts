import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const admin = createClient(process.env.API_URL!, process.env.SECRET_KEY!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const password = "clave-de-prueba-123";

// Crea una cuenta confirmada para la prueba y devuelve su correo.
async function createUser(name: string): Promise<string> {
  const email = `e2e-${name}-${crypto.randomUUID()}@test.local`;
  await admin.auth.admin.createUser({ email, password, email_confirm: true });
  return email;
}

// Guarda el perfil con la sesión del propio usuario: la clave secreta no tiene permisos sobre los perfiles.
async function saveProfileAs(email: string, profile: { full_name: string; phone: string }) {
  const client = createClient(process.env.API_URL!, process.env.PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data } = await client.auth.signInWithPassword({ email, password });
  const { error } = await client.from("profiles").insert({ user_id: data.user!.id, ...profile });
  if (error) throw error;
}

// Abre el portal, inicia sesión y abre "Mi perfil".
async function openProfile(page: Page, email: string) {
  await page.goto("/");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await page.getByRole("button", { name: "Mi perfil" }).click();
}

test("al abrir mi perfil veo mi correo, mi nombre y mi teléfono", async ({ page }) => {
  const email = await createUser("perfil-ver");
  await saveProfileAs(email, { full_name: "Ana Gómez", phone: "3001234567" });

  await openProfile(page, email);

  await expect(page.getByLabel("Correo")).toHaveValue(email);
  await expect(page.getByLabel("Nombre")).toHaveValue("Ana Gómez");
  await expect(page.getByLabel("Teléfono")).toHaveValue("3001234567");
});

// Llena el perfil y lo guarda.
async function fillAndSaveProfile(page: Page, fullName: string, phone: string) {
  await page.getByLabel("Nombre").fill(fullName);
  await page.getByLabel("Teléfono").fill(phone);
  await page.getByRole("button", { name: "Guardar perfil" }).click();
}

// Vuelve al perfil: recarga el portal, que conserva la sesión, y abre "Mi perfil" otra vez.
async function reopenProfile(page: Page) {
  await page.reload();
  await page.getByRole("button", { name: "Mi perfil" }).click();
}

test("al guardar mi nombre y un celular de 10 dígitos veo que se guardaron y siguen ahí al volver", async ({ page }) => {
  const email = await createUser("perfil-guardar");
  await openProfile(page, email);

  await fillAndSaveProfile(page, "Beto Ruiz", "3107654321");
  await expect(page.getByText("Guardamos tu perfil.")).toBeVisible();
  await reopenProfile(page);
  await expect(page.getByLabel("Nombre")).toHaveValue("Beto Ruiz");
  await expect(page.getByLabel("Teléfono")).toHaveValue("3107654321");

  await fillAndSaveProfile(page, "Beto Ruiz Díaz", "3209876543");
  await expect(page.getByText("Guardamos tu perfil.")).toBeVisible();
  await reopenProfile(page);
  await expect(page.getByLabel("Nombre")).toHaveValue("Beto Ruiz Díaz");
  await expect(page.getByLabel("Teléfono")).toHaveValue("3209876543");
});

test("sin nombre no se guarda mi perfil y veo que debo escribirlo", async ({ page }) => {
  const email = await createUser("perfil-sin-nombre");
  await saveProfileAs(email, { full_name: "Ana Gómez", phone: "3001234567" });
  await openProfile(page, email);

  await fillAndSaveProfile(page, "", "3001234567");

  await expect(page.getByText("Escribe tu nombre.")).toBeVisible();
  await reopenProfile(page);
  await expect(page.getByLabel("Nombre")).toHaveValue("Ana Gómez");
});

test("con un teléfono que no es celular colombiano no se guarda y veo cómo debe ser", async ({ page }) => {
  const email = await createUser("perfil-telefono");
  await saveProfileAs(email, { full_name: "Ana Gómez", phone: "3001234567" });
  await openProfile(page, email);

  await fillAndSaveProfile(page, "Ana Gómez", "2001234567");

  await expect(page.getByText("El teléfono debe ser un celular colombiano: 10 dígitos que empiezan por 3.")).toBeVisible();
  await reopenProfile(page);
  await expect(page.getByLabel("Teléfono")).toHaveValue("3001234567");
});

// Cambia la contraseña desde "Mi perfil".
async function changePassword(page: Page, current: string, next: string) {
  await page.getByLabel("Contraseña actual").fill(current);
  await page.getByLabel("Contraseña nueva").fill(next);
  await page.getByRole("button", { name: "Cambiar contraseña" }).click();
}

// Cierra sesión e intenta volver a entrar con esa contraseña.
async function signOutAndSignIn(page: Page, email: string, withPassword: string) {
  await page.getByRole("button", { name: "Cerrar sesión" }).click();
  await expect(page.getByRole("button", { name: "Iniciar sesión" })).toBeVisible();
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill(withPassword);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
}

test("al cambiar mi contraseña con la actual y una nueva veo que se cambió y la anterior deja de servir", async ({
  page,
}) => {
  const email = await createUser("clave-cambiar");
  await openProfile(page, email);

  await changePassword(page, password, "clave-nueva-456");

  await expect(page.getByText("Cambiamos tu contraseña.")).toBeVisible();
  await signOutAndSignIn(page, email, password);
  await expect(page.getByText("Correo o contraseña incorrectos.")).toBeVisible();
  await page.getByLabel("Contraseña").fill("clave-nueva-456");
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page.getByRole("button", { name: "Cerrar sesión" })).toBeVisible();
});

test("con mi contraseña actual equivocada veo que no es correcta y la contraseña no cambia", async ({ page }) => {
  const email = await createUser("clave-actual-equivocada");
  await openProfile(page, email);

  await changePassword(page, "otra-clave-000", "clave-nueva-456");

  await expect(page.getByText("Tu contraseña actual no es correcta.")).toBeVisible();
  await signOutAndSignIn(page, email, "clave-nueva-456");
  await expect(page.getByText("Correo o contraseña incorrectos.")).toBeVisible();
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page.getByRole("button", { name: "Cerrar sesión" })).toBeVisible();
});

test("no puedo cambiar mi contraseña por una de menos de 8 caracteres", async ({ page }) => {
  const email = await createUser("clave-nueva-corta");
  await openProfile(page, email);

  await changePassword(page, password, "corta12");

  await expect(page.getByText("La contraseña debe tener al menos 8 caracteres.")).toBeVisible();
  await signOutAndSignIn(page, email, password);
  await expect(page.getByRole("button", { name: "Cerrar sesión" })).toBeVisible();
});

// Pide eliminar la cuenta escribiendo ese correo para confirmar.
async function deleteAccount(page: Page, confirmEmail: string) {
  await page.getByLabel("Escribe tu email para confirmar").fill(confirmEmail);
  await page.getByRole("button", { name: "Eliminar mi cuenta" }).click();
}

test("al eliminar mi cuenta escribiendo mi correo salgo del portal y veo que se eliminó", async ({ page }) => {
  const email = await createUser("eliminar-cuenta");
  await openProfile(page, email);

  await deleteAccount(page, email);

  await expect(page.getByText("Eliminamos tu cuenta.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Iniciar sesión" })).toBeVisible();
});

test("después de eliminar mi cuenta no puedo entrar con ese correo", async ({ page }) => {
  const email = await createUser("eliminar-y-entrar");
  await openProfile(page, email);
  await deleteAccount(page, email);
  await expect(page.getByText("Eliminamos tu cuenta.")).toBeVisible();

  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();

  await expect(page.getByText("Correo o contraseña incorrectos.")).toBeVisible();
});

test("si escribo un correo distinto al mío mi cuenta no se elimina", async ({ page }) => {
  const email = await createUser("eliminar-otro-correo");
  await openProfile(page, email);

  await deleteAccount(page, `otro-${email}`);

  await expect(page.getByText("El correo no coincide con el tuyo.")).toBeVisible();
  await signOutAndSignIn(page, email, password);
  await expect(page.getByRole("button", { name: "Cerrar sesión" })).toBeVisible();
});
