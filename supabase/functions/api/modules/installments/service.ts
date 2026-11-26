import { createFactory } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { adminDb } from "../../shared/admin-db.ts";
import { bogotaToday, displayStatus } from "../../shared/installments.ts";

type Row = {
  id: string;
  subscription_id: string;
  due_date: string;
  amount: number;
  status: string;
  commission_amount: number | null;
  agency_amount: number | null;
  payment: { paid_at: string; receiver: string } | null;
  subscription: {
    status: string;
    client_id: string;
    product_id: string;
    client: { name: string };
    product: { name: string };
  };
};

const factory = createFactory<{
  Variables: { collections: { totals: unknown; rows: unknown[] } };
}>();

const sum = (
  rows: Row[],
  key: "amount" | "commission_amount" | "agency_amount",
) => rows.reduce((t, r) => t + (r[key] ?? 0), 0);

const authorizeAndList = factory.createMiddleware(async (c, next) => {
  const { authorization, apikey } = c.req.valid("header" as never);
  const q = c.req.valid("query" as never) as Record<string, string | undefined>;
  const db = await adminDb(authorization, apikey);
  let query = db.from("installments").select(
    `id, subscription_id, due_date, amount, status, commission_amount,
     agency_amount, payment:payments(paid_at, receiver),
     subscription:subscriptions!inner(status, client_id, product_id,
       client:clients(name), product:products(name))`,
  ).order("due_date", { ascending: false });
  if (q.client_id) query = query.eq("subscription.client_id", q.client_id);
  if (q.product_id) query = query.eq("subscription.product_id", q.product_id);
  if (q.from) query = query.gte("due_date", q.from);
  if (q.to) query = query.lte("due_date", q.to);
  const { data, error } = await query;
  if (error) throw new HTTPException(500, { message: "Error interno." });
  const today = bogotaToday();
  const all = (data as unknown as Row[]).map((r) => ({
    ...r,
    display_status: displayStatus(
      r,
      r.subscription.status === "cancelled",
      today,
    ),
  }));
  const rows = q.status
    ? all.filter((r) => r.display_status === q.status)
    : all;
  c.set("collections", {
    totals: {
      collected: sum(rows.filter((r) => r.status === "paid"), "amount"),
      commission: sum(rows, "commission_amount"),
      agency: sum(rows, "agency_amount"),
    },
    rows: rows.map((r) => ({
      id: r.id,
      subscription_id: r.subscription_id,
      client_id: r.subscription.client_id,
      client_name: r.subscription.client.name,
      product_id: r.subscription.product_id,
      product_name: r.subscription.product.name,
      due_date: r.due_date,
      amount: r.amount,
      display_status: r.display_status,
      paid_at: r.payment?.paid_at ?? null,
      receiver: r.payment?.receiver ?? null,
      commission_amount: r.commission_amount,
      agency_amount: r.agency_amount,
    })),
  });
  await next();
});

export const service = { authorizeAndList, factory };
