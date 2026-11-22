import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { products } from "./modules/products/routes.ts";
import { clients } from "./modules/clients/routes.ts";
import { partners } from "./modules/partners/routes.ts";
import { subscriptions } from "./modules/subscriptions/routes.ts";

const app = new Hono().basePath("/api");

app.route("/products", products);
app.route("/clients", clients);
app.route("/partners", partners);
app.route("/subscriptions", subscriptions);

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ message: err.message }, err.status);
  }
  console.error(err);
  return c.json({ message: "Error interno." }, 500);
});

export default app;
