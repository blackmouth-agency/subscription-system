import { expect, test } from "@playwright/test";
import { createUser, signInAt } from "./helpers";

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
