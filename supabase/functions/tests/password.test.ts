import { assertEquals, assertNotEquals } from "@std/assert";
import { createClient } from "@supabase/supabase-js";

const apiUrl = Deno.env.get("API_URL")!;
const publishableKey = Deno.env.get("PUBLISHABLE_KEY")!;
const noSession = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(apiUrl, Deno.env.get("SECRET_KEY")!, noSession);
const password = "clave-de-prueba-123";

// Crea una cuenta confirmada y abre una sesión con su contraseña.
async function signedInUser(prefix: string) {
  const email = `${prefix}-${crypto.randomUUID()}@test.local`;
  await admin.auth.admin.createUser({ email, password, email_confirm: true });
  const client = createClient(apiUrl, publishableKey, noSession);
  const { error } = await client.auth.signInWithPassword({ email, password });
  assertEquals(error, null);
  return { email, client };
}

async function canSignIn(email: string, password: string) {
  const client = createClient(apiUrl, publishableKey, noSession);
  const { error } = await client.auth.signInWithPassword({ email, password });
  return error === null;
}

Deno.test("el servidor no cambia la contraseña sin la actual", async () => {
  const { email, client } = await signedInUser("sin-clave-actual");

  const { error } = await client.auth.updateUser({
    password: "clave-nueva-456",
  });

  assertNotEquals(error, null);
  assertEquals(await canSignIn(email, password), true);
  assertEquals(await canSignIn(email, "clave-nueva-456"), false);
});
