import { createFactory } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { adminDb } from "../../shared/admin-db.ts";
import { crudService } from "../../shared/crud.ts";
import { bogotaToday, displayStatus } from "../../shared/installments.ts";

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

const historyFactory = createFactory<{ Variables: { history: unknown[] } }>();

const authorizeAndListHistory = historyFactory.createMiddleware(
  async (c, next) => {
    const { authorization, apikey } = c.req.valid("header" as never);
    const { id } = c.req.valid("param" as never);
    const db = await adminDb(authorization, apikey);
    const { data: exists } = await db.from("subscriptions").select("id")
      .eq("id", id);
    if (!exists?.length) {
      throw new HTTPException(404, { message: "Suscripción no encontrada" });
    }
    const { data, error } = await db.from("subscription_history").select("*")
      .eq("subscription_id", id).order("changed_at", { ascending: false });
    if (error) throw new HTTPException(500, { message: "Error interno." });
    c.set("history", data);
    await next();
  },
);

const installmentsFactory = createFactory<
  { Variables: { installments: unknown[] } }
>();

const authorizeAndListInstallments = installmentsFactory.createMiddleware(
  async (c, next) => {
    const { authorization, apikey } = c.req.valid("header" as never);
    const { id } = c.req.valid("param" as never);
    const db = await adminDb(authorization, apikey);
    const { data: sub } = await db.from("subscriptions").select("status")
      .eq("id", id);
    if (!sub?.length) {
      throw new HTTPException(404, { message: "Suscripción no encontrada" });
    }
    const { data, error } = await db.from("installments").select("*")
      .eq("subscription_id", id).order("due_date");
    if (error) throw new HTTPException(500, { message: "Error interno." });
    const today = bogotaToday();
    const cancelled = sub[0].status === "cancelled";
    c.set(
      "installments",
      data.map((i) => ({
        ...i,
        display_status: displayStatus(i, cancelled, today),
      })),
    );
    await next();
  },
);

const paymentFactory = createFactory<{ Variables: { payment: unknown } }>();

// La RPC lanza 42501 (sin acceso), P0002 (no existe) o P0001 (regla: 409).
const authorizeAndPay = paymentFactory.createMiddleware(async (c, next) => {
  const h = c.req.valid("header" as never) as Record<string, string>;
  const { id } = c.req.valid("param" as never);
  const body = c.req.valid("json" as never) as {
    amount: number;
    paid_at: string;
    method: string;
    reference: string;
  };
  const db = await adminDb(h.authorization, h.apikey);
  const { data, error } = await db.rpc("register_payment", {
    p_subscription_id: id,
    p_amount: body.amount,
    p_paid_at: body.paid_at,
    p_method: body.method,
    p_reference: body.reference,
    p_idempotency_key: h["idempotency-key"],
  });
  if (error) {
    const status = { "42501": 403, P0002: 404, P0001: 409 }[error.code];
    throw new HTTPException((status ?? 500) as 403 | 404 | 409 | 500, {
      message: status ? error.message : "Error interno.",
    });
  }
  const { data: installments, error: e2 } = await db.from("installments")
    .select("*").eq("payment_id", data.id).order("due_date");
  if (e2) throw new HTTPException(500, { message: "Error interno." });
  c.set("payment", { ...data, installments });
  await next();
});

export const service = {
  ...crud,
  authorizeAndPay,
  paymentFactory,
  authorizeAndListInstallments,
  installmentsFactory,
  authorizeAndChangeStatus,
  statusFactory,
  authorizeAndListHistory,
  historyFactory,
};
