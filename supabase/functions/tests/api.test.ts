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

function call(token: string, body?: unknown) {
  return fetch(`${Deno.env.get("FUNCTIONS_URL")!}/api/products`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      apikey: publishableKey,
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

Deno.test("un admin crea un producto y lo lista", async () => {
  const token = await signInNewUser(true);
  const name = `Hosting ${crypto.randomUUID()}`;

  const created = await call(token, { name, price: 50000 });
  assertEquals(created.status, 201);
  assertEquals((await created.json()).name, name);

  const list = await (await call(token)).json();
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
    const res = await call(token, body);
    assertEquals(res.status, 400);
    await res.body?.cancel();
  }
});

Deno.test("sin rol admin responde 403 Sin acceso", async () => {
  const token = await signInNewUser(false);
  for (const body of [undefined, { name: "x", price: 1000 }]) {
    const res = await call(token, body);
    assertEquals(res.status, 403);
    assertEquals((await res.json()).message, "Sin acceso");
  }
});
