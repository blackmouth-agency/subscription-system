import { useForm } from "react-hook-form";
import { maxLength, positiveInt, requiredName } from "../forms";
import FormActions from "../molecules/FormActions";
import FormField from "../molecules/FormField";

export type NewProduct = {
  name: string;
  description: string;
  price: number;
};

export default function ProductForm({
  onSubmit,
  error,
}: {
  onSubmit: (product: NewProduct) => Promise<boolean>;
  error: string;
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<NewProduct>();

  return (
    <form
      method="post"
      onSubmit={handleSubmit(async (product) => {
        if (await onSubmit(product)) reset();
      })}
    >
      <FormField
        id="product-name"
        label="Nombre"
        error={errors.name?.message}
        {...register("name", requiredName)}
      />
      <FormField
        multiline
        id="product-description"
        label="Descripción"
        error={errors.description?.message}
        {...register("description", { maxLength: maxLength(500) })}
      />
      <FormField
        id="product-price"
        label="Precio (COP)"
        type="number"
        inputMode="numeric"
        error={errors.price?.message}
        {...register(
          "price",
          positiveInt("El precio debe ser un entero mayor a 0."),
        )}
      />
      <FormActions
        submitLabel="Crear producto"
        isSubmitting={isSubmitting}
        error={error}
      />
    </form>
  );
}
