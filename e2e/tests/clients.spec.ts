import { expect, test } from "@playwright/test";
import { createUser, signInAt } from "./helpers";

test("el admin crea un cliente, lo edita y ve el cambio", async ({ page }) => {
  await signInAt(page, await createUser(true), "/admin/clients");
  const name = `Acme ${crypto.randomUUID()}`;

  await page.getByLabel("Nombre o razón social").fill(name);
  await page.getByLabel("Contacto").fill("Laura");
  await page.getByRole("button", { name: "Crear cliente" }).click();

  const row = page.getByRole("row", { name: new RegExp(name) });
  await expect(row).toContainText("Laura");

  await row.getByRole("button", { name: "Editar" }).click();
  await page.getByLabel("Teléfono / WhatsApp").fill("3001234567");
  await page.getByRole("button", { name: "Guardar cliente" }).click();

  await expect(row).toContainText("3001234567");
});

test("una cuenta sin el rol ve sin acceso", async ({ page }) => {
  await signInAt(page, await createUser(false), "/admin/clients");

  await expect(page.getByText("Sin acceso")).toBeVisible();
  await expect(page.getByRole("table")).toHaveCount(0);
});
