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

test("el admin ve los cobros, filtra y ve los totales", async ({ page }) => {
  const a = `Acme ${crypto.randomUUID()}`;
  const b = `Beta ${crypto.randomUUID()}`;
  await seed(a, `Hosting ${crypto.randomUUID()}`, "2026-01-10");
  await seed(b, `Web ${crypto.randomUUID()}`, "2099-01-10");
  await signInAt(page, await createUser(true), "/admin/payments");

  await expect(page.getByRole("row", { name: new RegExp(a) }))
    .toContainText("Vencida");
  await expect(page.getByRole("row", { name: new RegExp(b) }))
    .toContainText("Pendiente");
  await expect(page.getByText("no es constancia de transferencia"))
    .toBeVisible();
  await expect(page.getByText(/Recaudado:/)).toBeVisible();

  await page.getByLabel("Estado").selectOption({ label: "Vencida" });
  await expect(page.getByRole("row", { name: new RegExp(a) })).toBeVisible();
  await expect(page.getByRole("row", { name: new RegExp(b) })).toHaveCount(0);

  await page.getByLabel("Estado").selectOption({ label: "Todos" });
  await page.getByLabel("Cliente").selectOption({ label: b });
  await expect(page.getByRole("row", { name: new RegExp(b) })).toBeVisible();
  await expect(page.getByRole("row", { name: new RegExp(a) })).toHaveCount(0);
});

test("una cuenta sin el rol ve sin acceso en cobros", async ({ page }) => {
  await signInAt(page, await createUser(false), "/admin/payments");
  await expect(page.getByText("Sin acceso")).toBeVisible();
});
