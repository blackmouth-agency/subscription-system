import { assertEquals } from "@std/assert";

Deno.test("GET /api/hello responde Hola mundo", async () => {
  const res = await fetch(`${Deno.env.get("FUNCTIONS_URL")!}/api/hello`, {
    headers: { apikey: Deno.env.get("PUBLISHABLE_KEY")! },
  });
  assertEquals(res.status, 200);
  assertEquals(await res.json(), { message: "Hola mundo" });
});
