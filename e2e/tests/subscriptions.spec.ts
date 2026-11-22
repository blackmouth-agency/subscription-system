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

test("el admin asigna un socio con comisión y lo edita", async ({ page }) => {
  await signInAt(page, await createUser(true), "/admin/partners");
  const partner = `Socio ${crypto.randomUUID()}`;
  await page.getByLabel("Nombre o razón social").fill(partner);
  await page.getByRole("button", { name: "Crear socio" }).click();
  await expect(page.getByRole("row", { name: new RegExp(partner) }))
    .toBeVisible();

  await page.goto("/admin/clients");
  const client = `Acme ${crypto.randomUUID()}`;
  await page.getByLabel("Nombre o razón social").fill(client);
  await page.getByRole("button", { name: "Crear cliente" }).click();
  await expect(page.getByRole("row", { name: new RegExp(client) }))
    .toBeVisible();

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
  await page.getByLabel("Socio").selectOption({ label: partner });
  await page.getByLabel("Comisión (COP)").fill("5000");
  await page.getByLabel("Duración").selectOption("months");
  await page.getByLabel("Mensualidades").fill("3");
  await page.getByLabel("Receptor").selectOption("partner");
  await page.getByRole("button", { name: "Crear suscripción" }).click();

  const row = page.getByRole("row", { name: new RegExp(client) });
  await expect(row).toContainText(partner);
  await expect(row).toContainText("5.000");
  await expect(row).toContainText("3 mensualidades");
  await expect(row).toContainText("Socio");

  await row.getByRole("button", { name: "Editar" }).click();
  await page.getByLabel("Duración").selectOption("once");
  await page.getByRole("button", { name: "Guardar suscripción" }).click();
  await expect(row).toContainText("Única");
  await expect(row).not.toContainText("3 mensualidades");
});

test("el admin activa, suspende, reactiva y cancela una suscripción", async ({ page }) => {
  await signInAt(page, await createUser(true), "/admin/clients");
  const client = `Acme ${crypto.randomUUID()}`;
  await page.getByLabel("Nombre o razón social").fill(client);
  await page.getByRole("button", { name: "Crear cliente" }).click();
  await expect(page.getByRole("row", { name: new RegExp(client) }))
    .toBeVisible();

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
  await page.getByRole("button", { name: "Crear suscripción" }).click();

  const row = page.getByRole("row", { name: new RegExp(client) });
  await expect(row).toContainText("Pendiente");
  await expect(row.getByRole("button", { name: "Suspender" })).toHaveCount(0);

  await row.getByRole("button", { name: "Activar" }).click();
  await expect(row).toContainText("Activa");
  await row.getByRole("button", { name: "Suspender" }).click();
  await expect(row).toContainText("Suspendida");
  await row.getByRole("button", { name: "Reactivar" }).click();
  await expect(row).toContainText("Activa");

  page.once("dialog", (dialog) => dialog.accept());
  await row.getByRole("button", { name: "Cancelar" }).click();
  await expect(row).toContainText("Cancelada");
  await expect(row.getByRole("button", { name: "Activar" })).toHaveCount(0);
  await expect(row.getByRole("button", { name: "Cancelar" })).toHaveCount(0);
});
