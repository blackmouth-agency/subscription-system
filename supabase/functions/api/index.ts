import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { products } from "./modules/products/routes.ts";

const app = new Hono().basePath("/api");

app.route("/products", products);

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ message: err.message }, err.status);
  }
  console.error(err);
  return c.json({ message: "Error interno." }, 500);
});

export default app;
