const cop = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const statuses: Record<string, string> = {
  pending: "Pendiente",
  active: "Activa",
  suspended: "Suspendida",
  cancelled: "Cancelada",
};

const receivers: Record<string, string> = {
  agency: "Agencia",
  partner: "Socio",
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
}: {
  subscriptions: Subscription[];
  onEdit: (subscription: Subscription) => void;
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
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
