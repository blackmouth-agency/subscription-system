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

Deno.test("suscripciones: asigna socio, edita y vuelve a venta directa", async () => {
  const token = await signInNewUser(true);
  const client = await (await callClients(token, "POST", "", { name: "A" }))
    .json();
  const product = await (await callProducts(token, "POST", "", {
    name: "P",
    price: 50000,
  })).json();
  const partner = await (await callPartners(token, "POST", "", { name: "S" }))
    .json();
  const inactive = await (await callPartners(token, "POST", "", {
    name: "I",
    is_active: false,
  })).json();
  const base = { client_id: client.id, product_id: product.id, price: 50000 };
  const terms = {
    partner_id: partner.id,
    commission: 5000,
    commission_type: "months",
    commission_months: 3,
    receiver: "partner",
  };

  const created = await callSubscriptions(token, "POST", "", {
    ...base,
    ...terms,
  });
  assertEquals(created.status, 201);
  const row = await created.json();
  assertEquals(
    [row.partner.name, row.commission, row.commission_months, row.receiver],
    ["S", 5000, 3, "partner"],
  );

  // Cambiar a `once` borra la cantidad de mensualidades.
  const once = await callSubscriptions(token, "PATCH", `/${row.id}`, {
    commission_type: "once",
  });
  assertEquals(once.status, 200);
  const onceRow = await once.json();
  assertEquals(
    [onceRow.commission_type, onceRow.commission_months, onceRow.price],
    ["once", null, 50000],
  );

  const direct = await callSubscriptions(token, "PATCH", `/${row.id}`, {
    partner_id: null,
    commission: 0,
    receiver: "agency",
  });
  assertEquals(direct.status, 200);
  assertEquals((await direct.json()).partner, null);

  const calls: [string, string, unknown, number, string?][] = [
    [
      "POST",
      "",
      { ...base, ...terms, partner_id: crypto.randomUUID() },
      404,
      "Socio no encontrado",
    ],
    [
      "POST",
      "",
      { ...base, ...terms, partner_id: inactive.id },
      409,
      "El socio está inactivo",
    ],
    [
      "PATCH",
      `/${row.id}`,
      { partner_id: inactive.id },
      409,
      "El socio está inactivo",
    ],
    [
      "PATCH",
      `/${row.id}`,
      { partner_id: crypto.randomUUID() },
      404,
      "Socio no encontrado",
    ],
    [
      "PATCH",
      `/${crypto.randomUUID()}`,
      { commission: 1 },
      404,
      "Suscripción no encontrada",
    ],
    ["PATCH", `/${row.id}`, { commission: 60000 }, 400],
    ["PATCH", `/${row.id}`, { receiver: "partner" }, 400],
    ["PATCH", `/${row.id}`, { commission_months: 2 }, 400],
    ["PATCH", `/${row.id}`, { commission: -1 }, 400],
    ["PATCH", `/${row.id}`, { price: 1 }, 400],
    ["POST", "", { ...base, commission_months: 2 }, 400],
  ];
  for (const [method, path, body, status, message] of calls) {
    const res = await callSubscriptions(token, method, path, body);
    assertEquals(res.status, status, JSON.stringify(body));
    if (message) assertEquals((await res.json()).message, message);
    else await res.body?.cancel();
  }
});

