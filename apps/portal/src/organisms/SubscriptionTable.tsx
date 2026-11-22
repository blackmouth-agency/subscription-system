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

export type Subscription = {
  id: string;
  price: number;
  receiver: string;
  cycle_date: string;
  status: string;
  created_at: string;
  client: { name: string };
  product: { name: string };
};

export default function SubscriptionTable({
  subscriptions,
}: {
  subscriptions: Subscription[];
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
          <th scope="col">Receptor</th>
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
            <td>{receivers[subscription.receiver]}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
