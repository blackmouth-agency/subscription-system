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
      {entries.length === 0 ? (
        <p>Sin cambios registrados</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th scope="col">Fecha</th>
              <th scope="col">Quién</th>
              <th scope="col">Campo</th>
              <th scope="col">Anterior</th>
              <th scope="col">Nuevo</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => {
              const [label, format] = fields[e.field];
              return (
                <tr key={e.id}>
                  <td>{new Date(e.changed_at).toLocaleString("es-CO")}</td>
                  <td>{e.changed_by_email}</td>
                  <td>{label}</td>
                  <td>{format(e.old_value)}</td>
                  <td>{format(e.new_value)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}
