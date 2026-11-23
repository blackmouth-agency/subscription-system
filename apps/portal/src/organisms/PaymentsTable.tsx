import DataTable from "../molecules/DataTable";
import { cop, installmentStatuses, receivers } from "../subscriptionLabels";

export type Collection = {
  id: string;
  client_name: string;
  product_name: string;
  due_date: string;
  amount: number;
  display_status: string;
  receiver: string | null;
  commission_amount: number | null;
  agency_amount: number | null;
};

export type Totals = { collected: number; commission: number; agency: number };

const money = (n: number | null) => (n === null ? "—" : cop.format(n));

export default function PaymentsTable({
  rows,
  totals,
}: {
  rows: Collection[];
  totals: Totals;
}) {
  return (
    <section>
      <h2>Cobros</h2>
      <p>
        Recaudado: {cop.format(totals.collected)} · Comisiones:{" "}
        {cop.format(totals.commission)} · Agencia: {cop.format(totals.agency)}
      </p>
      <p>La atribución registrada no es constancia de transferencia.</p>
      <DataTable
        empty="Sin cobros"
        rows={rows}
        columns={[
          { header: "Cliente", cell: (r) => r.client_name },
          { header: "Producto", cell: (r) => r.product_name },
          { header: "Periodo", cell: (r) => r.due_date },
          { header: "Monto", cell: (r) => cop.format(r.amount) },
          {
            header: "Estado",
            cell: (r) => installmentStatuses[r.display_status],
          },
          {
            header: "Receptor",
            cell: (r) => (r.receiver ? receivers[r.receiver] : "—"),
          },
          { header: "Comisión", cell: (r) => money(r.commission_amount) },
          { header: "Agencia", cell: (r) => money(r.agency_amount) },
        ]}
      />
    </section>
  );
}
