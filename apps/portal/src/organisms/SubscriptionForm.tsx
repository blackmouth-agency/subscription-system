import { useForm, useWatch } from "react-hook-form";
import FormField from "../molecules/FormField";
import type { Subscription } from "./SubscriptionTable";

export type NewSubscription = {
  client_id: string;
  product_id: string;
  price: number;
  cycle_date: string;
  partner_id: string | null;
  commission: number;
  commission_type: string;
  commission_months: number | null;
  receiver: string;
};

// `partner_id` vacío = venta directa.
type FormData = Omit<NewSubscription, "partner_id"> & { partner_id: string };

type Option = { id: string; name: string };

// `toLocaleDateString("sv")` da YYYY-MM-DD en hora local.
const today = () => new Date().toLocaleDateString("sv");

const direct = {
  commission: 0,
  commission_type: "indefinite",
  commission_months: null,
  receiver: "agency",
};

// Sirve para crear (sin `subscription`) y para editar solo el socio, la
// comisión, la duración y el receptor (con la suscripción a editar).
export default function SubscriptionForm({
  subscription,
  clients,
  products,
  partners,
  clientId = "",
  onSubmit,
  onCancel,
  error,
}: {
  subscription?: Subscription;
  clients: Option[];
  products: (Option & { price: number })[];
  partners: Option[];
  clientId?: string;
  onSubmit: (subscription: NewSubscription) => Promise<boolean>;
  onCancel: () => void;
  error: string;
}) {
  const initial: FormData = subscription
    ? { ...subscription, partner_id: subscription.partner_id ?? "" }
    : {
        client_id: clientId,
        product_id: "",
        price: NaN,
        cycle_date: today(),
        partner_id: "",
        ...direct,
      };
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ defaultValues: initial });
  const hasPartner = useWatch({ control, name: "partner_id" }) !== "";
  const isMonths = useWatch({ control, name: "commission_type" }) === "months";

  return (
    <form
      method="post"
      onSubmit={handleSubmit(async ({ partner_id, ...data }) => {
        const body: NewSubscription = partner_id
          ? { ...data, partner_id }
          : { ...data, ...direct, partner_id: null };
        if (body.commission_type !== "months") body.commission_months = null;
        if (await onSubmit(body)) reset(initial);
      })}
    >
      <label htmlFor="subscription-client">Cliente</label>
      <select
        id="subscription-client"
        disabled={!!subscription}
        {...register("client_id", { required: "Elige el cliente." })}
      >
        <option value="">Elige un cliente</option>
        {clients.map((client) => (
          <option key={client.id} value={client.id}>
            {client.name}
          </option>
        ))}
      </select>
      <span role="alert">{errors.client_id?.message}</span>
      <label htmlFor="subscription-product">Producto</label>
      <select
        id="subscription-product"
        disabled={!!subscription}
        {...register("product_id", {
          required: "Elige el producto.",
          onChange: (event) => {
            const product = products.find((p) => p.id === event.target.value);
            if (product) setValue("price", product.price);
          },
        })}
      >
        <option value="">Elige un producto</option>
        {products.map((product) => (
          <option key={product.id} value={product.id}>
            {product.name}
          </option>
        ))}
      </select>
      <span role="alert">{errors.product_id?.message}</span>
      <FormField
        id="subscription-price"
        label="Precio (COP)"
        type="number"
        inputMode="numeric"
        disabled={!!subscription}
        error={errors.price?.message}
        {...register("price", {
          valueAsNumber: true,
          validate: (price) =>
            (Number.isInteger(price) && price > 0) ||
            "El precio debe ser un entero mayor a 0.",
        })}
      />
      <FormField
        id="subscription-cycle-date"
        label="Fecha del ciclo"
        type="date"
        disabled={!!subscription}
        error={errors.cycle_date?.message}
        {...register("cycle_date", { required: "Elige la fecha del ciclo." })}
      />
      <label htmlFor="subscription-partner">Socio</label>
      <select id="subscription-partner" {...register("partner_id")}>
        <option value="">Sin socio (venta directa)</option>
        {partners.map((partner) => (
          <option key={partner.id} value={partner.id}>
            {partner.name}
          </option>
        ))}
      </select>
      {hasPartner && (
        <>
          <FormField
            id="subscription-commission"
            label="Comisión (COP)"
            type="number"
            inputMode="numeric"
            error={errors.commission?.message}
            {...register("commission", {
              valueAsNumber: true,
              validate: (commission, { price }) =>
                (Number.isInteger(commission) &&
                  commission >= 0 &&
                  // En edición el precio está deshabilitado: la API lo valida.
                  !(price > 0 && commission > price)) ||
                "La comisión debe ser un entero entre 0 y el precio.",
            })}
          />
          <label htmlFor="subscription-duration">Duración</label>
          <select id="subscription-duration" {...register("commission_type")}>
            <option value="indefinite">Indefinida</option>
            <option value="months">N mensualidades</option>
            <option value="once">Única</option>
          </select>
          {isMonths && (
            <FormField
              id="subscription-months"
              label="Mensualidades"
              type="number"
              inputMode="numeric"
              error={errors.commission_months?.message}
              {...register("commission_months", {
                valueAsNumber: true,
                validate: (months) =>
                  (Number.isInteger(months) && (months ?? 0) > 0) ||
                  "Las mensualidades deben ser un entero mayor a 0.",
              })}
            />
          )}
          <label htmlFor="subscription-receiver">Receptor</label>
          <select id="subscription-receiver" {...register("receiver")}>
            <option value="agency">Agencia</option>
            <option value="partner">Socio</option>
          </select>
        </>
      )}
      <button type="submit" disabled={isSubmitting}>
        {subscription ? "Guardar suscripción" : "Crear suscripción"}
      </button>
      {subscription && (
        <button type="button" onClick={onCancel}>
          Cancelar
        </button>
      )}
      <p role="alert">{error}</p>
    </form>
  );
}
