import DataTable from "../molecules/DataTable";
import { cop, receivers, statuses } from "../subscriptionLabels";

// Acciones válidas por estado actual (espejo de la API, que es quien decide).
const transitions: Record<string, [string, string][]> = {
  pending: [
    ["active", "Activar"],
    ["cancelled", "Cancelar"],
  ],
  active: [
    ["suspended", "Suspender"],
    ["cancelled", "Cancelar"],
  ],
  suspended: [
    ["active", "Reactivar"],
    ["cancelled", "Cancelar"],
  ],
  cancelled: [],
};

const duration = (s: Subscription) =>
  s.commission_type === "months"
    ? `${s.commission_months} mensualidades`
    : s.commission_type === "once"
      ? "Única"
      : "Indefinida";

export type Subscription = {
  id: string;
  client_id: string;
  product_id: string;
  partner_id: string | null;
  price: number;
  commission: number;
  commission_type: string;
  commission_months: number | null;
  receiver: string;
  cycle_date: string;
  status: string;
  created_at: string;
  client: { name: string };
  product: { name: string };
  partner: { name: string } | null;
};

export default function SubscriptionTable({
  subscriptions,
  onEdit,
  onChangeStatus,
  onShowHistory,
  onShowInstallments,
}: {
  subscriptions: Subscription[];
  onEdit: (subscription: Subscription) => void;
  onChangeStatus: (id: string, status: string) => void;
  onShowHistory: (subscription: Subscription) => void;
  onShowInstallments: (subscription: Subscription) => void;
}) {
  return (
    <DataTable
      caption="Suscripciones"
      rows={subscriptions}
      columns={[
        { header: "Cliente", cell: (s) => s.client.name },
        { header: "Producto", cell: (s) => s.product.name },
        { header: "Precio", cell: (s) => cop.format(s.price) },
        { header: "Fecha del ciclo", cell: (s) => s.cycle_date },
        { header: "Estado", cell: (s) => statuses[s.status] },
        { header: "Socio", cell: (s) => s.partner?.name },
        { header: "Comisión", cell: (s) => cop.format(s.commission) },
        { header: "Duración", cell: (s) => (s.partner ? duration(s) : "") },
        { header: "Receptor", cell: (s) => receivers[s.receiver] },
        {
          header: "Acciones",
          cell: (s) => (
            <>
              <button type="button" onClick={() => onEdit(s)}>
                Editar
              </button>
              <button type="button" onClick={() => onShowHistory(s)}>
                Historial
              </button>
              <button type="button" onClick={() => onShowInstallments(s)}>
                Mensualidades
              </button>
              {transitions[s.status].map(([status, label]) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => {
                    if (
                      status !== "cancelled" ||
                      window.confirm("¿Cancelar la suscripción?")
                    ) {
                      onChangeStatus(s.id, status);
                    }
                  }}
                >
                  {label}
                </button>
              ))}
            </>
          ),
        },
      ]}
    />
  );
}
