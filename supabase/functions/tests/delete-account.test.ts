import { assertEquals } from "@std/assert";
import { createClient } from "@supabase/supabase-js";

const apiUrl = Deno.env.get("API_URL")!;
const functionsUrl = Deno.env.get("FUNCTIONS_URL")!;
const noSession = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(apiUrl, Deno.env.get("SECRET_KEY")!, noSession);

async function signInNewUser(prefix: string) {
  const email = `${prefix}-${crypto.randomUUID()}@test.local`;
  const password = "clave-de-prueba-123";
  const { data: created } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  const client = createClient(
    apiUrl,
    Deno.env.get("PUBLISHABLE_KEY")!,
    noSession,
  );
  const { data: signedIn } = await client.auth.signInWithPassword({
    email,
    password,
  });

  return {
    userId: created.user!.id,
    accessToken: signedIn.session!.access_token,
  };
}

async function accountExists(userId: string) {
  const { data } = await admin.auth.admin.getUserById(userId);
  return data.user !== null;
}

Deno.test("sin sesión la función no borra ninguna cuenta", async () => {
  const user = await signInNewUser("borrar-sin-sesion");

  const response = await fetch(`${functionsUrl}/delete-account`, {
    method: "POST",
    body: JSON.stringify({ user_id: user.userId }),
  });
  await response.body?.cancel();

  assertEquals(response.status, 401);
  assertEquals(await accountExists(user.userId), true);
});

Deno.test("la función borra solo la cuenta de la sesión, aunque le pidan otra", async () => {
  const ana = await signInNewUser("borrar-ana");
  const beto = await signInNewUser("sigue-beto");

  const response = await fetch(`${functionsUrl}/delete-account`, {
    method: "POST",
    headers: { Authorization: `Bearer ${ana.accessToken}` },
    body: JSON.stringify({ user_id: beto.userId }),
  });
  await response.body?.cancel();

  assertEquals(response.status, 204);
  assertEquals(await accountExists(ana.userId), false);
  assertEquals(await accountExists(beto.userId), true);
});