Deno.test("suscripciones: cambia de estado solo por transiciones válidas", async () => {
  const token = await signInNewUser(true);
  const client = await (await callClients(token, "POST", "", { name: "A" }))
    .json();
  const product = await (await callProducts(token, "POST", "", {
    name: "P",
    price: 50000,
  })).json();
  const create = async () =>
    (await (await callSubscriptions(token, "POST", "", {
      client_id: client.id,
      product_id: product.id,
      price: 50000,
    })).json()).id as string;
  const change = (id: string, status: string) =>
    callSubscriptions(token, "POST", `/${id}/status`, { status });

  const id = await create();
  const steps: [string, number, string?][] = [
    ["suspended", 409, "Transición de estado no permitida"],
    ["active", 200],
    ["active", 409, "Transición de estado no permitida"],
    ["suspended", 200],
    ["active", 200],
    ["cancelled", 200],
    ["active", 409, "Transición de estado no permitida"],
    ["cancelled", 409, "Transición de estado no permitida"],
  ];
  for (const [status, code, message] of steps) {
    const res = await change(id, status);
    assertEquals(res.status, code, status);
    const body = await res.json();
    if (message) assertEquals(body.message, message);
    else assertEquals(body.status, status);
  }

  // Una pendiente se cancela directo.
  const direct = await change(await create(), "cancelled");
  assertEquals(direct.status, 200);
  await direct.body?.cancel();

  for (
    const [path, body, status, message] of [
      [
        `/${crypto.randomUUID()}/status`,
        { status: "active" },
        404,
        "Suscripción no encontrada",
      ],
      [`/${id}/status`, { status: "pending" }, 400],
      [`/${id}/status`, {}, 400],
      ["/no-uuid/status", { status: "active" }, 400],
    ] as const
  ) {
    const res = await callSubscriptions(token, "POST", path, body);
    assertEquals(res.status, status, path);
    if (message) assertEquals((await res.json()).message, message);
    else await res.body?.cancel();
  }

  const forbidden = await callSubscriptions(
    await signInNewUser(false),
    "POST",
    `/${id}/status`,
    { status: "active" },
  );
  assertEquals(forbidden.status, 403);
  await forbidden.body?.cancel();
});

Deno.test("suscripciones: lista el historial de cambios, el más reciente primero", async () => {
  const token = await signInNewUser(true);
  const client = await (await callClients(token, "POST", "", { name: "A" }))
    .json();
  const product = await (await callProducts(token, "POST", "", {
    name: "P",
    price: 50000,
  })).json();
  const partner = await (await callPartners(token, "POST", "", { name: "S" }))
    .json();
  const sub = await (await callSubscriptions(token, "POST", "", {
    client_id: client.id,
    product_id: product.id,
    price: 50000,
  })).json();
  const history = async () =>
    await (await callSubscriptions(token, "GET", `/${sub.id}/history`)).json();

  assertEquals(await history(), []);

  await (await callSubscriptions(token, "POST", `/${sub.id}/status`, {
    status: "active",
  })).body?.cancel();
  await (await callSubscriptions(token, "PATCH", `/${sub.id}`, {
    partner_id: partner.id,
  })).body?.cancel();

  const rows = await history();
  assertEquals(
    rows.map((
      r: { field: string; old_value: string; new_value: string },
    ) => [r.field, r.old_value, r.new_value]),
    [["partner_id", "", "S"], ["status", "pending", "active"]],
  );
  assertEquals(rows[0].changed_by_email.endsWith("@test.local"), true);

  const missing = await callSubscriptions(
    token,
    "GET",
    `/${crypto.randomUUID()}/history`,
  );
  assertEquals(missing.status, 404);
  assertEquals((await missing.json()).message, "Suscripción no encontrada");
  const bad = await callSubscriptions(token, "GET", "/no-uuid/history");
  assertEquals(bad.status, 400);
  await bad.body?.cancel();

  const forbidden = await callSubscriptions(
    await signInNewUser(false),
    "GET",
    `/${sub.id}/history`,
  );
  assertEquals(forbidden.status, 403);
  await forbidden.body?.cancel();
});

