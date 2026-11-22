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
}: {
  subscriptions: Subscription[];
  onEdit: (subscription: Subscription) => void;
  onChangeStatus: (id: string, status: string) => void;
  onShowHistory: (subscription: Subscription) => void;
}) {
  return (
    <table>
      <caption>Suscripciones</caption>
      <thead>
        <tr>
          <th scope="col">Cliente</th>
          <th scope="col">Producto</th>
          <th scope="col">Precio</th>
          <th scope="col">Fecha del ciclo</th>
          <th scope="col">Estado</th>
          <th scope="col">Socio</th>
          <th scope="col">Comisión</th>
          <th scope="col">Duración</th>
          <th scope="col">Receptor</th>
          <th scope="col">Acciones</th>
        </tr>
      </thead>
      <tbody>
        {subscriptions.map((subscription) => (
          <tr key={subscription.id}>
            <td>{subscription.client.name}</td>
            <td>{subscription.product.name}</td>
            <td>{cop.format(subscription.price)}</td>
            <td>{subscription.cycle_date}</td>
            <td>{statuses[subscription.status]}</td>
            <td>{subscription.partner?.name}</td>
            <td>{cop.format(subscription.commission)}</td>
            <td>{subscription.partner ? duration(subscription) : ""}</td>
            <td>{receivers[subscription.receiver]}</td>
            <td>
              <button type="button" onClick={() => onEdit(subscription)}>
                Editar
              </button>
              <button type="button" onClick={() => onShowHistory(subscription)}>
                Historial
              </button>
              {transitions[subscription.status].map(([status, label]) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => {
                    if (
                      status !== "cancelled" ||
                      window.confirm("¿Cancelar la suscripción?")
                    ) {
                      onChangeStatus(subscription.id, status);
                    }
                  }}
                >
                  {label}
                </button>
              ))}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
