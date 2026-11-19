import { assertEquals } from "@std/assert";
import { createClient } from "@supabase/supabase-js";

const apiUrl = Deno.env.get("API_URL")!;
const noSession = { auth: { persistSession: false, autoRefreshToken: false } };
const client = createClient(
  apiUrl,
  Deno.env.get("PUBLISHABLE_KEY")!,
  noSession,
);
const admin = createClient(apiUrl, Deno.env.get("SECRET_KEY")!, noSession);

async function signUp(prefix: string, data?: Record<string, unknown>) {
  const { data: signedUp, error } = await client.auth.signUp({
    email: `${prefix}-${crypto.randomUUID()}@test.local`,
    password: "clave-de-prueba-123",
    options: { data },
  });
  assertEquals(error, null);
  return signedUp.user!.id;
}

async function acceptancesOf(userId: string) {
  const { data, error } = await admin.from("document_acceptances")
    .select("document, version")
    .eq("user_id", userId)
    .order("document");
  assertEquals(error, null);
  return data;
}

Deno.test("un registro con la aceptación deja la versión vigente de cada documento", async () => {
  const userId = await signUp("con-aceptacion", {
    accepted_legal_documents: true,
  });

  const { data: current } = await admin.from("legal_documents")
    .select("document, version")
    .order("document");
  assertEquals(current!.map(({ document }) => document), [
    "politica-de-datos",
    "terminos",
  ]);
  assertEquals(await acceptancesOf(userId), current);
});

Deno.test("un registro sin la aceptación no deja ninguna aceptación", async () => {
  const userId = await signUp("sin-aceptacion");

  assertEquals(await acceptancesOf(userId), []);
});