Deno.test("suscripciones: lista las mensualidades con su estado calculado", async () => {
  const token = await signInNewUser(true);
  const client = await (await callClients(token, "POST", "", { name: "A" }))
    .json();
  const product = await (await callProducts(token, "POST", "", {
    name: "P",
    price: 50000,
  })).json();
  const create = async () =>
    (await (await callSubscriptions(token, "POST", "", {
      client_id: client.id,
      product_id: product.id,
      price: 50000,
    })).json()).id as string;
  const list = async (id: string) =>
    await (await callSubscriptions(token, "GET", `/${id}/installments`))
      .json() as { due_date: string; display_status: string }[];
  const daysAgo = (n: number) =>
    new Date(Date.now() - n * 86_400_000).toLocaleDateString("en-CA", {
      timeZone: "America/Bogota",
    });

  const id = await create();
  assertEquals(await list(id), []);

  // Sin API de escritura: se siembra por la conexión directa.
  const { default: postgres } = await import("postgres");
  const sql = postgres(Deno.env.get("DB_URL")!);
  const seed = (sub: string) =>
    sql`insert into public.installments (subscription_id, due_date, amount, status) values
      (${sub}, ${daysAgo(30)}, 50000, 'pending'),
      (${sub}, ${daysAgo(4)}, 50000, 'pending'),
      (${sub}, ${daysAgo(3)}, 50000, 'pending'),
      (${sub}, ${daysAgo(0)}, 50000, 'to_activate')`;
  await seed(id);
  const cancelledId = await create();
  await seed(cancelledId);
  await sql`update public.subscriptions set status = 'cancelled' where id = ${cancelledId}`;
  await sql.end();

  assertEquals((await list(id)).map((i) => i.display_status), [
    "overdue",
    "overdue",
    "pending",
    "to_activate",
  ]);
  assertEquals((await list(cancelledId)).map((i) => i.display_status), [
    "voided",
    "voided",
    "voided",
    "voided",
  ]);

  const missing = await callSubscriptions(
    token,
    "GET",
    `/${crypto.randomUUID()}/installments`,
  );
  assertEquals(missing.status, 404);
  assertEquals((await missing.json()).message, "Suscripción no encontrada");
  const bad = await callSubscriptions(token, "GET", "/no-uuid/installments");
  assertEquals(bad.status, 400);
  await bad.body?.cancel();

  const forbidden = await callSubscriptions(
    await signInNewUser(false),
    "GET",
    `/${id}/installments`,
  );
  assertEquals(forbidden.status, 403);
  await forbidden.body?.cancel();
});

