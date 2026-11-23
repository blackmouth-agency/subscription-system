import { useForm } from "react-hook-form";
import { positiveInt, text, today } from "../forms";
import FormActions from "../molecules/FormActions";
import FormField from "../molecules/FormField";
import SelectField from "../molecules/SelectField";
import { paymentMethods } from "../subscriptionLabels";

export type NewPayment = {
  amount: number;
  paid_at: string;
  method: string;
  reference: string;
};

const methodOptions = Object.entries(paymentMethods).map(([value, label]) => ({
  value,
  label,
}));

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
        {...register(
          "amount",
          positiveInt("El importe debe ser un entero mayor a 0."),
        )}
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
      <SelectField
        id="payment-method"
        label="Medio"
        options={methodOptions}
        {...register("method")}
      />
      <FormField
        id="payment-reference"
        label="Referencia (opcional)"
        error={errors.reference?.message}
        {...register("reference", text(200))}
      />
      <FormActions
        submitLabel="Registrar pago"
        isSubmitting={isSubmitting}
        error={error}
      />
    </form>
  );
}
