import { Hono } from "hono";
import { hello } from "./modules/hello/routes.ts";

const app = new Hono().basePath("/api");

app.route("/hello", hello);

app.onError((err, c) => {
  console.error(err);
  return c.json({ message: "Error interno." }, 500);
});

export default app;