Deno.test("suscripciones: registra pagos manuales de las mensualidades más antiguas", async () => {
  const token = await signInNewUser(true);
  const client = await (await callClients(token, "POST", "", { name: "A" }))
    .json();
  const product = await (await callProducts(token, "POST", "", {
    name: "P",
    price: 50000,
  })).json();
  const create = async () =>
    (await (await callSubscriptions(token, "POST", "", {
      client_id: client.id,
      product_id: product.id,
      price: 50000,
    })).json()).id as string;
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Bogota",
  });
  const pay = (
    id: string,
    body: unknown,
    key: string | null = crypto.randomUUID(),
    auth = token,
  ) =>
    fetch(`${apiRoot}/subscriptions/${id}/payments`, {
      method: "POST",
      headers: {
        apikey: publishableKey,
        authorization: `Bearer ${auth}`,
        "content-type": "application/json",
        ...(key ? { "idempotency-key": key } : {}),
      },
      body: JSON.stringify(body),
    });
  const valid = { amount: 100000, paid_at: today, method: "transfer" };

  const id = await create();
  const { default: postgres } = await import("postgres");
  const sql = postgres(Deno.env.get("DB_URL")!);
  await sql`insert into public.installments (subscription_id, due_date, amount, status) values
    (${id}, '2026-01-10', 50000, 'to_activate'),
    (${id}, '2026-02-10', 50000, 'to_activate'),
    (${id}, '2026-03-10', 50000, 'to_activate')`;
  const cancelledId = await create();
  await sql`insert into public.installments (subscription_id, due_date, amount, status)
    values (${cancelledId}, '2026-01-10', 50000, 'pending')`;
  await sql`update public.subscriptions set status = 'cancelled' where id = ${cancelledId}`;
  await sql.end();

  // Importe que no es suma de mensualidades completas.
  const partial = await pay(id, { ...valid, amount: 75000 });
  assertEquals(partial.status, 409);
  assertEquals(
    (await partial.json()).message,
    "El importe no corresponde a mensualidades completas",
  );

  const key = crypto.randomUUID();
  const ok = await pay(id, valid, key);
  assertEquals(ok.status, 201);
  const payment = await ok.json();
  assertEquals(payment.amount, 100000);
  assertEquals(
    payment.installments.map((i: { status: string }) => i.status),
    ["paid", "paid"],
  );

  // Repetir la clave devuelve el original sin pagar otra vez.
  const again = await pay(id, valid, key);
  assertEquals(again.status, 201);
  assertEquals((await again.json()).id, payment.id);

  // El primer pago activó la suscripción y la historia 10 ve "paid".
  const list = await (await callSubscriptions(
    token,
    "GET",
    `/${id}/installments`,
  )).json() as { display_status: string }[];
  assertEquals(list.map((i) => i.display_status), ["paid", "paid", "overdue"]);
  const [sub] = await (await callSubscriptions(token, "GET")).json()
    .then((rows: { id: string; status: string }[]) =>
      rows.filter((r) => r.id === id)
    );
  assertEquals(sub.status, "active");

  // Ya no alcanza para dos; la última sí y luego no queda nada.
  assertEquals((await pay(id, valid)).status, 409);
  assertEquals((await pay(id, { ...valid, amount: 50000 })).status, 201);
  const none = await pay(id, { ...valid, amount: 50000 });
  assertEquals(none.status, 409);
  assertEquals((await none.json()).message, "No hay mensualidades por pagar");

  const cancelled = await pay(cancelledId, { ...valid, amount: 50000 });
  assertEquals(cancelled.status, 409);
  assertEquals(
    (await cancelled.json()).message,
    "La suscripción está cancelada",
  );

  const missing = await pay(crypto.randomUUID(), valid);
  assertEquals(missing.status, 404);
  assertEquals((await missing.json()).message, "Suscripción no encontrada");

  for (
    const [path, body, k] of [
      [id, valid, null],
      [id, valid, "no-uuid"],
      ["no-uuid", valid, crypto.randomUUID()],
      [id, { ...valid, amount: 0 }, crypto.randomUUID()],
      [id, { ...valid, amount: 1.5 }, crypto.randomUUID()],
      [id, { ...valid, method: "card" }, crypto.randomUUID()],
      [id, { ...valid, paid_at: "2999-01-01" }, crypto.randomUUID()],
      [id, { ...valid, reference: "x".repeat(201) }, crypto.randomUUID()],
    ] as const
  ) {
    const res = await pay(path, body, k);
    assertEquals(res.status, 400, JSON.stringify([path, body, k]));
    await res.body?.cancel();
  }

  const forbidden = await pay(
    id,
    valid,
    crypto.randomUUID(),
    await signInNewUser(false),
  );
  assertEquals(forbidden.status, 403);
  assertEquals((await forbidden.json()).message, "Sin acceso");
});

const resources = [
  ["products", callProducts, { name: "x", price: 1000 }, undefined],
  ["clients", callClients, { name: "x" }, { name: "x" }],
  ["partners", callPartners, { name: "x" }, { name: "x" }],
  ["subscriptions", callSubscriptions, {
    client_id: crypto.randomUUID(),
    product_id: crypto.randomUUID(),
    price: 1000,
  }, { commission: 0 }],
] as const;

for (const [resource, callResource, body, patch] of resources) {
  Deno.test(`${resource}: sin rol admin responde 403 Sin acceso`, async () => {
    const token = await signInNewUser(false);
    const id = crypto.randomUUID();
    const requests: [string, string, unknown?][] = [
      ["GET", ""],
      ["POST", "", body],
    ];
    if (patch) requests.push(["PATCH", `/${id}`, patch]);
    for (const [method, path, payload] of requests) {
      const res = await callResource(token, method, path, payload);
      assertEquals(res.status, 403);
      assertEquals((await res.json()).message, "Sin acceso");
    }
  });
}

const bogotaToday = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "America/Bogota" });

