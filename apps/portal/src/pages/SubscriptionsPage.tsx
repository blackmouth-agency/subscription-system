import { useAdminResource } from "../hooks/useAdminResource";
import type { Client } from "../organisms/ClientTable";
import type { Product } from "../organisms/ProductTable";
import SubscriptionForm, {
  type NewSubscription,
} from "../organisms/SubscriptionForm";
import SubscriptionTable, {
  type Subscription,
} from "../organisms/SubscriptionTable";
import FormTableTemplate from "../templates/FormTableTemplate";

// Más recientes primero, como las devuelve la API.
const newestFirst = (a: Subscription, b: Subscription) =>
  b.created_at.localeCompare(a.created_at);

export default function SubscriptionsPage({
  accessToken,
  clientId = "",
}: {
  accessToken: string;
  clientId?: string;
}) {
  const { rows, save, error } = useAdminResource<Subscription, NewSubscription>(
    clientId ? `/subscriptions?client_id=${clientId}` : "/subscriptions",
    accessToken,
    {
      loadError: "No pudimos cargar las suscripciones.",
      saveError: "No pudimos crear la suscripción.",
    },
    newestFirst,
  );
  const { rows: clients } = useAdminResource<Client, never>(
    "/clients",
    accessToken,
    { loadError: "", saveError: "" },
  );
  const { rows: products } = useAdminResource<Product, never>(
    "/products",
    accessToken,
    { loadError: "", saveError: "" },
  );

  return (
    <FormTableTemplate
      form={
        <SubscriptionForm
          clients={clients}
          products={products}
          clientId={clientId}
          onSubmit={save}
          error={error}
        />
      }
      table={<SubscriptionTable subscriptions={rows} />}
    />
  );
}
