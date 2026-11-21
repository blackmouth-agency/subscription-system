import { useForm } from "react-hook-form";

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
      <label htmlFor="product-name">Nombre</label>
      <input
        id="product-name"
        {...register("name", {
          setValueAs: (value: string) => value.trim(),
          required: "Escribe el nombre.",
          maxLength: { value: 100, message: "Máximo 100 caracteres." },
        })}
      />
      <span role="alert">{errors.name?.message}</span>
      <label htmlFor="product-description">Descripción</label>
      <textarea
        id="product-description"
        {...register("description", {
          maxLength: { value: 500, message: "Máximo 500 caracteres." },
        })}
      />
      <span role="alert">{errors.description?.message}</span>
      <label htmlFor="product-price">Precio (COP)</label>
      <input
        id="product-price"
        type="number"
        inputMode="numeric"
        {...register("price", {
          valueAsNumber: true,
          validate: (price) =>
            (Number.isInteger(price) && price > 0) ||
            "El precio debe ser un entero mayor a 0.",
        })}
      />
      <span role="alert">{errors.price?.message}</span>
      <button type="submit" disabled={isSubmitting}>
        Crear producto
      </button>
      <p role="alert">{error}</p>
    </form>
  );
}
