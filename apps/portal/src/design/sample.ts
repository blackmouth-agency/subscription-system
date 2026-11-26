import { mapMonths, summarize } from "./lib/collections";
import { formatMonth } from "./lib/format";
import type { Collection } from "./types";

// Datos de ejemplo de la galería (DATOS.md): 3 suscripciones × 12 meses.
const subscriptions = [
  {
    id: "s1",
    clientId: "c1",
    client: "Odontología Prado",
    product: "Sitio web",
    amount: 130000,
    overdue: 2,
  },
  {
    id: "s2",
    clientId: "c2",
    client: "Panadería Don Tulio",
    product: "Menú digital",
    amount: 60000,
    overdue: 0,
  },
  {
    id: "s3",
    clientId: "c3",
    client: "Gimnasio Norte",
    product: "Tienda en línea",
    amount: 210000,
    overdue: 1,
  },
];

export const sampleRows: Collection[] = subscriptions.flatMap((s) =>
  mapMonths().map((m, i, months) => {
    const left = months.length - 1 - i;
    const status =
      left === 0
        ? "pending"
        : left <= s.overdue
          ? "overdue"
          : ("paid" as const);
    return {
      id: `${s.id}-${m}`,
      subscriptionId: s.id,
      clientId: s.clientId,
      productId: s.product,
      client: s.client,
      product: s.product,
      dueDate: `${m}-05`,
      amount: s.amount,
      status,
      paidAt: status === "paid" ? `${m}-06` : null,
    } satisfies Collection;
  }),
);

export const sampleTotals = summarize(sampleRows);

export const sampleDebtors = subscriptions.map((s) => ({
  id: s.id,
  label: `${s.client} · ${s.product}`,
  installments: sampleRows
    .filter((r) => r.subscriptionId === s.id && r.status !== "paid")
    .map((r) => ({
      id: r.id,
      label: formatMonth(r.dueDate),
      status: r.status as "pending" | "overdue",
      amount: r.amount,
    })),
}));
