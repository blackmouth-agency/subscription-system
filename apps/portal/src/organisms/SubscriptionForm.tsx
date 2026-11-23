import { useForm, useWatch } from "react-hook-form";
import { positiveInt, toOptions, today } from "../forms";
import FormActions from "../molecules/FormActions";
import FormField from "../molecules/FormField";
import SelectField from "../molecules/SelectField";
import { receivers } from "../subscriptionLabels";
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

type Row = { id: string; name: string };

const durations = [
  { value: "indefinite", label: "Indefinida" },
  { value: "months", label: "N mensualidades" },
  { value: "once", label: "Única" },
];

const receiverOptions = Object.entries(receivers).map(([value, label]) => ({
  value,
  label,
}));

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
  clients: Row[];
  products: (Row & { price: number })[];
  partners: Row[];
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
      <SelectField
        id="subscription-client"
        label="Cliente"
        placeholder="Elige un cliente"
        options={toOptions(clients)}
        disabled={!!subscription}
        error={errors.client_id?.message}
        {...register("client_id", { required: "Elige el cliente." })}
      />
      <SelectField
        id="subscription-product"
        label="Producto"
        placeholder="Elige un producto"
        options={toOptions(products)}
        disabled={!!subscription}
        error={errors.product_id?.message}
        {...register("product_id", {
          required: "Elige el producto.",
          onChange: (event) => {
            const product = products.find((p) => p.id === event.target.value);
            if (product) setValue("price", product.price);
          },
        })}
      />
      <FormField
        id="subscription-price"
        label="Precio (COP)"
        type="number"
        inputMode="numeric"
        disabled={!!subscription}
        error={errors.price?.message}
        {...register(
          "price",
          positiveInt("El precio debe ser un entero mayor a 0."),
        )}
      />
      <FormField
        id="subscription-cycle-date"
        label="Fecha del ciclo"
        type="date"
        disabled={!!subscription}
        error={errors.cycle_date?.message}
        {...register("cycle_date", { required: "Elige la fecha del ciclo." })}
      />
      <SelectField
        id="subscription-partner"
        label="Socio"
        placeholder="Sin socio (venta directa)"
        options={toOptions(partners)}
        {...register("partner_id")}
      />
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
          <SelectField
            id="subscription-duration"
            label="Duración"
            options={durations}
            {...register("commission_type")}
          />
          {isMonths && (
            <FormField
              id="subscription-months"
              label="Mensualidades"
              type="number"
              inputMode="numeric"
              error={errors.commission_months?.message}
              {...register(
                "commission_months",
                positiveInt("Las mensualidades deben ser un entero mayor a 0."),
              )}
            />
          )}
          <SelectField
            id="subscription-receiver"
            label="Receptor"
            options={receiverOptions}
            {...register("receiver")}
          />
        </>
      )}
      <FormActions
        submitLabel={subscription ? "Guardar suscripción" : "Crear suscripción"}
        isSubmitting={isSubmitting}
        onCancel={subscription && onCancel}
        error={error}
      />
    </form>
  );
}
