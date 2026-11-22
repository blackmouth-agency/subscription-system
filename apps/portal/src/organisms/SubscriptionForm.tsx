import { useForm } from "react-hook-form";
import FormField from "../molecules/FormField";

export type NewSubscription = {
  client_id: string;
  product_id: string;
  price: number;
  cycle_date: string;
};

type Option = { id: string; name: string };

// `toLocaleDateString("sv")` da YYYY-MM-DD en hora local.
const today = () => new Date().toLocaleDateString("sv");

export default function SubscriptionForm({
  clients,
  products,
  clientId = "",
  onSubmit,
  error,
}: {
  clients: Option[];
  products: (Option & { price: number })[];
  clientId?: string;
  onSubmit: (subscription: NewSubscription) => Promise<boolean>;
  error: string;
}) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<NewSubscription>({
    defaultValues: { client_id: clientId, cycle_date: today() },
  });

  return (
    <form
      method="post"
      onSubmit={handleSubmit(async (subscription) => {
        if (await onSubmit(subscription)) reset();
      })}
    >
      <label htmlFor="subscription-client">Cliente</label>
      <select
        id="subscription-client"
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
        error={errors.cycle_date?.message}
        {...register("cycle_date", { required: "Elige la fecha del ciclo." })}
      />
      <button type="submit" disabled={isSubmitting}>
        Crear suscripción
      </button>
      <p role="alert">{error}</p>
    </form>
  );
}
