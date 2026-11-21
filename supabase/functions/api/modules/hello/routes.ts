import { Hono } from "hono";

// Walking skeleton: ruta mínima de punta a punta. Se reemplaza con la
// historia 2.
export const hello = new Hono().get(
  "/",
  (c) => c.json({ message: "Hola mundo" }),
);
