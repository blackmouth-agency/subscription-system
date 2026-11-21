import { useForm } from "react-hook-form";
import { maxLength, trim } from "../forms";
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
  onSubmit: (product: NewProduct) => Promise<void>;
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
        await onSubmit(product);
        reset();
      })}
    >
      <FormField
        id="product-name"
        label="Nombre"
        error={errors.name?.message}
        {...register("name", {
          setValueAs: trim,
          required: "Escribe el nombre.",
          maxLength: maxLength(100),
        })}
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
        {...register("price", {
          valueAsNumber: true,
          validate: (price) =>
            (Number.isInteger(price) && price > 0) ||
            "El precio debe ser un entero mayor a 0.",
        })}
      />
      <button type="submit" disabled={isSubmitting}>
        Crear producto
      </button>
      <p role="alert">{error}</p>
    </form>
  );
}
