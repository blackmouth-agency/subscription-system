import { uuid } from "../design/lib/uuid";
import axios from "axios";
import { useMemo, useState } from "react";
import { createApi } from "../api";
import { useAdminResource } from "../hooks/useAdminResource";
import type { Client } from "../organisms/ClientTable";
import InstallmentTable, {
  type Installment,
} from "../organisms/InstallmentTable";
import PaymentForm, { type NewPayment } from "../organisms/PaymentForm";
import type { Partner } from "../organisms/PartnerTable";
import type { Product } from "../organisms/ProductTable";
import SubscriptionForm, {
  type NewSubscription,
} from "../organisms/SubscriptionForm";
import SubscriptionHistory, {
  type HistoryEntry,
} from "../organisms/SubscriptionHistory";
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
  const { rows, editing, setEditing, save, act, reload, error } =
    useAdminResource<Subscription, NewSubscription>(
      clientId ? `/subscriptions?client_id=${clientId}` : "/subscriptions",
      accessToken,
      {
        loadError: "No pudimos cargar las suscripciones.",
        saveError: "No pudimos guardar la suscripción.",
      },
      newestFirst,
    );
  const api = useMemo(() => createApi(accessToken), [accessToken]);
  const [history, setHistory] = useState<HistoryEntry[]>();
  const [historyError, setHistoryError] = useState("");
  async function showHistory({ id }: Subscription) {
    try {
      const { data } = await api.get<HistoryEntry[]>(
        `/subscriptions/${id}/history`,
      );
      setHistory(data);
      setHistoryError("");
    } catch {
      setHistoryError("No pudimos cargar el historial.");
    }
  }
  const [installments, setInstallments] = useState<Installment[]>();
  const [installmentsError, setInstallmentsError] = useState("");
  const [installmentsOf, setInstallmentsOf] = useState("");
  // Una clave por intento de pago: reintentar no cobra dos veces.
  const [paymentKey, setPaymentKey] = useState(() => uuid());
  const [paymentError, setPaymentError] = useState("");
  async function showInstallments({ id }: { id: string }) {
    try {
      setInstallmentsOf(id);
      const { data } = await api.get<Installment[]>(
        `/subscriptions/${id}/installments`,
      );
      setInstallments(data);
      setInstallmentsError("");
    } catch {
      setInstallmentsError("No pudimos cargar las mensualidades.");
    }
  }
  async function pay(payment: NewPayment) {
    try {
      await api.post(`/subscriptions/${installmentsOf}/payments`, payment, {
        headers: { "Idempotency-Key": paymentKey },
      });
      setPaymentKey(uuid());
      setPaymentError("");
      reload();
      await showInstallments({ id: installmentsOf });
      return true;
    } catch (e) {
      // Los 409 traen la regla de negocio en español.
      setPaymentError(
        axios.isAxiosError(e) && e.response?.status === 409
          ? e.response.data.message
          : "No pudimos registrar el pago.",
      );
      return false;
    }
  }
  const { rows: clients } = useAdminResource<Client, never>(
    "/clients",
    accessToken,
    { loadError: "", saveError: "" },
  );
  const { rows: partners } = useAdminResource<Partner, never>(
    "/partners",
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
          key={editing?.id}
          subscription={editing}
          onCancel={() => setEditing(undefined)}
          partners={partners.filter(
            (p) => p.is_active || p.id === editing?.partner_id,
          )}
          clients={clients}
          products={products}
          clientId={clientId}
          onSubmit={save}
          error={error}
        />
      }
      table={
        <>
          <SubscriptionTable
            subscriptions={rows}
            onEdit={setEditing}
            onChangeStatus={(id, status) => act(id, "status", { status })}
            onShowHistory={showHistory}
            onShowInstallments={showInstallments}
          />
          {installmentsError && <p role="alert">{installmentsError}</p>}
          {installments && (
            <>
              <InstallmentTable
                installments={installments}
                onClose={() => setInstallments(undefined)}
              />
              <PaymentForm onSubmit={pay} error={paymentError} />
            </>
          )}
          {historyError && <p role="alert">{historyError}</p>}
          {history && (
            <SubscriptionHistory
              entries={history}
              onClose={() => setHistory(undefined)}
            />
          )}
        </>
      }
    />
  );
}
