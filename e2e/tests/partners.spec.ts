import { expect, test } from "@playwright/test";
import { createUser, signInAt } from "./helpers";

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
