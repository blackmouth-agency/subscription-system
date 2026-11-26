import type { Collection, Filters, View } from "../types";
import { normalizeText } from "./format";

export const noFilters: Filters = {
  status: "",
  productId: "",
  clientId: "",
  from: "",
  to: "",
};

const pad = (n: number) => String(n).padStart(2, "0");

// Mes en curso: primer y último día, como `YYYY-MM-DD`.
export function currentMonthRange(now = new Date()) {
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  const last = new Date(y, m, 0).getDate();
  return { from: `${y}-${pad(m)}-01`, to: `${y}-${pad(m)}-${pad(last)}` };
}

// Los 12 meses que muestra el mapa, del más antiguo al mes en curso.
export function mapMonths(now = new Date()) {
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
  });
}

// Filtros aplicados: el rango de fechas cuenta como uno y la búsqueda no
// cuenta. En el mapa no hay fechas.
export function appliedCount(f: Filters, view: View) {
  const fields = [f.status, f.productId, f.clientId].filter(Boolean).length;
  return fields + (view === "list" && (f.from || f.to) ? 1 : 0);
}

export function filterCollections(
  rows: Collection[],
  f: Filters,
  query: string,
  view: View,
) {
  const q = normalizeText(query.trim());
  const months = view === "map" ? mapMonths() : [];
  return rows.filter(
    (r) =>
      (!q || normalizeText(r.client).includes(q)) &&
      (!f.status || r.status === f.status) &&
      (!f.productId || r.productId === f.productId) &&
      (!f.clientId || r.clientId === f.clientId) &&
      (view === "map"
        ? months.includes(r.dueDate.slice(0, 7))
        : (!f.from || r.dueDate >= f.from) && (!f.to || r.dueDate <= f.to)),
  );
}

export function summarize(rows: Collection[]) {
  const total = rows.reduce((t, r) => t + r.amount, 0);
  return (["paid", "pending", "overdue"] as const).map((status) => {
    const part = rows.filter((r) => r.status === status);
    const amount = part.reduce((t, r) => t + r.amount, 0);
    return {
      status,
      amount,
      count: part.length,
      percent: total ? Math.round((amount / total) * 100) : 0,
    };
  });
}

// Una página de `size` elementos; `page` empieza en 1.
export const paginate = <T>(items: T[], page: number, size: number) =>
  items.slice((page - 1) * size, page * size);
