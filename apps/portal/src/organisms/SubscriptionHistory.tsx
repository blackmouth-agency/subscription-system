import DataTable from "../molecules/DataTable";
import { cop, receivers, statuses } from "../subscriptionLabels";

export type HistoryEntry = {
  id: string;
  field: string;
  old_value: string;
  new_value: string;
  changed_by_email: string;
  changed_at: string;
};

const durations: Record<string, string> = {
  indefinite: "Indefinida",
  months: "Mensualidades",
  once: "Única",
};

const fields: Record<string, [string, (v: string) => string]> = {
  price: ["Precio", (v) => cop.format(Number(v))],
  commission: ["Comisión", (v) => cop.format(Number(v))],
  receiver: ["Receptor", (v) => receivers[v]],
  status: ["Estado", (v) => statuses[v]],
  partner_id: ["Socio", (v) => v || "Sin socio"],
  commission_type: ["Duración", (v) => durations[v]],
  commission_months: ["Mensualidades", (v) => v || "Ninguna"],
};

export default function SubscriptionHistory({
  entries,
  onClose,
}: {
  entries: HistoryEntry[];
  onClose: () => void;
}) {
  return (
    <section>
      <h2>Historial</h2>
      <button type="button" onClick={onClose}>
        Cerrar historial
      </button>
      <DataTable
        empty="Sin cambios registrados"
        rows={entries}
        columns={[
          {
            header: "Fecha",
            cell: (e) => new Date(e.changed_at).toLocaleString("es-CO"),
          },
          { header: "Quién", cell: (e) => e.changed_by_email },
          { header: "Campo", cell: (e) => fields[e.field][0] },
          { header: "Anterior", cell: (e) => fields[e.field][1](e.old_value) },
          { header: "Nuevo", cell: (e) => fields[e.field][1](e.new_value) },
        ]}
      />
    </section>
  );
}
