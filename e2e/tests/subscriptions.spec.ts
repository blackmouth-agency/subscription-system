import { expect, test } from "@playwright/test";
import { createUser, signInAt } from "./helpers";

test("el admin crea una suscripción y la ve en el cliente", async ({ page }) => {
  await signInAt(page, await createUser(true), "/admin/clients");
  const client = `Acme ${crypto.randomUUID()}`;
  await page.getByLabel("Nombre o razón social").fill(client);
  await page.getByRole("button", { name: "Crear cliente" }).click();
  const clientRow = page.getByRole("row", { name: new RegExp(client) });
  await expect(clientRow).toBeVisible();

  await page.goto("/admin/products");
  const product = `Hosting ${crypto.randomUUID()}`;
  await page.getByLabel("Nombre", { exact: true }).fill(product);
  await page.getByLabel("Precio (COP)").fill("50000");
  await page.getByRole("button", { name: "Crear producto" }).click();
  await expect(page.getByRole("row", { name: new RegExp(product) }))
    .toBeVisible();

  await page.goto("/admin/subscriptions");
  await page.getByLabel("Cliente").selectOption({ label: client });
  await page.getByLabel("Producto").selectOption({ label: product });
  await expect(page.getByLabel("Precio (COP)")).toHaveValue("50000");
  await page.getByLabel("Precio (COP)").fill("45000");
  await page.getByRole("button", { name: "Crear suscripción" }).click();

  const row = page.getByRole("row", { name: new RegExp(client) });
  await expect(row).toContainText(product);
  await expect(row).toContainText("45.000");
  await expect(row).toContainText("Pendiente");
  await expect(row).toContainText("Agencia");

  await page.goto("/admin/clients");
  await page.getByRole("row", { name: new RegExp(client) })
    .getByRole("link", { name: "Suscripciones" }).click();
  await expect(page.getByRole("row", { name: new RegExp(product) }))
    .toBeVisible();
});

test("una cuenta sin el rol ve sin acceso", async ({ page }) => {
  await signInAt(page, await createUser(false), "/admin/subscriptions");

  await expect(page.getByText("Sin acceso")).toBeVisible();
  await expect(page.getByRole("table")).toHaveCount(0);
});