Deno.test("cobros: lista con filtros, búsqueda, páginas y totales", async () => {
  const token = await signInNewUser(true);
  const post = async (call: typeof callClients, body: unknown) =>
    await (await call(token, "POST", "", body)).json();
  const client = await post(callClients, { name: "A" });
  const other = await post(callClients, { name: "Éb" });
  const p1 = await post(callProducts, { name: "P1", price: 50000 });
  const p2 = await post(callProducts, { name: "P2", price: 20000 });
  const sub = (client_id: string, product_id: string, price: number) =>
    post(callSubscriptions, { client_id, product_id, price }).then((s) =>
      s.id as string
    );
  const s1 = await sub(client.id, p1.id, 50000);
  const s2 = await sub(client.id, p2.id, 20000);
  const s3 = await sub(other.id, p1.id, 50000);

  const { default: postgres } = await import("postgres");
  const sql = postgres(Deno.env.get("DB_URL")!);
  await sql`insert into public.installments (subscription_id, due_date, amount, status) values
    (${s1}, '2026-01-10', 50000, 'to_activate'),
    (${s1}, '2026-02-10', 50000, 'to_activate'),
    (${s2}, '2099-01-10', 20000, 'pending'),
    (${s3}, '2026-01-10', 50000, 'pending')`;
  await sql.end();
  const today = bogotaToday();
  const paid = await fetch(`${apiRoot}/subscriptions/${s1}/payments`, {
    method: "POST",
    headers: {
      apikey: publishableKey,
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      "idempotency-key": crypto.randomUUID(),
    },
    body: JSON.stringify({ amount: 50000, paid_at: today, method: "cash" }),
  });
  assertEquals(paid.status, 201);
  await paid.body?.cancel();

  type Out = {
    any: boolean;
    total: number;
    totals: {
      status: string;
      amount: number;
      count: number;
      percent: number;
    }[];
    rows: Record<string, unknown>[];
  };
  const list = async (qs: string): Promise<Out> =>
    await (await fetch(`${apiRoot}/installments?${qs}`, {
      headers: { apikey: publishableKey, authorization: `Bearer ${token}` },
    })).json();
  const mine = `client_id=${client.id}`;

  const all = await list(mine);
  assertEquals(all.any, true);
  assertEquals(all.total, 3);
  // Más reciente primero.
  assertEquals(all.rows.map((r) => r.due_date), [
    "2099-01-10",
    "2026-02-10",
    "2026-01-10",
  ]);
  assertEquals(all.rows.map((r) => r.status), ["pending", "overdue", "paid"]);
  const first = all.rows[2];
  assertEquals(first.paid_at, today);
  assertEquals(first.client_name, "A");
  assertEquals(first.product_name, "P1");
  assertEquals(first.client_id, client.id);
  assertEquals(first.product_id, p1.id);
  // La lista no lleva datos que el portal no usa.
  assertEquals("receiver" in first, false);
  assertEquals(all.totals, [
    { status: "paid", amount: 50000, count: 1, percent: 42 },
    { status: "pending", amount: 20000, count: 1, percent: 17 },
    { status: "overdue", amount: 50000, count: 1, percent: 42 },
  ]);

  assertEquals((await list(`${mine}&product_id=${p2.id}`)).rows.length, 1);
  assertEquals((await list(`${mine}&status=overdue`)).rows.length, 1);
  assertEquals((await list(`${mine}&status=pending`)).rows.length, 1);
  // Periodo inclusivo en ambos extremos.
  assertEquals(
    (await list(`${mine}&from=2026-01-10&to=2026-02-10`)).rows.length,
    2,
  );
  // Los totales siguen al filtro, no a la página.
  const overdue = await list(`${mine}&status=overdue`);
  assertEquals(overdue.totals[2], {
    status: "overdue",
    amount: 50000,
    count: 1,
    percent: 100,
  });
  assertEquals(overdue.totals[0].count, 0);
  const paged = await list(`${mine}&size=2&page=2`);
  assertEquals(paged.rows.length, 1);
  assertEquals(paged.total, 3);
  assertEquals(paged.totals, all.totals);
  assertEquals((await list(`${mine}&size=2&page=9`)).rows, []);
  // La búsqueda ignora mayúsculas y acentos.
  assertEquals((await list(`client_id=${other.id}&q=EB`)).rows.length, 1);
  assertEquals((await list(`client_id=${other.id}&q=zz`)).rows.length, 0);
  assertEquals((await list(`${mine}&q=%20a%20`)).rows.length, 3);
  assertEquals(
    (await list(`client_id=${other.id}`)).rows[0].status,
    "overdue",
  );
  const none = await list(`client_id=${crypto.randomUUID()}`);
  assertEquals(none.rows, []);
  assertEquals(none.any, true);

  for (
    const qs of [
      "from=2026-02-01&to=2026-01-01",
      "client_id=x",
      "status=x",
      "status=voided",
      "page=0",
      "size=0",
      "size=101",
    ]
  ) {
    const bad = await fetch(`${apiRoot}/installments?${qs}`, {
      headers: { apikey: publishableKey, authorization: `Bearer ${token}` },
    });
    assertEquals(bad.status, 400, qs);
    await bad.body?.cancel();
  }

  const noAdmin = await signInNewUser(false);
  for (const path of ["", "/map", "/payable", "/options"]) {
    const forbidden = await fetch(`${apiRoot}/installments${path}`, {
      headers: { apikey: publishableKey, authorization: `Bearer ${noAdmin}` },
    });
    assertEquals(forbidden.status, 403, path);
    await forbidden.body?.cancel();
  }
});

