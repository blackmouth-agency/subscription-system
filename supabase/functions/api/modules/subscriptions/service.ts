import { createFactory } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { adminDb } from "../../shared/admin-db.ts";
import { crudService } from "../../shared/crud.ts";

type Subscription = {
  id: string;
  client_id: string;
  product_id: string;
  price: number;
  commission: number;
  commission_type: string;
  commission_months: number | null;
  partner_id: string | null;
  receiver: string;
  cycle_date: string;
  status: string;
  client: { name: string };
  partner: { name: string } | null;
  product: { name: string };
};

const select =
  "*, client:clients(name), product:products(name), partner:partners(name)";

const crud = crudService<Subscription>({
  table: "subscriptions",
  notFound: "Suscripción no encontrada",
  select,
  order: ["created_at", false],
  filters: ["client_id"],
  fkNotFound: {
    subscriptions_client_id_fkey: "Cliente no encontrado",
    subscriptions_product_id_fkey: "Producto no encontrado",
    subscriptions_partner_id_fkey: "Socio no encontrado",
  },
});

// Estado destino -> estados desde los que se puede llegar. `cancelled` es final.
const allowedFrom: Record<string, string[]> = {
  active: ["pending", "suspended"],
  suspended: ["active"],
  cancelled: ["pending", "active", "suspended"],
};

const statusFactory = createFactory<{ Variables: { row: Subscription } }>();

// El `update` filtra por estado de origen: una transición inválida o un
// cambio concurrente no actualizan ninguna fila (409); si la fila no existe, 404.
const authorizeAndChangeStatus = statusFactory.createMiddleware(
  async (c, next) => {
    const { authorization, apikey } = c.req.valid("header" as never);
    const { id } = c.req.valid("param" as never);
    const { status } = c.req.valid("json" as never) as { status: string };
    const db = await adminDb(authorization, apikey);
    const { data, error } = await db.from("subscriptions").update({ status })
      .eq("id", id).in("status", allowedFrom[status]).select(select);
    if (error) throw new HTTPException(500, { message: "Error interno." });
    if (data.length === 0) {
      const { data: exists } = await db.from("subscriptions").select("id")
        .eq("id", id);
      throw exists?.length
        ? new HTTPException(409, {
          message: "Transición de estado no permitida",
        })
        : new HTTPException(404, { message: "Suscripción no encontrada" });
    }
    c.set("row", data[0] as unknown as Subscription);
    await next();
  },
);

export const service = { ...crud, authorizeAndChangeStatus, statusFactory };
