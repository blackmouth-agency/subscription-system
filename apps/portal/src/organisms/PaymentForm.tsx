import { useForm } from "react-hook-form";
import { maxLength, trim } from "../forms";
import FormField from "../molecules/FormField";
import { paymentMethods } from "../subscriptionLabels";

export type NewPayment = {
  amount: number;
  paid_at: string;
  method: string;
  reference: string;
};

const today = () => new Date().toLocaleDateString("sv");

export default function PaymentForm({
  onSubmit,
  error,
}: {
  onSubmit: (payment: NewPayment) => Promise<boolean>;
  error: string;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NewPayment>({
    defaultValues: { paid_at: today(), method: "transfer" },
  });

  return (
    <form
      method="post"
      onSubmit={handleSubmit(async (payment) => {
        if (await onSubmit(payment)) reset();
      })}
    >
      <h2>Registrar pago</h2>
      <FormField
        id="payment-amount"
        label="Importe recibido (COP)"
        type="number"
        inputMode="numeric"
        error={errors.amount?.message}
        {...register("amount", {
          valueAsNumber: true,
          validate: (amount) =>
            (Number.isInteger(amount) && amount > 0) ||
            "El importe debe ser un entero mayor a 0.",
        })}
      />
      <FormField
        id="payment-date"
        label="Fecha del pago"
        type="date"
        error={errors.paid_at?.message}
        {...register("paid_at", {
          required: "Elige la fecha.",
          validate: (date) =>
            date <= today() || "La fecha no puede ser futura.",
        })}
      />
      <label htmlFor="payment-method">Medio</label>
      <select id="payment-method" {...register("method")}>
        {Object.entries(paymentMethods).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <FormField
        id="payment-reference"
        label="Referencia (opcional)"
        error={errors.reference?.message}
        {...register("reference", {
          setValueAs: trim,
          maxLength: maxLength(200),
        })}
      />
      <button type="submit" disabled={isSubmitting}>
        Registrar pago
      </button>
      <p role="alert">{error}</p>
    </form>
  );
}