Deno.test("cobros: mapa, mensualidades por pagar y opciones", async () => {
  const token = await signInNewUser(true);
  const headers = {
    apikey: publishableKey,
    authorization: `Bearer ${token}`,
    "content-type": "application/json",
  };
  const post = async (call: typeof callClients, body: unknown) =>
    await (await call(token, "POST", "", body)).json();
  const client = await post(callClients, { name: "Ñu" });
  const product = await post(callProducts, { name: "Mapa", price: 30000 });
  const subId: string = (await post(callSubscriptions, {
    client_id: client.id,
    product_id: product.id,
    price: 30000,
  })).id;
  const today = bogotaToday();
  const old = new Date(Date.parse(today) - 40 * 86_400_000).toISOString()
    .slice(0, 10);
  const { default: postgres } = await import("postgres");
  const sql = postgres(Deno.env.get("DB_URL")!);
  await sql`insert into public.installments (subscription_id, due_date, amount, status) values
    (${subId}, ${old}, 30000, 'pending'),
    (${subId}, ${today}, 30000, 'pending')`;
  await sql.end();
  const get = async (path: string) =>
    await (await fetch(`${apiRoot}/installments${path}`, { headers })).json();

  type Debt = { id: string; due_date: string; amount: number; status: string };
  const payable = async () =>
    (await get("/payable")).find((p: { subscription_id: string }) =>
      p.subscription_id === subId
    );
  const debt = await payable();
  assertEquals(debt.client_name, "Ñu");
  assertEquals(debt.product_name, "Mapa");
  assertEquals(
    debt.installments.map((i: Debt) => [i.due_date, i.amount, i.status]),
    [[old, 30000, "overdue"], [today, 30000, "pending"]],
  );

  const map = await get(`/map?client_id=${client.id}`);
  assertEquals(map.months.length, 12);
  assertEquals(map.months[11], today.slice(0, 7));
  assertEquals(map.total, 1);
  assertEquals(map.rows[0].client_name, "Ñu");
  assertEquals(map.rows[0].product_name, "Mapa");
  assertEquals(map.rows[0].months[today.slice(0, 7)].status, "pending");
  assertEquals(
    map.totals.reduce((n: number, t: { count: number }) => n + t.count, 0),
    2,
  );
  assertEquals((await get(`/map?client_id=${client.id}&q=zz`)).rows, []);

  const options = await get("/options");
  assertEquals(
    options.clients.some((c: { id: string }) => c.id === client.id),
    true,
  );
  assertEquals(
    options.products.some((p: { id: string }) => p.id === product.id),
    true,
  );

  // Pagar la más antigua la saca de las mensualidades por pagar.
  const pay = await fetch(`${apiRoot}/subscriptions/${subId}/payments`, {
    method: "POST",
    headers: { ...headers, "idempotency-key": crypto.randomUUID() },
    body: JSON.stringify({ amount: 30000, paid_at: today, method: "cash" }),
  });
  assertEquals(pay.status, 201);
  await pay.body?.cancel();
  const after = await payable();
  assertEquals(after.installments.map((i: Debt) => i.due_date), [today]);
});
