import Node from "../atoms/Node";
import { cx } from "../lib/cx";
import { formatMonth, shortMonth, statusLabels } from "../lib/format";
import type { Collection, InstallmentStatus } from "../types";

const head = "text-minimo font-normal text-tenue";

export type MapRow = {
  subscriptionId: string;
  clientId: string;
  client: string;
  product: string;
  // `YYYY-MM` -> mensualidad de ese mes
  byMonth: Record<string, Pick<Collection, "id" | "status"> | undefined>;
};

// Una fila por suscripción; el orden de las filas lo decide quien llama.
export function toMapRows(rows: Collection[]): MapRow[] {
  const bySubscription = new Map<string, MapRow>();
  for (const r of rows) {
    const row = bySubscription.get(r.subscriptionId) ?? {
      subscriptionId: r.subscriptionId,
      clientId: r.clientId,
      client: r.client,
      product: r.product,
      byMonth: {},
    };
    row.byMonth[r.dueDate.slice(0, 7)] = r;
    bySubscription.set(r.subscriptionId, row);
  }
  return [...bySubscription.values()].sort((a, b) =>
    a.client.localeCompare(b.client),
  );
}

// Suscripciones × 12 meses. Cada celda es un botón con nodo y `aria-label`
// «Mes año: estado». Pendiente o vencida abre el pago; las demás, el detalle.
export default function CollectionsMap({
  rows,
  months,
  onPay,
  onOpen,
}: {
  rows: MapRow[];
  months: string[];
  onPay: (subscriptionId: string, installmentId: string) => void;
  onOpen: (row: MapRow) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <caption className="sr-only">
          Mensualidades de los últimos 12 meses por suscripción
        </caption>
        <thead>
          <tr>
            <th scope="col" className={cx(head, "py-2.5 pr-3 pl-5 text-left")}>
              Suscripción
            </th>
            {months.map((m) => (
              <th
                key={m}
                scope="col"
                className={cx(head, "px-0.5 text-center")}
              >
                {shortMonth(`${m}-01`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.subscriptionId}>
              <th
                scope="row"
                className={cx(
                  "h-13.5 min-w-44 border-t border-linea py-1 pr-3 pl-5",
                  "text-left font-normal",
                )}
              >
                {row.client}
                <small className="block text-minimo text-tenue">
                  {row.product}
                </small>
              </th>
              {months.map((m) => {
                const c = row.byMonth[m];
                const status: InstallmentStatus = c?.status ?? "none";
                const month = formatMonth(`${m}-01`);
                const label = `${month}: ${statusLabels[status]}`;
                return (
                  <td key={m} className="h-13.5 border-t border-linea p-0">
                    <button
                      type="button"
                      aria-label={label}
                      disabled={!c}
                      onClick={() =>
                        c &&
                        (c.status === "paid"
                          ? onOpen(row)
                          : onPay(row.subscriptionId, c.id))
                      }
                      className={cx(
                        "mx-auto grid size-9 place-items-center",
                        "rounded-chico hover:bg-realce",
                        "disabled:hover:bg-transparent @max-movil/app:size-11",
                      )}
                    >
                      <Node status={status} large />
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
