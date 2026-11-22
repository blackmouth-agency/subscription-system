import { assertEquals } from "@std/assert";
import { createClient } from "@supabase/supabase-js";

const apiUrl = Deno.env.get("API_URL")!;
const publishableKey = Deno.env.get("PUBLISHABLE_KEY")!;
const noSession = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(apiUrl, Deno.env.get("SECRET_KEY")!, noSession);

async function signInNewUser(isAdmin: boolean) {
  const email = `api-${crypto.randomUUID()}@test.local`;
  const password = "clave-de-prueba-123";
  const { data: created } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (isAdmin) {
    // La API no puede dar el rol: se inserta con la conexión directa.
    const { default: postgres } = await import("postgres");
    const sql = postgres(Deno.env.get("DB_URL")!);
    await sql`insert into public.admins (user_id) values (${created.user!.id})`;
    await sql.end();
  }
  const client = createClient(apiUrl, publishableKey, noSession);
  const { data } = await client.auth.signInWithPassword({ email, password });
  return data.session!.access_token;
}

const apiRoot = `${Deno.env.get("FUNCTIONS_URL")!}/api`;

function callApi(resource: string) {
  return (token: string, method: string, path = "", body?: unknown) =>
    fetch(`${apiRoot}/${resource}${path}`, {
      method,
      headers: {
        apikey: publishableKey,
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
}

const callProducts = callApi("products");
const callClients = callApi("clients");
const callPartners = callApi("partners");
const callSubscriptions = callApi("subscriptions");

Deno.test("un admin crea un producto y lo lista", async () => {
  const token = await signInNewUser(true);
  const name = `Hosting ${crypto.randomUUID()}`;

  const created = await callProducts(token, "POST", "", { name, price: 50000 });
  assertEquals(created.status, 201);
  assertEquals((await created.json()).name, name);

  const list = await (await callProducts(token, "GET")).json();
  assertEquals(list.some((p: { name: string }) => p.name === name), true);
});

Deno.test("rechaza datos inválidos con 400", async () => {
  const token = await signInNewUser(true);
  for (
    const body of [
      { name: "  ", price: 1000 },
      { name: "x", price: 0 },
      { name: "x", price: 10.5 },
      { name: "x", description: "d".repeat(501), price: 1000 },
    ]
  ) {
    const res = await callProducts(token, "POST", "", body);
    assertEquals(res.status, 400);
    await res.body?.cancel();
  }
});

Deno.test("un admin crea, edita parcialmente y lista clientes", async () => {
  const token = await signInNewUser(true);
  const name = `Acme ${crypto.randomUUID()}`;

  const created = await callClients(token, "POST", "", {
    name,
    email: "a@acme.co",
  });
  assertEquals(created.status, 201);
  const client = await created.json();
  assertEquals(client.phone, "");

  const patched = await callClients(token, "PATCH", `/${client.id}`, {
    phone: "3001234567",
  });
  assertEquals(patched.status, 200);
  const updated = await patched.json();
  assertEquals(updated.phone, "3001234567");
  assertEquals(updated.email, "a@acme.co");

  const list = await (await callClients(token, "GET")).json();
  assertEquals(list.some((c: { name: string }) => c.name === name), true);
});

Deno.test("clientes: datos inválidos 400 y id inexistente 404", async () => {
  const token = await signInNewUser(true);
  for (const body of [{ name: " " }, { name: "x", email: "no-es-correo" }]) {
    const res = await callClients(token, "POST", "", body);
    assertEquals(res.status, 400);
    await res.body?.cancel();
  }
  const missingId = `/${crypto.randomUUID()}`;
  const empty = await callClients(token, "PATCH", missingId, {});
  assertEquals(empty.status, 400);
  await empty.body?.cancel();

  const missing = await callClients(token, "PATCH", missingId, { name: "x" });
  assertEquals(missing.status, 404);
  await missing.body?.cancel();
});

Deno.test("un admin crea, desactiva y lista socios", async () => {
  const token = await signInNewUser(true);
  const name = `Socio ${crypto.randomUUID()}`;

  const created = await callPartners(token, "POST", "", {
    name,
    receiving_account: "Bancolombia 123",
  });
  assertEquals(created.status, 201);
  const partner = await created.json();
  assertEquals(partner.is_active, true);

  const patched = await callPartners(token, "PATCH", `/${partner.id}`, {
    is_active: false,
  });
  assertEquals(patched.status, 200);
  const updated = await patched.json();
  assertEquals(updated.is_active, false);
  assertEquals(updated.receiving_account, "Bancolombia 123");

  const list = await (await callPartners(token, "GET")).json();
  assertEquals(list.some((p: { name: string }) => p.name === name), true);
});

Deno.test("socios: datos inválidos 400 y id inexistente 404", async () => {
  const token = await signInNewUser(true);
  for (
    const body of [
      { name: " " },
      { name: "x", email: "no-es-correo" },
      { name: "x", receiving_account: "c".repeat(201) },
    ]
  ) {
    const res = await callPartners(token, "POST", "", body);
    assertEquals(res.status, 400);
    await res.body?.cancel();
  }
  const missingId = `/${crypto.randomUUID()}`;
  const empty = await callPartners(token, "PATCH", missingId, {});
  assertEquals(empty.status, 400);
  await empty.body?.cancel();

  const missing = await callPartners(token, "PATCH", missingId, { name: "x" });
  assertEquals(missing.status, 404);
  await missing.body?.cancel();
});

Deno.test("un admin crea suscripciones y las filtra por cliente", async () => {
  const token = await signInNewUser(true);
  const client = await (await callClients(token, "POST", "", { name: "A" }))
    .json();
  const other = await (await callClients(token, "POST", "", { name: "B" }))
    .json();
  const product = await (await callProducts(token, "POST", "", {
    name: "P",
    price: 50000,
  })).json();
  const body = { client_id: client.id, product_id: product.id };

  const created = await callSubscriptions(token, "POST", "", {
    ...body,
    price: 45000,
  });
  assertEquals(created.status, 201);
  const row = await created.json();
  assertEquals(
    [row.price, row.status, row.commission, row.receiver, row.client.name],
    [45000, "pending", 0, "agency", "A"],
  );
  assertEquals(row.cycle_date, new Date().toLocaleDateString("sv"));
  await (await callSubscriptions(token, "POST", "", {
    client_id: other.id,
    product_id: product.id,
    price: 1000,
  })).body?.cancel();

  const list = await (await callSubscriptions(
    token,
    "GET",
    `?client_id=${client.id}`,
  )).json();
  assertEquals(list.map((s: { id: string }) => s.id), [row.id]);
});

Deno.test("suscripciones: datos inválidos 400 e inexistentes 404", async () => {
  const token = await signInNewUser(true);
  const client = await (await callClients(token, "POST", "", { name: "A" }))
    .json();
  const product = await (await callProducts(token, "POST", "", {
    name: "P",
    price: 50000,
  })).json();
  const valid = { client_id: client.id, product_id: product.id, price: 1000 };

  for (
    const body of [
      { ...valid, price: 0 },
      { ...valid, price: 10.5 },
      { ...valid, client_id: "no-uuid" },
      { ...valid, cycle_date: "ayer" },
    ]
  ) {
    const res = await callSubscriptions(token, "POST", "", body);
    assertEquals(res.status, 400);
    await res.body?.cancel();
  }
  const badFilter = await callSubscriptions(token, "GET", "?client_id=x");
  assertEquals(badFilter.status, 400);
  await badFilter.body?.cancel();

  const noClient = await callSubscriptions(token, "POST", "", {
    ...valid,
    client_id: crypto.randomUUID(),
  });
  assertEquals(noClient.status, 404);
  assertEquals((await noClient.json()).message, "Cliente no encontrado");
  const noProduct = await callSubscriptions(token, "POST", "", {
    ...valid,
    product_id: crypto.randomUUID(),
  });
  assertEquals(noProduct.status, 404);
  assertEquals((await noProduct.json()).message, "Producto no encontrado");
});

const resources = [
  ["products", callProducts, { name: "x", price: 1000 }, false],
  ["clients", callClients, { name: "x" }, true],
  ["partners", callPartners, { name: "x" }, true],
  ["subscriptions", callSubscriptions, {
    client_id: crypto.randomUUID(),
    product_id: crypto.randomUUID(),
    price: 1000,
  }, false],
] as const;

for (const [resource, callResource, body, hasPatch] of resources) {
  Deno.test(`${resource}: sin rol admin responde 403 Sin acceso`, async () => {
    const token = await signInNewUser(false);
    const id = crypto.randomUUID();
    const requests: [string, string, unknown?][] = [
      ["GET", ""],
      ["POST", "", body],
    ];
    if (hasPatch) requests.push(["PATCH", `/${id}`, { name: "x" }]);
    for (const [method, path, payload] of requests) {
      const res = await callResource(token, method, path, payload);
      assertEquals(res.status, 403);
      assertEquals((await res.json()).message, "Sin acceso");
    }
  });
}
