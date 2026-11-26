import { expect, test } from "@playwright/test";
import { createUser, signInAt } from "./helpers";
import pg from "pg";

// Sin API de escritura para los datos: se siembran por la conexión directa.
async function seed(client: string, product: string, due: string) {
  const db = new pg.Client({ connectionString: process.env.DB_URL });
  await db.connect();
  const { rows: [c] } = await db.query(
    "insert into public.clients (name) values ($1) returning id",
    [client],
  );
  const { rows: [p] } = await db.query(
    "insert into public.products (name, price) values ($1, 50000) returning id",
    [product],
  );
  const { rows: [s] } = await db.query(
    `insert into public.subscriptions (client_id, product_id, price)
     values ($1, $2, 50000) returning id`,
    [c.id, p.id],
  );
  await db.query(
    `insert into public.installments (subscription_id, due_date, amount, status)
     values ($1, $2, 50000, 'pending')`,
    [s.id, due],
  );
  await db.end();
}

test("el admin ve los cobros, filtra, busca y registra un pago", async ({
  page,
}) => {
  const a = `Acme ${crypto.randomUUID()}`;
  const b = `Beta ${crypto.randomUUID()}`;
  await seed(a, `Hosting ${crypto.randomUUID()}`, "2026-01-10");
  await seed(b, `Web ${crypto.randomUUID()}`, "2099-01-10");
  await signInAt(page, await createUser(true), "/admin/payments");

  // Por defecto solo trae el mes en curso: se quitan los filtros.
  await page.getByRole("button", { name: /^Filtros/ }).click();
  await page.getByRole("button", { name: "Quitar filtros" }).click();
  await page.keyboard.press("Escape");

  // La base compartida tiene más cobros: se aísla cada uno con la búsqueda.
  const search = page.getByLabel("Buscar clientes");
  await search.fill(a);
  await expect(page.getByRole("row", { name: new RegExp(a) }))
    .toContainText("Vencida");
  await search.fill(b);
  await expect(page.getByRole("row", { name: new RegExp(b) }))
    .toContainText("Pendiente");
  await search.fill("");
  await expect(page.getByText("no es constancia de transferencia"))
    .toBeVisible();
  await expect(page.getByText("Cobrado", { exact: true })).toBeVisible();
  // En escritorio la página cabe en la ventana: sin barras de scroll.
  const overflow = await page.evaluate(() => ({
    y: document.documentElement.scrollHeight - innerHeight,
    x: document.documentElement.scrollWidth - innerWidth,
  }));
  expect(overflow.y).toBeLessThanOrEqual(0);
  expect(overflow.x).toBeLessThanOrEqual(0);

  await page.getByRole("button", { name: /^Filtros/ }).click();
  await page.getByLabel("Estado").selectOption({ label: "Vencida" });
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Filtros, 1 aplicados" }))
    .toBeVisible();
  await search.fill(b);
  await expect(page.getByRole("row", { name: new RegExp(b) })).toHaveCount(0);
  await search.fill(a);
  await expect(page.getByRole("row", { name: new RegExp(a) })).toBeVisible();

  await page.getByRole("button", { name: /^Filtros/ }).click();
  await page.getByLabel("Estado").selectOption({ label: "Todos" });
  await page.keyboard.press("Escape");
  // La búsqueda ignora mayúsculas.
  await search.fill(b.toUpperCase());
  await expect(page.getByRole("row", { name: new RegExp(b) })).toBeVisible();
  await expect(page.getByRole("row", { name: new RegExp(a) })).toHaveCount(0);

  await search.fill(a);
  await page.getByRole("button", { name: "Registrar pago", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "Registrar pago manual" });
  const option = dialog.locator("option", { hasText: a });
  await dialog.getByLabel("Suscripción")
    .selectOption(await option.getAttribute("value"));
  await expect(dialog.getByRole("status")).toBeVisible();
  await dialog.getByRole("button", { name: "Registrar pago" }).click();
  await expect(page.getByText("Registramos el pago.")).toBeVisible();
  await expect(page.getByRole("row", { name: new RegExp(a) }))
    .toContainText("Pagada");
});

test("una cuenta sin el rol ve sin acceso en cobros", async ({ page }) => {
  await signInAt(page, await createUser(false), "/admin/payments");
  await expect(page.getByText("Sin acceso")).toBeVisible();
});
