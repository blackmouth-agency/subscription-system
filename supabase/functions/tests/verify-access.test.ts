import { assertEquals } from "@std/assert";
import { createClient } from "@supabase/supabase-js";

const apiUrl = Deno.env.get("API_URL")!;
const functionsUrl = Deno.env.get("FUNCTIONS_URL")!;
const noSession = { auth: { persistSession: false, autoRefreshToken: false } };
const admin = createClient(
  apiUrl,
  Deno.env.get("SECRET_KEY")!,
  noSession,
);

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

Deno.test("responde con el contenido a un usuario con acceso a conoce-mas", async () => {
  const user = await signInNewUser("con-acceso");
  const { data: project } = await admin.from("projects")
    .upsert({ slug: "conoce-mas" }, { onConflict: "slug" })
    .select().single();
  await admin.from("entitlements").insert({
    user_id: user.userId,
    project_id: project!.id,
  });

  const response = await fetch(
    `${functionsUrl}/verify-access?project=conoce-mas`,
    {
      headers: { Authorization: `Bearer ${user.accessToken}` },
    },
  );

  assertEquals(response.status, 200);
  assertEquals(await response.json(), { content: "Bienvenido a conoce-mas" });
});

Deno.test("responde que no hay acceso a un usuario sin acceso", async () => {
  const user = await signInNewUser("sin-acceso");

  const response = await fetch(
    `${functionsUrl}/verify-access?project=conoce-mas`,
    {
      headers: { Authorization: `Bearer ${user.accessToken}` },
    },
  );

  assertEquals(response.status, 403);
  assertEquals(await response.json(), {
    error: "No tienes acceso a conoce-mas",
  });
});

Deno.test("rechaza una petición sin sesión", async () => {
  const response = await fetch(
    `${functionsUrl}/verify-access?project=conoce-mas`,
  );
  await response.body?.cancel();

  assertEquals(response.status, 401);
});
